import { createClient } from "./server";
import type { Game, ScoreRow, RecentScore, TopPlayer } from "../data";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

type GameRow = Omit<Game, "best" | "plays">;
type GameWithStats = GameRow & { best: number; plays: number };

function aggregateScores(
  rows: { game_id: string; score: number }[],
): Map<string, { best: number; plays: number }> {
  const stats = new Map<string, { best: number; plays: number }>();
  for (const row of rows) {
    const current = stats.get(row.game_id) ?? { best: 0, plays: 0 };
    stats.set(row.game_id, {
      best: Math.max(current.best, row.score),
      plays: current.plays + 1,
    });
  }
  return stats;
}

export async function getGames(): Promise<GameWithStats[]> {
  const supabase = await createClient();
  const [{ data: games, error }, { data: scores, error: scoresError }] =
    await Promise.all([
      supabase.from("games").select("*"),
      supabase.from("scores").select("game_id, score"),
    ]);

  if (error) throw error;
  if (scoresError) throw scoresError;

  const stats = aggregateScores(scores ?? []);

  return (games ?? []).map((game) => ({
    ...(game as unknown as GameRow),
    best: stats.get(game.id)?.best ?? 0,
    plays: stats.get(game.id)?.plays ?? 0,
  }));
}

export async function getGameById(id: string): Promise<GameWithStats | null> {
  const supabase = await createClient();
  const [{ data: game, error }, { data: scores, error: scoresError }] =
    await Promise.all([
      supabase.from("games").select("*").eq("id", id).maybeSingle(),
      supabase.from("scores").select("game_id, score").eq("game_id", id),
    ]);

  if (error) throw error;
  if (scoresError) throw scoresError;
  if (!game) return null;

  const stats = aggregateScores(scores ?? []);
  const stat = stats.get(id);

  return {
    ...(game as unknown as GameRow),
    best: stat?.best ?? 0,
    plays: stat?.plays ?? 0,
  };
}

export async function getGameLeaderboard(
  gameId: string,
  limit = 10,
): Promise<ScoreRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row, i) => ({
    rank: i + 1,
    name: row.name,
    score: row.score,
    date: formatDate(row.created_at),
  }));
}

export async function getRecentScores(limit = 7): Promise<RecentScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("name, score, created_at, games(title, color)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const game = row.games as unknown as {
      title: string;
      color: RecentScore["color"];
    } | null;
    return {
      player: row.name,
      game: game?.title ?? "",
      score: row.score,
      time: formatRelativeTime(row.created_at),
      color: game?.color ?? "cyan",
    };
  });
}

export async function getTopPlayersToday(limit = 5): Promise<TopPlayer[]> {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("scores")
    .select("name, score")
    .gte("created_at", todayStart.toISOString());

  if (error) throw error;

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.name, (totals.get(row.name) ?? 0) + row.score);
  }

  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([player, score], i) => ({ rank: i + 1, player, score }));
}
