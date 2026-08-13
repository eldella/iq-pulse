import { supabase } from "./client";

export type GeneralEntry = { deviceId: string; alias: string; points: number };
export type TimeEntry = { deviceId: string; alias: string; seconds: number };
export type PercentileEntry = { deviceId: string; alias: string; percentile: number };
export type StreakEntry = { deviceId: string; alias: string; streak: number };

async function callLeaderboardRpc<T>(fn: string, limitN: number): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, { limit_n: limitN });
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function getGeneralLeaderboard(limitN = 10): Promise<GeneralEntry[]> {
  const rows = await callLeaderboardRpc<{ device_id: string; alias: string; points: number }>(
    "leaderboard_general",
    limitN
  );
  return rows.map((r) => ({ deviceId: r.device_id, alias: r.alias, points: r.points }));
}

export async function getTimesLeaderboard(limitN = 10): Promise<TimeEntry[]> {
  const rows = await callLeaderboardRpc<{ device_id: string; alias: string; seconds: number }>(
    "leaderboard_times",
    limitN
  );
  return rows.map((r) => ({ deviceId: r.device_id, alias: r.alias, seconds: r.seconds }));
}

export async function getPercentilesLeaderboard(limitN = 10): Promise<PercentileEntry[]> {
  const rows = await callLeaderboardRpc<{ device_id: string; alias: string; percentile: number }>(
    "leaderboard_percentiles",
    limitN
  );
  return rows.map((r) => ({ deviceId: r.device_id, alias: r.alias, percentile: r.percentile }));
}

export async function getStreaksLeaderboard(limitN = 10): Promise<StreakEntry[]> {
  const rows = await callLeaderboardRpc<{ device_id: string; alias: string; streak: number }>(
    "leaderboard_streaks",
    limitN
  );
  return rows.map((r) => ({ deviceId: r.device_id, alias: r.alias, streak: r.streak }));
}
