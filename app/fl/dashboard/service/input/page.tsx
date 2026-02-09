'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Phone, Smartphone, MapPin, MessageSquare, 
  Save, X, Loader2, FileText, CheckCircle2, PhoneCall, 
  Calendar
} from 'lucide-react';
import { GetNoNota } from "@/config/getNoNota";
import { createClient } from '@/lib/supabase/client';

export default function InputDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Helper function buat format datetime ke format input datetime-local
  const getLocalDateTime = () => {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm (format yang diterima input datetime-local)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    invoice_id: 'Loading...',
    customer_name: '',
    entry_datetime: getLocalDateTime(), // Otomatis isi tanggal & jam sekarang
    customer_phone_number: '',
    recipient: '',
    complaint: '',
    phisical_condition: '',
    phone_brand: '',
    imei: '',
    initial_price: '',
    service_location: '', 
  });

  // Ambil ID default dan user profile saat pertama kali load
  useEffect(() => {
    const initData = async () => {
      const supabase = createClient();

      // Ambil ID default nota
      const defaultID = await GetNoNota(null);

      // Ambil user yang lagi login
      const { data: { user } } = await supabase.auth.getUser();

      let username = 'Admin';

      if (user) {
        // Ambil full_name dari tabel profiles
        const { data: profileData, error } = await supabase
          .schema('glory')
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profileData?.full_name) {
          username = profileData.full_name;
        }
        
        if (error) console.error("Error ambil profil:", error);
      }

      setFormData(prev => ({
        ...prev,
        invoice_id: defaultID,
        recipient: username
      }));
    };

    initData();
  }, []);

  // Handler khusus untuk perubahan lokasi service
  const handleLocationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    
    setFormData(prev => ({ ...prev, service_location: newLocation, invoice_id: "Updating..." }));

    // Fetch nomor nota baru berdasarkan lokasi
    const newNota = await GetNoNota(newLocation);

    setFormData(prev => ({
      ...prev,
      service_location: newLocation,
      invoice_id: newNota
    }));
  };

  // Handler untuk input biasa
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();

    try {
      // LANGKAH 1: Cek apakah customer dengan nomor HP ini sudah ada
      const { data: existingCustomer } = await supabase
        .schema('glory')
        .from('services_customers')
        .select('customer_id, customer_name')
        .eq('customer_phone_number', formData.customer_phone_number)
        .maybeSingle();

      let customerId: string;

      if (existingCustomer) {
        // Customer sudah ada, update nama kalau beda
        if (existingCustomer.customer_name !== formData.customer_name) {
          const { error: updateError } = await supabase
            .schema('glory')
            .from('services_customers')
            .update({ customer_name: formData.customer_name })
            .eq('customer_id', existingCustomer.customer_id);
          
          if (updateError) throw updateError;
        }
        customerId = existingCustomer.customer_id;
      } else {
        // Customer baru, insert data
        const { data: newCustomer, error: insertError } = await supabase
          .schema('glory')
          .from('services_customers')
          .insert({
            customer_name: formData.customer_name,
            customer_phone_number: formData.customer_phone_number,
          })
          .select('customer_id')
          .single();

        if (insertError) throw insertError;
        customerId = newCustomer.customer_id;
      }
      if(!formData.invoice_id.includes("GPS-")){
        alert('silahkan Ulangi kembali')
        return handleReset();
      }

      // LANGKAH 2: Simpan transaksi service
      const { error: transError } = await supabase
        .schema('glory')
        .from('services_transactions')
        .insert([{
          invoice_id: formData.invoice_id,
          customer_id: customerId, // Pake customerId dari langkah sebelumnya
          entry_datetime: new Date(formData.entry_datetime).toISOString(), // Convert ke ISO string
          recipient_name: formData.recipient,
          phone_brand: formData.phone_brand,
          phone_imei: formData.imei || null, // Null kalo kosong
          complaint: formData.complaint,
          phisical_condition: formData.phisical_condition,
          initial_price: parseFloat(formData.initial_price) || 0, // Convert ke number
          location: formData.service_location,
          status: 'in_process'
        }]);

      if (transError) throw transError;

      // Tampilkan success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleReset();
      }, 2000);

    } catch (error) {
      console.error("Error saat menyimpan data:", error);
      alert("Terjadi kesalahan saat menyimpan data!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    const defaultID = await GetNoNota(null);
    
    setFormData(prev => ({
      ...prev,
      invoice_id: defaultID,
      customer_name: '',
      customer_phone_number: '',
      entry_datetime: getLocalDateTime(), // Reset ke waktu sekarang
      complaint: '',
      phisical_condition: '',
      phone_brand: '',
      imei: '',
      initial_price: '',
      service_location: '',
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                Service Transaction
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Input data transaksi servis baru
              </p>
            </div>
          </div>
        </motion.div>

        {/* Invoice Number Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Invoice Number
            </span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {formData.invoice_id}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Penerima
            </span>
            <span className="text-lg font-semibold text-slate-900 dark:text-white">
              {formData.recipient}
            </span>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {/* Entry DateTime Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Tanggal & Waktu Masuk
              </h2>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  name="entry_datetime"
                  value={formData.entry_datetime}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Customer Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Informasi Customer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nama Customer *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Masukkan nama customer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nomor Telepon *
                  </label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="customer_phone_number"
                      value={formData.customer_phone_number}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Device Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Informasi Device
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Brand HP *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="phone_brand"
                      value={formData.phone_brand}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="Contoh: Samsung, iPhone, Xiaomi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    IMEI (Opsional)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="imei"
                      value={formData.imei}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="15 digit IMEI"
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Service Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Informasi Service
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Keluhan/Kerusakan *
                  </label>
                  <textarea
                    name="complaint"
                    value={formData.complaint}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white resize-none"
                    placeholder="Deskripsikan keluhan atau kerusakan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Kondisi Fisik *
                  </label>
                  <textarea
                    name="phisical_condition"
                    value={formData.phisical_condition}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white resize-none"
                    placeholder="Deskripsikan kondisi fisik handphone (lecet, retak, dll)..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Lokasi Service *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      <select
                        name="service_location"
                        value={formData.service_location}
                        onChange={handleLocationChange}
                        required
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                      >
                        <option value="">Pilih lokasi...</option>
                        <option value="Sukahati">Sukahati</option>
                        <option value="Cikaret">Cikaret</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Estimasi Harga *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        Rp
                      </span>
                      <input
                        type="number"
                        name="initial_price"
                        value={formData.initial_price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="1000"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <motion.button
                type="submit"
                disabled={isLoading || showSuccess}
                whileHover={{ scale: isLoading || showSuccess ? 1 : 1.02 }}
                whileTap={{ scale: isLoading || showSuccess ? 1 : 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : showSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Berhasil!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Transaksi
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleReset}
                disabled={isLoading || showSuccess}
                whileHover={{ scale: isLoading || showSuccess ? 1 : 1.02 }}
                whileTap={{ scale: isLoading || showSuccess ? 1 : 0.98 }}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                Reset Form
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-green-500 dark:bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold">Transaksi berhasil disimpan!</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}