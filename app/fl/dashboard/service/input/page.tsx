'use client'
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Smartphone, MapPin, MessageSquare, 
  Save, X, Loader2, FileText, CheckCircle2, PhoneCall, 
  Calendar, Camera, Image as ImageIcon, ScanLine, Sparkles
} from 'lucide-react';
import { GetNoNota } from "@/config/getNoNota";
import { createClient } from '@/lib/supabase/client';

// ==========================================================
// SCAN NOTA FISIK via Gemini (@google/genai)
// ==========================================================
// Foto dikirim ke API route /api/scan-nota (server-side, API key aman di sana).
// Gemini balikin JSON udah rapi per-field, gak perlu regex parsing manual lagi.
// Hasilnya cuma ngisi form (preview), user tetep review sebelum "Simpan Transaksi".
// ==========================================================

type ScanNotaResult = {
  customer_name?: string | null;
  customer_phone_number?: string | null;
  phone_brand?: string | null;
  imei?: string | null;
  complaint?: string | null;
  initial_price?: string | null;
  entry_date?: string | null;
  error?: string;
};

// Convert File jadi base64 murni (tanpa prefix "data:image/...;base64,")
const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
};

export default function InputDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // --- State buat fitur scan nota ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanBanner, setScanBanner] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  // ==========================================================
  // SCAN NOTA — dipanggil dari input "galeri" ATAU "kamera langsung"
  // ==========================================================
  const runOcrScan = async (file: File) => {
    setIsScanning(true);
    setScanProgress(0);
    setScanBanner(null);

    try {
      setScanProgress(30); // encoding
      const { base64, mimeType } = await fileToBase64(file);

      setScanProgress(60); // ngirim ke Gemini
      const res = await fetch('/api/scan-nota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const parsed: ScanNotaResult = await res.json();

      if (!res.ok || parsed.error) {
        throw new Error(parsed.error || 'Gagal membaca nota');
      }

      setScanProgress(90);

      setFormData((prev) => ({
        ...prev,
        customer_name: parsed.customer_name || prev.customer_name,
        customer_phone_number: parsed.customer_phone_number || prev.customer_phone_number,
        phone_brand: parsed.phone_brand || prev.phone_brand,
        imei: parsed.imei || prev.imei,
        complaint: parsed.complaint || prev.complaint,
        initial_price: parsed.initial_price || prev.initial_price,
        entry_datetime: parsed.entry_date
          ? `${parsed.entry_date}T${prev.entry_datetime.split('T')[1] || '00:00'}`
          : prev.entry_datetime,
      }));

      const filledCount = [
        parsed.customer_name,
        parsed.customer_phone_number,
        parsed.phone_brand,
        parsed.imei,
        parsed.complaint,
        parsed.initial_price,
        parsed.entry_date,
      ].filter(Boolean).length;

      setScanProgress(100);
      setScanBanner(
        filledCount > 0
          ? `${filledCount} field berhasil kebaca otomatis. Cek dulu ya sebelum simpen!`
          : 'Gak ada teks yang kebaca jelas. Coba foto lebih terang/fokus, atau isi manual aja.'
      );
    } catch (err) {
      console.error('Gemini scan error:', err);
      setScanBanner('Gagal membaca foto nota. Coba lagi atau isi manual.');
    } finally {
      // Gak ada file yang disimpen di mana pun — cuma numpang di memory browser
      // buat di-encode base64 lalu dikirim sekali ke server, abis itu dibuang.
      setIsScanning(false);
      setScanProgress(0);
      setTimeout(() => setScanBanner(null), 5000);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset value biar bisa pilih file yang sama lagi di lain waktu
    e.target.value = '';
    if (!file) return;
    runOcrScan(file);
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

      let finalInvoiceId = formData.invoice_id;
      if(!finalInvoiceId || finalInvoiceId.includes("ERROR") || !finalInvoiceId.includes("GPS-")){
        const { data: freshId, error:rpcError } = await supabase.schema('glory')
        .rpc('preview_next_invoice_id', {p_location: formData.service_location});

        if(rpcError || !freshId){
          alert('gagal mendapatkan Nomor Nota dari Server');
          throw new Error("gagal mendapatkan Nomor Nota dari Server")
        }
        finalInvoiceId = freshId
      }

      // LANGKAH 2: Simpan transaksi service
      const { error: transError } = await supabase
        .schema('glory')
        .from('services_transactions')
        .insert([{
          invoice_id: finalInvoiceId,
          customer_id: customerId,
          entry_datetime: new Date(formData.entry_datetime).toISOString(),
          recipient_name: formData.recipient,
          phone_brand: formData.phone_brand,
          phone_imei: formData.imei || null,
          complaint: formData.complaint,
          phisical_condition: formData.phisical_condition,
          initial_price: parseFloat(formData.initial_price) || 0, 
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

  const scanButtonsDisabled = isLoading || showSuccess || isScanning;

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

        {/* Scan Nota Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-900 dark:text-white">
              Scan Nota Fisik
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              (opsional, hasil tetap bisa diedit sebelum disimpan)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={scanButtonsDisabled}
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium rounded-lg border border-blue-200 dark:border-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              Foto Langsung
            </button>
            <button
              type="button"
              disabled={scanButtonsDisabled}
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg border border-slate-200 dark:border-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-5 h-5" />
              Pilih dari Galeri
            </button>
          </div>

          {/* Input tersembunyi: kamera langsung (capture=environment buka kamera belakang di Chrome/Safari mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelected}
          />
          {/* Input tersembunyi: pilih dari galeri (tanpa atribut capture) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />

          <AnimatePresence>
            {scanBanner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2"
              >
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{scanBanner}</span>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Scanning Overlay */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center"
              >
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  Membaca Nota...
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Foto lagi diproses, gak disimpan kok
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-600 dark:bg-blue-500"
                    animate={{ width: `${scanProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">{scanProgress}%</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}