import { getGames, getGameLeaderboard } from "@/lib/supabase/queries";
import HallOfFameClient from "@/components/hall-of-fame/HallOfFameClient";
import type { ScoreRow } from "@/lib/data";

export default async function HallOfFamePage() {
  const games = await getGames();
  const leaderboardsList = await Promise.all(
    games.map((g) => getGameLeaderboard(g.id, 10)),
  );

  const leaderboards: Record<string, ScoreRow[]> = {};
  games.forEach((g, i) => {
    leaderboards[g.id] = leaderboardsList[i];
  });

  return <HallOfFameClient games={games} leaderboards={leaderboards} />;
}
