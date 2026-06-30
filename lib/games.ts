import type { ComponentType } from "react";
import Asteroids, {
  type GameProps,
} from "@/components/games/asteroids/Asteroids";

export const GAME_ENGINES: Record<string, ComponentType<GameProps>> = {
  asteroids: Asteroids,
};
