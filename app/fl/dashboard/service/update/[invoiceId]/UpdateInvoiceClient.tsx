'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  User, 
  Phone,
  Wrench,
  DollarSign,
  Package,
  Clock,
} from 'lucide-react';
import { ServicesCustomer, ServiceTransaction, SparepartItems } from '@/config/type';
import { updateInvoice } from '@/lib/services/invoice-action.services';

const TECHNICIANS = [
  { value: '', label: 'Pilih Teknisi', hasFee: false },
  { value: 'ibnu', label: 'Ibnu', hasFee: true },
  { value: 'rraf', label: 'Rraf', hasFee: false },
  { value: 'Mr.X', label: 'Mr.X', hasFee: false },
  { value: 'Unyil', label: 'Unyil', hasFee: true },
];

const WARRANTIES = [
  '3-Hari',
  '7-Hari',
  '14-Hari',
  '30-Hari',
  '60-Hari',
  '90-Hari',
  '180-Hari',
  '365-Hari',
];

const STATUSES = [
  { value: 'in_process', label: 'Dalam Proses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'canceled', label: 'Dibatalkan' },
];

interface Props {
  initialData: ServiceTransaction;
  invoiceId: string;
}

export default function UpdateInvoiceClient({ initialData, invoiceId }: Props) {
  const [formData, setFormData] = useState<ServiceTransaction>(initialData);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const selectedTechnician = TECHNICIANS.find(t => t.value === formData.technician);
  const showTechnicianFee = selectedTechnician?.hasFee || false;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomersInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      customers_info: {
        ...(prev.customers_info || {}),
        [name] : value,
      } as ServicesCustomer
    }))
  }

  const formatDateTimeLocal = (isoString:string | null) => {
    if(!isoString) return '';
    return new Date(isoString).toISOString().slice(0,16);
  }
 
  const handleTechnicianChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const techValue = e.target.value;
    const tech = TECHNICIANS.find(t => t.value === techValue);
    
    setFormData(prev => ({
      ...prev,
      technician: techValue,
      technician_fee: tech?.hasFee ? prev.technician_fee : null,
    }));
  };
  
  const handleSparepartChange = <K extends keyof SparepartItems>(index: number, field: K, value: SparepartItems[K]) => {
    const updatedSpareparts = [...(formData.spareparts || [])];
    updatedSpareparts[index] = {
      ...updatedSpareparts[index],
      [field]: value,
    };
    setFormData(prev => ({ ...prev, spareparts: updatedSpareparts }));
  };

  const addSparepart = () => {
    const newSparepart = {
      id: Date.now(),
      invoice_id: invoiceId,
      sparepart_name: '',
      sparepart_price: 0,
      sparepart_warranty: null,
      sparepart_variant: null,
    };
    setFormData(prev => ({
      ...prev,
      spareparts: [...(prev.spareparts || []), newSparepart],
    }));
  };

  const removeSparepart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      spareparts: prev.spareparts?.filter((_, i) => i !== index),
    }));
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  // 1. Ambil data SEBELUM masuk async/transition
  const currentForm = e.currentTarget;
  const formDataObj = new FormData(currentForm);
  
  // 2. Tambahin data spareparts
  formDataObj.append('spareparts', JSON.stringify(formData.spareparts || []));

  startTransition(async () => {
    const result = await updateInvoice(formDataObj);
    if (result.success) {
      setSuccess(result.message);
      router.push('/fl/dashboard/service/daily');
    } else {
      setError(result.message);
    }
  });
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Update Invoice
                </h1>
                <p className="text-orange-100">
                  Invoice ID: <span className="font-mono font-bold">{invoiceId}</span>
                </p>
                <p className="text-orange-100">
                  Penerima: <span className="font-mono font-bold">{formData.recipient_name}</span>
                </p>
              </div>
              </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            <input type="hidden" name="invoice_id" value={invoiceId} />

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Customer Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="text-orange-500" size={20} />
                Informasi Pelanggan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    name="customer_id"
                    value={formData.customer_id}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    readOnly
                  />
                </div>
                <div >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Penerima
                  </label>
                  <input
                    type="text"
                    name="recipient_name"
                    value={formData.recipient_name}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customers_info?.customer_name || ''}
                    onChange={handleCustomersInfoChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nomor Hp Pelanggan
                  </label>
                  <input
                    type="text"
                    name="customer_phone_number"
                    value={formData.customers_info?.customer_phone_number || ''}
                    onChange={handleCustomersInfoChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Device Info */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Phone className="text-purple-500" size={20} />
                Informasi Perangkat
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Merk HP
                  </label>
                  <input
                    type="text"
                    name="phone_brand"
                    value={formData.phone_brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IMEI
                  </label>
                  <input
                    type="text"
                    name="phone_imei"
                    value={formData.phone_imei || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Service Details */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Wrench className="text-orange-500" size={20} />
                Detail Servis
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tanggal Masuk
                    </label>
                    <input
                      type="datetime-local"
                      name="entry_datetime"
                      value={formatDateTimeLocal(formData.entry_datetime)}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lokasi
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keluhan
                  </label>
                  <textarea
                    name="complaint"
                    value={formData.complaint}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Perlakuan
                  </label>
                  <textarea
                    name="treatment"
                    value={formData.treatment || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kondisi Fisik
                  </label>
                  <textarea
                    name="phisical_condition"
                    value={formData.phisical_condition || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            {/* Technician */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="text-purple-500" size={20} />
                Teknisi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Teknisi
                  </label>
                  <select
                    name="technician"
                    value={formData.technician || ""}
                    onChange={handleTechnicianChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    required
                  >
                    {TECHNICIANS.map(tech => (
                      <option key={tech.value} value={tech.value}>
                        {tech.label}
                      </option>
                    ))}
                  </select>
                </div>
                {showTechnicianFee && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Biaya Teknisi
                    </label>
                    <input
                      type="number"
                      name="technician_fee"
                      value={formData.technician_fee || 0}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                      required
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Spareparts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Package className="text-orange-500" size={20} />
                  Sparepart
                </h2>
                <button
                  type="button"
                  onClick={addSparepart}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-lg hover:from-orange-600 hover:to-purple-700 transition-all text-sm font-medium"
                >
                  <Plus size={16} />
                  Tambah
                </button>
              </div>

              <div className="space-y-4">
                {formData.spareparts?.map((sparepart, index) => (
                  <div
                    key={sparepart.id}
                    className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Sparepart #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSparepart(index)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nama Sparepart
                        </label>
                        <input
                          type="text"
                          value={sparepart.sparepart_name}
                          onChange={(e) =>
                            handleSparepartChange(index, 'sparepart_name', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Varian
                        </label>
                        <input
                          type="text"
                          value={sparepart.sparepart_variant || ''}
                          onChange={(e) =>
                            handleSparepartChange(index, 'sparepart_variant', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Harga
                        </label>
                        <input
                          type="number"
                          value={sparepart.sparepart_price}
                          onChange={(e) =>
                            handleSparepartChange(index, 'sparepart_price', Number(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Garansi
                        </label>
                        <select
                          value={sparepart.sparepart_warranty || ''}
                          onChange={(e) =>
                            handleSparepartChange(index, 'sparepart_warranty', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                        >
                          <option value="">Pilih Garansi</option>
                          {WARRANTIES.map(warranty => (
                            <option key={warranty} value={warranty}>
                              {warranty}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {(!formData.spareparts || formData.spareparts.length === 0) && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 italic">
                    Belum ada sparepart. Klik &quot;Tambah&quot; untuk menambahkan.
                  </div>
                )}
              </div>
            </section>

            {/* Pricing */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <DollarSign className="text-purple-500" size={20} />
                Harga
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Awal
                  </label>
                  <input
                    type="number"
                    name="initial_price"
                    value={formData.initial_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Harga Akhir
                  </label>
                  <input
                    type="number"
                    name="final_price"
                    value={formData.final_price || 0}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Status */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Clock className="text-orange-500" size={20} />
                Status & Pengambilan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                    required
                  >
                    {STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waktu Pengambilan
                  </label>
                  <input
                    type="datetime-local"
                    name="pickedup_at"
                    value={formData.pickedup_at || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-orange-400 dark:focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 dark:border-gray-600">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Save size={20} />
                    Simpan Perubahan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isPending}
                className="flex-1 sm:flex-none border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X size={20} />
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}