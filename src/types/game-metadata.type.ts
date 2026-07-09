import type { Guess } from "./guess.type";

export type Boundary = {
  x_start_percent: number;
  x_end_percent: number;
  y_start_percent: number;
  y_end_percent: number;
};

export type GameMetadata = {
  filename: string;
  answer: Guess;

  guess_boundaries: Boundary[];
};
