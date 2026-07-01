import { notFound } from "next/navigation";
import { getGameById } from "@/lib/supabase/queries";
import PlayClient from "@/components/games/PlayClient";

type Props = { params: Promise<{ id: string }> };

export default async function GamePlayerPage({ params }: Props) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  return <PlayClient game={game} />;
}
