export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
};

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

export type User = {
  name: string;
} | null;

export type SavedScore = {
  game: string;
  score: number;
  name: string;
  at: number;
};

export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

export type RecentScore = {
  player: string;
  game: string;
  score: number;
  time: string;
  color: "cyan" | "magenta" | "yellow" | "green";
};

export type TopPlayer = {
  rank: number;
  player: string;
  score: number;
};
