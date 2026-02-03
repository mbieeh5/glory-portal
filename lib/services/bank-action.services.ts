"use server"; 

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";

export async function updateTransactionStatus(id: number, newStatus: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .schema("glory")
    .from("bank_transactions")
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString() 
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  // Refresh halaman biar data tabel update otomatis
  revalidatePath("/dashboard/mutasi"); 
}