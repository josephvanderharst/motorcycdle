<script setup lang="ts">
import { getJson } from '@/shared/fetch-json';
import { useGamestate } from '@/shared/gamestate';
import { initGuesses } from '@/shared/init-guesses';
import { useSubimageMaker } from '@/shared/subimage-maker';
import type { GameMetadata } from '@/types/game-metadata.type';
import { onMounted, ref, type Ref } from 'vue';

const devMode = ref(false);

const gameDayNumber: number = 1;

const isGameLoading: Ref<boolean> = ref(false);
const isGameReady: Ref<boolean> = ref(false);

const metadata: Ref<GameMetadata> = ref(null!);

const {
  minYear,
  maxYear,
  numGuesses,
  answer,
  currGuess,
  guesses,
  guessedCorrectly,
  currGuessIndex,
  guessesAfterCurrent,
  isGameOver,
  makeOrModelCorrect,
  yearDist,
  isGuessValid,
  resultsAsEmojiArrays,
  ...gamestate
} = useGamestate(initGuesses);

const { mainImageUrl, subImageUrl, subImageBounds, ...subimageMaker } = useSubimageMaker();

function makeOrModelClass(value: string, answer: string): string { 
  return makeOrModelCorrect(value, answer) ? 'green' : 'red';
}

function yearClass(value: number, answer: number): string {
  const dist = yearDist(value, answer);

  if (dist <= 5) return 'green';
  else if (dist <= 10) return 'yellow';
  else return 'red';
}

function submitGuess(): void {
  gamestate.submitGuess();

  subimageMaker.makeSubimage(gamestate.currGuessBoundary.value);
}

function copyResultsToClipboard(): void {
  const results = resultsAsEmojiArrays.value;

  const formatted = results
    .map(([make,model,year]) => `${make} ${model} ${year}\n`)
    .join('');

  navigator.clipboard.writeText(formatted)
    .then(() => alert(`Copied results to clipboard!\n\n${formatted}`))
    .catch(() => alert(`Failed to copy results to clipboard.`));
}

async function initGame() {
  isGameLoading.value = true;

  const dayIndex = String(gameDayNumber).padStart(4, '0');
  const basePath = `src/assets/games/${dayIndex}`;
  const metadataUrl = `${basePath}/metadata.json`;
  metadata.value = await getJson<GameMetadata>(metadataUrl);
  // TODO: Handle errors and such

  gamestate.initGame(metadata);

  const url = `${basePath}/${metadata.value.filename}`;
  await subimageMaker.fetchImageData(url);
  await subimageMaker.makeSubimage(gamestate.currGuessBoundary.value);

  if (metadata.value) {
    isGameReady.value = true;
  }
  isGameLoading.value = false;
}

onMounted(() => {
  initGame();
})
</script>

<template>
  <details class="d-flex flex-column" v-if="isGameReady && devMode">
    <summary>Dev Mode Details:</summary>

    <span><b>Current guess:</b> {{ currGuess }}</span><br/>
    <span><b>Num guesses allowed:</b> {{ numGuesses }}</span><br/>
    <span><b>Guess index:</b> {{ currGuessIndex }}</span><br/>
    <span><b>Num guesses after current:</b> {{ guessesAfterCurrent.length }}</span><br/>
    <span><b>Did player win:</b> {{ guessedCorrectly }}</span><br/>
    <span><b>Is game over:</b> {{ isGameOver }}</span><br/>
    <span><b>Metadata:</b> {{ metadata }}</span>
  </details>
  <div class="d-flex w-100 justify-content-center" v-if="isGameReady">
    <div class="col-12 col-md-10 col-xl-8">
      <div class="d-flex flex-column align-items-center py-2 gap-2">
        <details v-if="devMode">
          <summary>Subimage outline:</summary>

          <div class="position-relative">
            <img :src="mainImageUrl" />

            <div :style="{
              position: 'absolute',
              border: '2px dashed red',
              backgroundColor: 'transparent',
              left: subImageBounds.left + '%',
              top: subImageBounds.top + '%',
              width: subImageBounds.width + '%',
              height: subImageBounds.height + '%',
            }"></div>
          </div>
        </details>
        <img v-if="!isGameOver" :src="subImageUrl" />
        <img v-else :src="mainImageUrl" />

        <div class="guess-grid">
          <b>Make:</b>
          <b>Model:</b>
          <b>Year:</b>

          <template v-for="(guess, index) of guesses" :key="index">
            <input type="text" readonly :value="guess.make" :class="makeOrModelClass(guess.make, answer.make)" />
            <input type="text" readonly :value="guess.model" :class="makeOrModelClass(guess.model, answer.model)" />
            <input type="number" readonly :value="guess.year" :class="yearClass(guess.year, answer.year)" />
          </template>

          <template v-if="currGuessIndex < numGuesses && !guessedCorrectly">
            <input type="text" v-model="currGuess.make" />
            <input type="text" v-model="currGuess.model" />
            <input type="number" v-model="currGuess.year" :min="minYear" :max="maxYear" />
          </template>

          <template v-for="(_, index) of guessesAfterCurrent" :key="index + currGuessIndex">
            <input type="text" readonly class="gray" />
            <input type="text" readonly class="gray" />
            <input type="number" readonly class="gray" />
          </template>
        </div>

        <button type="button" :disabled="!isGuessValid" @click="submitGuess">Guess</button>

        <div class="text-center d-flex flex-column align-items-center" v-if="isGameOver">
          <h2 v-if="guessedCorrectly">A winner is you!</h2>
          <h2 v-else>A winnern&apos;t is you!</h2>
          <h3>{{ answer.make }}&nbsp;{{ answer.model }}&nbsp;{{ answer.year }}</h3>

          <div class="results-grid">
            <b>Make:</b>
            <b>Model:</b>
            <b>Year:</b>
            <br/>

            <template v-for="([make,model,year], index) of resultsAsEmojiArrays" :key="index">
              <span>{{ make }}</span>
              <span>{{ model }}</span>
              <span>{{ year }}</span>

              <br/>
            </template>
          </div>

          <button type="button" @click="copyResultsToClipboard">Copy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
img {
  width: 500px;
  max-width: 95vw;
}

button {
  background: var(--bs-info);
  color: var(--bs-light);
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem;

  &:disabled {
    background: var(--bs-gray-200);
    color: var(--bs-gray-500);
    border-color: var(--bs-gray-400);
  }
}

.guess-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 0.25rem;
  text-align: center;

  width: 500px;
  max-width: min(500px, 95vw);
}

.results-grid {
  grid-template-columns: repeat(3, min-content) 0px;
  gap: 0 1.5rem;
  font-size: x-large;
}

.guess-grid, .results-grid {
  display: grid;

  input {
    width: 100%;
    border-radius: 0.25rem;

    &:read-only {
      cursor: inherit;
    }

    transition: all;
    transition-duration: 0.5s;

    padding: 0.125rem;
  }

  .red {
    color: var(--bs-red);
    background-color: #ff000022;
    border: 2px solid var(--bs-red);
    outline-color: var(--bs-red);
  }
  .yellow {
    color: var(--bs-warning);
    background-color: #ffff0022;
    border: 2px solid var(--bs-warning);
    outline-color: var(--bs-warning);
  }
  .green {
    color: var(--bs-green);
    background-color: #00ff0022;
    border: 2px solid var(--bs-green);
    outline-color: var(--bs-green);
  }
  .gray {
    color: var(--bs-gray-500);
    background-color: #0000000a;
    border: 2px solid var(--bs-gray-500);
    outline-color: var(--bs-gray-500);
  }
}
</style>
