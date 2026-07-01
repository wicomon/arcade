import {
  getGames,
  getRecentScores,
  getTopPlayersToday,
} from "@/lib/supabase/queries";
import HomeClient from "@/components/home/HomeClient";

export default async function HomePage() {
  const [games, recentScores, topPlayers] = await Promise.all([
    getGames(),
    getRecentScores(),
    getTopPlayersToday(),
  ]);

  return (
    <HomeClient
      games={games}
      recentScores={recentScores}
      topPlayers={topPlayers}
    />
  );
}
