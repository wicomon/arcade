import { getGames } from "@/lib/supabase/queries";
import GamesLibraryClient from "@/components/games/GamesLibraryClient";

export default async function LibraryPage() {
  const games = await getGames();

  return <GamesLibraryClient games={games} />;
}
