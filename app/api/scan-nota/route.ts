import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const PROMPT = `
You are an advanced OCR and Data Extraction AI. 
Your task is to analyze a photo of a physical phone repair receipt from "Glory Part Station".
The receipt contains a mix of printed text and messy handwriting. Read carefully.

Extract the requested information and map it EXACTLY to the provided JSON schema.

EXTRACTION RULES:
1. customer_name: Extract the customer's name. If completely unreadable, return null.
2. customer_phone_number: Extract the phone number. Remove spaces, hyphens, and symbols. Return ONLY digits (e.g., "08123456789").
3. phone_brand: Extract the phone brand and type/model (e.g., "Samsung A51", "iPhone 11").
4. imei: Extract the IMEI number. If blank or unreadable, return null.
5. complaint: Read the "Keluhan" or "Kerusakan" section. Combine all issues into a single, coherent sentence.
6. initial_price: Extract the estimated price or cost. Remove "Rp", dots, commas, and spaces. Convert "k" to 000 (e.g., "150k" -> "150000", "Rp 250.000" -> "250000"). Return ONLY digits as a string.
7. entry_date: Extract the entry date (Tanggal masuk). Convert it strictly to "YYYY-MM-DD" format (e.g., "17/08/26" or "17 Agustus 2026" becomes "2026-08-17").

CRITICAL OUTPUT CONSTRAINTS:
- You must return ONLY a raw, valid JSON object.
- DO NOT wrap the output in markdown code blocks (NO \`\`\`json ... \`\`\`).
- DO NOT add any conversational text, explanations, or greetings.
- If a specific field cannot be found, output null for that field.

EXPECTED JSON FORMAT:
{
  "customer_name": "string | null",
  "customer_phone_number": "string | null",
  "phone_brand": "string | null",
  "imei": "string | null",
  "complaint": "string | null",
  "initial_price": "string | null",
  "entry_date": "string | null"
}
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