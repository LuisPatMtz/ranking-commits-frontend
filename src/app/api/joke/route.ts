import { NextResponse } from "next/server";

const FALLBACK = [
  { q: "¿Por qué los programadores prefieren el modo oscuro?", a: "Porque la luz atrae a los bugs." },
  { q: "Un query SQL entra a un bar, ve dos tablas y pregunta:", a: '¿Puedo unirme a ustedes?' },
  { q: "¿Cuántos programadores hacen falta para cambiar una lamparita?", a: "Ninguno, es un problema de hardware." },
];

export async function GET() {
  try {
    const res = await fetch(
      "https://v2.jokeapi.dev/joke/Programming?lang=es&blacklistFlags=nsfw,racist,sexist",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error(`JokeAPI ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error("JokeAPI returned error");

    const q: string = data.type === "twopart" ? data.setup : data.joke;
    const a: string = data.type === "twopart" ? data.delivery : "JokeAPI";
    return NextResponse.json([{ q, a }]);
  } catch {
    const idx = Math.floor(Math.random() * FALLBACK.length);
    return NextResponse.json([FALLBACK[idx]]);
  }
}
