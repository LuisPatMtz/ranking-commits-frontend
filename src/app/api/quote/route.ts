import { NextResponse } from "next/server";

const FRASES_ES = [
  { q: "El único modo de hacer un gran trabajo es amar lo que haces.", a: "Steve Jobs" },
  { q: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", a: "Robert Collier" },
  { q: "No cuentes los días, haz que los días cuenten.", a: "Muhammad Ali" },
  { q: "La constancia es la virtud por la que todas las demás virtudes dan su fruto.", a: "Evelyn Waugh" },
  { q: "Cada commit es un paso hacia donde quieres llegar.", a: "Ranking Commits" },
  { q: "El código es como el humor: si tienes que explicarlo, es malo.", a: "Cory House" },
  { q: "Primero, resuelve el problema. Luego, escribe el código.", a: "John Johnson" },
  { q: "La mejor manera de predecir el futuro es crearlo.", a: "Peter Drucker" },
  { q: "Los grandes logros requieren tiempo, dedicación y paciencia.", a: "Gail Devers" },
  { q: "No te detengas cuando estés cansado, deténte cuando hayas terminado.", a: "Anónimo" },
  { q: "El aprendizaje nunca cansa a la mente.", a: "Leonardo da Vinci" },
  { q: "La disciplina es el puente entre metas y logros.", a: "Jim Rohn" },
  { q: "Un experto es alguien que ha cometido todos los errores posibles en un campo muy estrecho.", a: "Niels Bohr" },
  { q: "El talento gana partidos, pero el trabajo en equipo gana campeonatos.", a: "Michael Jordan" },
  { q: "Lo que no se puede medir no se puede mejorar.", a: "Peter Drucker" },
];

export async function GET() {
  const idx = Math.floor(Math.random() * FRASES_ES.length);
  return NextResponse.json([FRASES_ES[idx]]);
}
