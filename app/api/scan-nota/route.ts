import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// PENTING: API key cuma dipegang di server (env var), gak pernah kekirim ke browser.
// Taruh di .env.local:  GEMINI_API_KEY=xxxxxxxxxxxx
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Schema output biar Gemini balikin JSON rapi & konsisten field-nya,
// bukan teks bebas yang harus di-regex lagi kayak Tesseract dulu.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    customer_name: { type: Type.STRING, nullable: true },
    customer_phone_number: { type: Type.STRING, nullable: true },
    phone_brand: { type: Type.STRING, nullable: true },
    imei: { type: Type.STRING, nullable: true },
    complaint: { type: Type.STRING, nullable: true },
    initial_price: { type: Type.STRING, nullable: true },
    entry_date: { type: Type.STRING, nullable: true }, // format YYYY-MM-DD
  },
};

const PROMPT = `
Kamu membaca foto nota servis HP fisik dari toko "Glory Part Station".
Nota ini formatnya: label tercetak (mis. "Nama :", "No. Telp :") diikuti nilai TULISAN TANGAN di sampingnya atau di dalam kotak.

Ambil HANYA nilai tulisan tangannya (JANGAN ikutkan teks label/cetakan) untuk field berikut:

- customer_name: isi dari baris "Nama"
- customer_phone_number: isi dari baris "No. Telp" — HANYA digit angka, tanpa spasi/simbol
- phone_brand: isi dari baris "Merk/Type"
- imei: isi dari baris "IMEI" — kalau kosong/tidak ditulis, isi null (JANGAN mengarang)
- complaint: isi dari kotak "Keluhan" — gabungkan semua baris tulisan jadi satu kalimat utuh
- initial_price: isi dari baris "Estimasi Biaya : Rp." — HANYA digit angka, buang semua titik pemisah ribuan
- entry_date: isi dari baris "Tgl Masuk" — konversi ke format YYYY-MM-DD. Contoh: kalau tertulis 14 / 07 / 20..26 artinya tanggal 14 bulan 07 tahun 2026, jadi "2026-07-14"

Kalau suatu field benar-benar tidak terbaca atau tidak ada tulisannya, isi null untuk field itu. JANGAN menebak-nebak atau mengarang nilai.
Balas HANYA JSON sesuai schema yang diminta, tanpa penjelasan tambahan apapun.
`;

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Gambar tidak ditemukan di request' }, { status: 400 });
    }

    // Catatan: gambar (base64) cuma numpang lewat di request ini untuk diteruskan
    // ke Gemini. Gak ada proses write ke disk/storage/DB di route ini sama sekali.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPT },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const rawText = response.text ?? '{}';
    const parsed = JSON.parse(rawText);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Gemini OCR error:', err);
    return NextResponse.json({ error: 'Gagal membaca nota' }, { status: 500 });
  }
}