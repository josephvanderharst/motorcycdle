import type { ResultAsEmoji } from "@/types/emoji-result.type";
import type { Boundary, GameMetadata } from "@/types/game-metadata.type";
import type { Guess } from "@/types/guess.type";
import { computed, reactive, ref, toValue, type MaybeRefOrGetter } from "vue";

export type ExtraGamestateDetails = {
  greenYearRange: number;
  yellowYearRange: number;
  minYear: number;
  maxYear: number;
};

export function useGamestate(initGuesses: Guess[] = [], extraOptions?: Partial<ExtraGamestateDetails>) {
  const gamestateDetails: ExtraGamestateDetails = {
    greenYearRange: 5,
    yellowYearRange: 10,
    minYear: 1900,
    maxYear: new Date().getFullYear(),
    ...(extraOptions ?? {})
  };

  const minYear = gamestateDetails.minYear;
  const maxYear = gamestateDetails.maxYear;

  const metadata = ref<GameMetadata>(null!);

  const numGuesses = computed(() => metadata?.value?.guess_boundaries?.length ?? 0);
  const answer = computed(() => metadata?.value?.answer ?? {});
  const currGuess = reactive<Guess>({ make: null!, model: null!, year: null! });
  const guesses = reactive<Guess[]>(initGuesses);

  const guessedCorrectly = computed(() => {
    const theGuesses = guesses;
    const finalGuess = theGuesses[theGuesses.length - 1];

    if (finalGuess == null) return false;

    return makeOrModelCorrect(finalGuess.make, answer.value.make)
      && makeOrModelCorrect(finalGuess.model, answer.value.model)
      && yearDist(finalGuess.year, answer.value.year) <= 5;
  });

  const currGuessIndex = computed(() => guesses.length);

  const currGuessBoundary = computed<Boundary>(() =>
    metadata.value.guess_boundaries[currGuessIndex.value]
    ?? { x_start_percent: 0, x_end_percent: 100, y_start_percent: 0, y_end_percent: 100, }
  );

  const isGameOver = computed(() => {
    return guessedCorrectly.value || currGuessIndex.value === numGuesses.value;
  });

  const guessesAfterCurrent = computed(() => {
    const numRemaining = numGuesses.value - guesses.length;
    const remainingAfterCurrent = numRemaining - (isGameOver.value ? 0 : 1);

    if (remainingAfterCurrent > 0) return new Array(remainingAfterCurrent);
    else return [];
  });

  function makeOrModelCorrect(value: string, answer: string): boolean {
    value = (value || '').trim().toLowerCase();
    answer = (answer || '').trim().toLowerCase();

    if (value === answer) return true;
    else return false;
  }

  function yearDist(value: number, answer: number): number {
    if (value == null) return 1000;
    else return Math.abs(answer - value);
  }

  const isGuessValid = computed(() => {
    const make = (currGuess.make ?? '').trim();
    const model = (currGuess.model ?? '').trim();
    const year = currGuess.year ?? 0;

    return make !== ''
      && model !== ''
      && year >= minYear
      && year <= maxYear;
  });

  const resultsAsEmojiArrays = computed<ResultAsEmoji[]>(() => {
    return guesses.map(guess => {
      const squares: ResultAsEmoji = ['🟥','🟥','🟥'];

      if (makeOrModelCorrect(guess.make, answer.value.make)) squares[0] = '🟩';

      if (makeOrModelCorrect(guess.model, answer.value.model)) squares[1] = '🟩';

      const dist = yearDist(guess.year, answer.value.year);
      if (dist === 0) squares[2] = '✅';
      else if (dist <= gamestateDetails.greenYearRange) squares[2] = '🟩';
      else if (dist <= gamestateDetails.yellowYearRange) squares[2] = '🟨';

      return squares;
    });
  });
  
  function resetCurrGuess(): void {
    currGuess.make = null!;
    currGuess.model = null!;
    currGuess.year = null!;
  }

  function submitGuess(): void {
    guesses.push({...currGuess});
    resetCurrGuess();
  }

  function initGame(metadataValue: MaybeRefOrGetter<GameMetadata>) {
    metadata.value = toValue(metadataValue);
  }

  return {
    gamestateDetails,
    minYear,
    maxYear,
    numGuesses,
    answer,
    currGuess,
    guesses,
    guessedCorrectly,
    currGuessIndex,
    currGuessBoundary,
    guessesAfterCurrent,
    isGameOver,
    makeOrModelCorrect,
    yearDist,
    isGuessValid,
    resultsAsEmojiArrays,
    initGame,
    submitGuess,
  };
}
