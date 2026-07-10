use axum::{extract::State, http::HeaderMap, Json};
use uuid::Uuid;

use crate::{error::AppError, models::{TransferRequest, TransferResponse}, state::AppState};

#[derive(sqlx::FromRow)]
struct AccountRow {
    #[allow(dead_code)]
    id: String,
    currency: String,
    balance_minor: i64,
    status: String,
}

pub async fn create_transfer(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<TransferRequest>,
) -> Result<Json<TransferResponse>, AppError> {
    if req.amount_minor <= 0 {
        return Err(AppError::InvalidAmount);
    }
    if req.from_account_id == req.to_account_id {
        return Err(AppError::SameAccountTransfer);
    }

    let idempotency_key = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    // Idempotent replay: if we've already posted a transaction under this key,
    // return the original result instead of moving money twice.
    if let Some(ref key) = idempotency_key {
        if let Some(existing) = fetch_existing_by_idempotency_key(&state, key).await? {
            return Ok(Json(existing));
        }
    }

    let mut tx = state.pool.begin().await?;

    // Lock both rows within this write transaction. SQLite serializes writers,
    // so this prevents concurrent transfers from double-spending the same balance.
    let from_account: AccountRow = sqlx::query_as(
        "SELECT id, currency, balance_minor, status FROM accounts WHERE id = ?",
    )
    .bind(&req.from_account_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::AccountNotFound(req.from_account_id.clone()))?;

    let to_account: AccountRow = sqlx::query_as(
        "SELECT id, currency, balance_minor, status FROM accounts WHERE id = ?",
    )
    .bind(&req.to_account_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| AppError::AccountNotFound(req.to_account_id.clone()))?;

    if from_account.status != "active" || to_account.status != "active" {
        return Err(AppError::AccountNotActive);
    }
    if from_account.currency != to_account.currency {
        return Err(AppError::CurrencyMismatch);
    }
    if from_account.balance_minor < req.amount_minor {
        return Err(AppError::InsufficientBalance);
    }

    let new_from_balance = from_account.balance_minor - req.amount_minor;
    let new_to_balance = to_account.balance_minor + req.amount_minor;

    let tx_id = Uuid::new_v4().to_string();
    let reference = format!("TRF-{}", &tx_id[..8].to_uppercase());

    let insert_tx_result = sqlx::query(
        r#"INSERT INTO transactions (id, reference, tx_type, status, idempotency_key, description)
           VALUES (?, ?, 'transfer', 'posted', ?, ?)"#,
    )
    .bind(&tx_id)
    .bind(&reference)
    .bind(&idempotency_key)
    .bind(&req.description)
    .execute(&mut *tx)
    .await;

    if let Err(sqlx::Error::Database(db_err)) = &insert_tx_result {
        if db_err.is_unique_violation() {
            // Raced with another request using the same idempotency key.
            drop(tx);
            if let Some(key) = idempotency_key {
                if let Some(existing) = fetch_existing_by_idempotency_key(&state, &key).await? {
                    return Ok(Json(existing));
                }
            }
            return Err(AppError::DuplicateIdempotencyKey);
        }
    }
    insert_tx_result?;

    let debit_entry_id = Uuid::new_v4().to_string();
    sqlx::query(
        r#"INSERT INTO ledger_entries (id, transaction_id, account_id, direction, amount_minor, balance_after_minor)
           VALUES (?, ?, ?, 'DEBIT', ?, ?)"#,
    )
    .bind(&debit_entry_id)
    .bind(&tx_id)
    .bind(&req.from_account_id)
    .bind(req.amount_minor)
    .bind(new_from_balance)
    .execute(&mut *tx)
    .await?;

    let credit_entry_id = Uuid::new_v4().to_string();
    sqlx::query(
        r#"INSERT INTO ledger_entries (id, transaction_id, account_id, direction, amount_minor, balance_after_minor)
           VALUES (?, ?, ?, 'CREDIT', ?, ?)"#,
    )
    .bind(&credit_entry_id)
    .bind(&tx_id)
    .bind(&req.to_account_id)
    .bind(req.amount_minor)
    .bind(new_to_balance)
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE accounts SET balance_minor = ? WHERE id = ?")
        .bind(new_from_balance)
        .bind(&req.from_account_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query("UPDATE accounts SET balance_minor = ? WHERE id = ?")
        .bind(new_to_balance)
        .bind(&req.to_account_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(Json(TransferResponse {
        transaction_id: tx_id,
        reference,
        status: "posted".to_string(),
        from_account_balance_minor: new_from_balance,
        to_account_balance_minor: new_to_balance,
    }))
}

async fn fetch_existing_by_idempotency_key(
    state: &AppState,
    key: &str,
) -> Result<Option<TransferResponse>, AppError> {
    let row: Option<(String, String, String)> = sqlx::query_as(
        "SELECT id, reference, status FROM transactions WHERE idempotency_key = ?",
    )
    .bind(key)
    .fetch_optional(&state.pool)
    .await?;

    let Some((tx_id, reference, status)) = row else {
        return Ok(None);
    };

    // Pull the resulting balances from the ledger entries this transaction created.
    let balances: Vec<(String, i64)> = sqlx::query_as(
        "SELECT account_id, balance_after_minor FROM ledger_entries WHERE transaction_id = ? AND direction = ?",
    )
    .bind(&tx_id)
    .bind("DEBIT")
    .fetch_all(&state.pool)
    .await?;
    let from_balance = balances.first().map(|(_, b)| *b).unwrap_or(0);

    let credit_balances: Vec<(String, i64)> = sqlx::query_as(
        "SELECT account_id, balance_after_minor FROM ledger_entries WHERE transaction_id = ? AND direction = ?",
    )
    .bind(&tx_id)
    .bind("CREDIT")
    .fetch_all(&state.pool)
    .await?;
    let to_balance = credit_balances.first().map(|(_, b)| *b).unwrap_or(0);

    Ok(Some(TransferResponse {
        transaction_id: tx_id,
        reference,
        status,
        from_account_balance_minor: from_balance,
        to_account_balance_minor: to_balance,
    }))
}