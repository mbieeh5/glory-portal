import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const PROMPT = `
Kamu membaca foto nota servis HP fisik dari toko "Glory Part Station".

Nota ini memiliki label tercetak dan tulisan tangan.

Extract data berikut dan balas HANYA JSON.

Format JSON:

{
  "customer_name": string|null,
  "customer_phone_number": string|null,
  "phone_brand": string|null,
  "imei": string|null,
  "complaint": string|null,
  "initial_price": string|null,
  "entry_date": string|null
}

Rules:

- customer_name = isi Nama
- customer_phone_number = hanya digit angka
- phone_brand = isi Merk/Type
- imei = hanya isi IMEI, kalau kosong null
- complaint = gabungkan semua isi kolom Keluhan menjadi satu kalimat
- initial_price = hanya digit angka tanpa titik
- entry_date = ubah ke format YYYY-MM-DD

Kalau tidak terbaca gunakan null.

JANGAN memberikan markdown.
JANGAN memberikan penjelasan.
JANGAN menambahkan text selain JSON.
`;

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    const response = await client.chat.completions.create({
      model: "google/gemma-4-26b-a4b-it:free",

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType ?? "image/jpeg"};base64,${image}`,
              },
            },
          ],
        },
      ],
    });

    const raw =
      response.choices[0]?.message?.content ?? "{}";

    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to OCR image",
      },
      {
        status: 500,
      }
    );
  }
}