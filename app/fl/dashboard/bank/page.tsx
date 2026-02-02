"use client";

import { BankConfig } from "@/config/type";
import getBankAccounts from "@/lib/services/bankaccount.services";
import { useState, useEffect } from "react";

export default function BankDashboardPage() {
  const [data, setData] = useState<BankConfig[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleAccounts, setVisibleAccounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getBankAccounts();
        setData(result);
      } catch (error) {
        console.error("Error fetching bank data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Toggle visibility account number
  const toggleAccountVisibility = (id: string) => {
    setVisibleAccounts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Mask account number
  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '••••••••' + accountNumber.slice(-4);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-light">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl font-light tracking-tight text-slate-900 dark:text-slate-50 mb-3">
            Bank Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-light">
            Manage your financial accounts
          </p>
        </div>

        {/* Bank Cards Grid */}
        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((bank, index) => (
              <div
                key={bank.id}
                className="relative group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                
                {/* Card */}
                <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-all duration-500 hover:shadow-2xl">
                  {/* Decorative background */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent dark:from-blue-400/10 dark:via-purple-400/10 rounded-full blur-3xl"></div>
                  
                  <div className="relative p-6">
                    {/* Bank Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 tracking-wider uppercase">
                          Bank Account
                        </p>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                          {bank.bank_name.split('_').join(' ')}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {bank.account_name}
                        </p>
                      </div>
                      
                      {/* Bank Logo */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                    </div>

                    {/* Account Number with Toggle */}
                    <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                          Account Number
                        </p>
                        <button
                          onClick={() => toggleAccountVisibility(bank.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                          {visibleAccounts[bank.id] ? (
                            <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-lg font-mono tracking-wider text-slate-900 dark:text-slate-100">
                        {visibleAccounts[bank.id] ? bank.account_number : maskAccountNumber(bank.account_number || "XXXXXXXX")}
                      </p>
                    </div>

                    {/* Balance with Toggle */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                          Current Balance
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                          {formatCurrency(bank.current_balance || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2 mt-6">
                      {bank.is_active && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
                          Active
                        </span>
                      )}
                      {bank.is_free && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Error State */
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-light text-slate-900 dark:text-slate-100 mb-2">
              No Bank Account Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Please configure your bank account first
            </p>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out both;
        }
      `}</style>
    </div>
  );
}