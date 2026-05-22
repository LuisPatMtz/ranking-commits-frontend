import { NextResponse } from "next/server";

const FALLBACK = [
  { q: "Cada commit es un paso hacia donde quieres llegar.", a: "Ranking Commits" },
  { q: "El único modo de hacer un gran trabajo es amar lo que haces.", a: "Steve Jobs" },
  { q: "La disciplina es el puente entre metas y logros.", a: "Jim Rohn" },
];

async function translateToSpanish(text: string): Promise<string> {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error("MyMemory error");
  const data = await res.json();
  const translated: string = data.responseData?.translatedText;
  if (!translated || data.responseStatus !== 200) throw new Error("Bad translation");
  return translated;
}

export async function GET() {
  try {
    const zenRes = await fetch("https://zenquotes.io/api/random", {
      next: { revalidate: 3600 },
    });
    if (!zenRes.ok) throw new Error(`ZenQuotes ${zenRes.status}`);
    const [quote] = await zenRes.json();
    const translatedQ = await translateToSpanish(quote.q);
    return NextResponse.json([{ q: translatedQ, a: quote.a }]);
  } catch {
    const idx = Math.floor(Math.random() * FALLBACK.length);
    return NextResponse.json([FALLBACK[idx]]);
  }
}
