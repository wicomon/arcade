"use server";

import { createClient } from "./server";

export async function insertScore(entry: {
  game: string;
  score: number;
  name: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: entry.game, name: entry.name, score: entry.score });

  if (error) throw error;
}
