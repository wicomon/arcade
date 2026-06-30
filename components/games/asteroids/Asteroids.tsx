"use client";

import { useEffect, useRef } from "react";
import { createGame, type GameHandle } from "./engine";

export type GameProps = {
  paused: boolean;
  onScore: (n: number) => void;
  onLives: (n: number) => void;
  onLevel: (n: number) => void;
  onGameOver: (score: number) => void;
  onReady?: (handle: GameHandle) => void;
};

export default function Asteroids({
  paused,
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onReady,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GameHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handle = createGame(canvas, {
      onScore,
      onLives,
      onLevel,
      onGameOver,
    });
    handleRef.current = handle;
    onReady?.(handle);

    return () => {
      handle.destroy();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused) handleRef.current?.pause();
    else handleRef.current?.resume();
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="asteroids-canvas"
    />
  );
}
