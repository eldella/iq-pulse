import { NextRequest, NextResponse } from "next/server";
import type { LeaderboardEntry, LeaderboardRange } from "@/lib/types";

const MIN_ALIAS_LENGTH = 3;
const MAX_ALIAS_LENGTH = 12;
const MAX_RESULTS = 100;

function daysAgo(days: number, hours = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

/**
 * Mock in-memory "database". Resets whenever the dev/prod server restarts.
 * All data access goes through getScores()/createScore() below so a real
 * datastore (Supabase, Vercel KV, etc) can replace this array without
 * touching the route handlers or the response shape.
 */
let scores: LeaderboardEntry[] = [
  { id: "1", alias: "Nova92", score: 94, iq: 133, createdAt: daysAgo(0, 1) },
  { id: "2", alias: "QuizMaster", score: 88, iq: 128, createdAt: daysAgo(0, 3) },
  { id: "3", alias: "ElCerebrito", score: 81, iq: 122, createdAt: daysAgo(0, 6) },
  { id: "4", alias: "Ana_G", score: 76, iq: 118, createdAt: daysAgo(1) },
  { id: "5", alias: "MaxIQ", score: 91, iq: 130, createdAt: daysAgo(2) },
  { id: "6", alias: "Sofi.R", score: 68, iq: 112, createdAt: daysAgo(2) },
  { id: "7", alias: "Turbo7", score: 73, iq: 116, createdAt: daysAgo(3) },
  { id: "8", alias: "LunaP", score: 85, iq: 125, createdAt: daysAgo(4) },
  { id: "9", alias: "Kaiju", score: 62, iq: 107, createdAt: daysAgo(5) },
  { id: "10", alias: "Pixel99", score: 79, iq: 120, createdAt: daysAgo(6) },
  { id: "11", alias: "Renegade", score: 55, iq: 101, createdAt: daysAgo(15) },
  { id: "12", alias: "MiraQ", score: 97, iq: 136, createdAt: daysAgo(25) },
  { id: "13", alias: "TheoK", score: 47, iq: 95, createdAt: daysAgo(40) },
  { id: "14", alias: "ZoeM", score: 70, iq: 114, createdAt: daysAgo(60) },
  { id: "15", alias: "Dash21", score: 60, iq: 105, createdAt: daysAgo(90) },
];

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isWithinLastDays(iso: string, days: number): boolean {
  const elapsed = Date.now() - new Date(iso).getTime();
  return elapsed <= days * 24 * 60 * 60 * 1000;
}

/** Data-access boundary — swap the body for a real DB call later. */
function getScores(range: LeaderboardRange): LeaderboardEntry[] {
  const filtered = scores.filter((entry) => {
    if (range === "today") return isToday(entry.createdAt);
    if (range === "week") return isWithinLastDays(entry.createdAt, 7);
    return true;
  });

  return [...filtered]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
}

/** Data-access boundary — swap the body for a real DB call later. */
function createScore(entry: Omit<LeaderboardEntry, "id" | "createdAt">): LeaderboardEntry {
  const newEntry: LeaderboardEntry = {
    id: crypto.randomUUID(),
    alias: entry.alias,
    score: entry.score,
    iq: entry.iq,
    createdAt: new Date().toISOString(),
  };
  scores = [newEntry, ...scores];
  return newEntry;
}

function isValidRange(value: string | null): value is LeaderboardRange {
  return value === "today" || value === "week" || value === "alltime";
}

export async function GET(request: NextRequest) {
  const rangeParam = request.nextUrl.searchParams.get("range");
  const range: LeaderboardRange = isValidRange(rangeParam) ? rangeParam : "alltime";

  return NextResponse.json({ entries: getScores(range) });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const { alias, score, iq } = body as Record<string, unknown>;

  if (typeof alias !== "string" || alias.trim().length < MIN_ALIAS_LENGTH || alias.trim().length > MAX_ALIAS_LENGTH) {
    return NextResponse.json(
      { error: `El alias debe tener entre ${MIN_ALIAS_LENGTH} y ${MAX_ALIAS_LENGTH} caracteres.` },
      { status: 400 }
    );
  }

  if (typeof score !== "number" || !Number.isFinite(score)) {
    return NextResponse.json({ error: "El puntaje debe ser un número válido." }, { status: 400 });
  }

  if (iq !== undefined && (typeof iq !== "number" || !Number.isFinite(iq))) {
    return NextResponse.json({ error: "El IQ debe ser un número válido." }, { status: 400 });
  }

  const created = createScore({
    alias: alias.trim(),
    score,
    iq: typeof iq === "number" ? iq : undefined,
  });

  return NextResponse.json({ entry: created }, { status: 201 });
}
