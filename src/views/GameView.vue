<script setup lang="ts">
import type { GameMetadata } from '@/types/game-metadata.type';
import type { Guess } from '@/types/guess.type';
import { computed, onMounted, reactive, ref, type Reactive, type Ref } from 'vue';

const minYear = 1900;
const maxYear = new Date().getFullYear();

const whichDayToPlay = '2026-07-09';

async function getJson<T>(url: string | URL): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const resp = await fetch(url);

    if (!resp.ok) {
      reject(`Error fetching '${url}': ${resp.status} ${resp.statusText}`);
    }
    else {
      const json = await resp.json();
      resolve(json as T);
    }
  });
};

const metadata: Ref<GameMetadata> = ref({} as GameMetadata);

const numGuesses = computed(() => metadata.value?.guess_boundaries?.length ?? 0);

const answer = computed(() => metadata.value?.answer);

const currGuess: Reactive<Guess> = reactive({ make: null!, model: null!, year: null! });

const guesses: Reactive<Guess[]> = reactive([]);

// const guesses: Reactive<Guess[]> = reactive([
//   { make: 'Hayley Darwin', model: 'Da Hawg', year: 1945 },
//   { make: 'Hayday Dayvid', model: 'Payday', year: 2001 },
//   { make: 'Harley Davidson', model: 'Road King', year: 2010 },
//   { make: 'Harley Davidson', model: 'Road King', year: 2011 },
// ]);

// const guesses: Reactive<Guess[]> = reactive([
//   { make: 'Hayley Darwin', model: 'Da Hawg', year: 1945 },
//   { make: 'Hayday Dayvid', model: 'Payday', year: 2001 },
//   { make: 'Hurley Duelly', model: 'Road Queen', year: 2019 },
//   { make: 'Horribly Derpy', model: 'Hamster Huey', year: 2013 },
//   { make: 'Harley Davidson', model: 'Road King', year: 2011 },
// ]);

const guessedCorrectly = computed(() => {
  const theGuesses = guesses;
  const finalGuess = theGuesses[theGuesses.length - 1];

  if (finalGuess == null) return false;

  return makeOrModelCorrect(finalGuess.make, answer.value.make)
    && makeOrModelCorrect(finalGuess.model, answer.value.model)
    && yearDist(finalGuess.year, answer.value.year) <= 5;
});

const currGuessIndex = computed(() => guesses.length);

const guessesAfterCurrent = computed(() => {
  const numRemaining = numGuesses.value - guesses.length;
  const remainingAfterCurrent = numRemaining - (guessedCorrectly.value ? 0 : 1);

  if (remainingAfterCurrent > 0) return new Array(remainingAfterCurrent);
  else return [];
});

const isGameOver = computed(() => {
  return guessedCorrectly.value || currGuessIndex.value === numGuesses.value;
});

function makeOrModelCorrect(value: string, answer: string): boolean {
  value = (value || '').trim().toLowerCase();
  answer = (answer || '').trim().toLowerCase();

  if (value === answer) return true;
  else return false;
}

function makeOrModelClass(value: string, answer: string): string { 
  return makeOrModelCorrect(value, answer) ? 'green' : 'red';
}

function yearDist(value: number, answer: number): number {
  if (value == null) return 1000;
  else return Math.abs(answer - value);
}

function yearClass(value: number, answer: number): string {
  const dist = yearDist(value, answer);

  if (dist <= 5) return 'green';
  else if (dist <= 10) return 'yellow';
  else return 'red';
}

function resetCurrGuess(): void {
  currGuess.make = null!;
  currGuess.model = null!;
  currGuess.year = null!;
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

function submitGuess(): void {
  guesses.push({...currGuess});
  resetCurrGuess();
}

function copyResults(): void {
  const results = guesses.map(guess => {
    const squares = ['🟥','🟥','🟥'];

    if (makeOrModelCorrect(guess.make, answer.value.make)) squares[0] = '🟩';

    if (makeOrModelCorrect(guess.model, answer.value.model)) squares[1] = '🟩';

    if (yearDist(guess.year, answer.value.year) === 0) squares[2] = '✅';
    else if (yearDist(guess.year, answer.value.year) <= 5) squares[2] = '❎';
    else if (yearDist(guess.year, answer.value.year) <= 10) squares[2] = '🟨';

    return squares;
  });

  const formatted = results
    .map(r => `${r[0]} ${r[1]} ${r[2]}`)
    .join('\n');

  navigator.clipboard.writeText(formatted);
  alert(`Copied results to clipboard!\n\n${formatted}`);
}

async function initGame() {
  const metadataUrl = `src/assets/${whichDayToPlay}/metadata.json`;
  metadata.value = await getJson<GameMetadata>(metadataUrl);
}

onMounted(() => {
  initGame();
})
</script>

<template>
  <div class="d-flex flex-column d-none">
    <span><b>Current guess:</b> {{ currGuess }}</span>
    <span><b>Num guesses allowed:</b> {{ numGuesses }}</span>
    <span><b>Guess index:</b> {{ currGuessIndex }}</span>
    <span><b>Num guesses after current:</b> {{ guessesAfterCurrent.length }}</span>
    <span><b>Did player win:</b> {{ guessedCorrectly }}</span>
    <span><b>Is game over:</b> {{ isGameOver }}</span>
    <span><b>Metadata:</b> {{ metadata }}</span>
  </div>
  <div class="d-flex w-100 justify-content-center" v-if="metadata && answer">
    <div class="col-12 col-md-10 col-xl-8">
      <div class="d-flex flex-column align-items-center py-2 gap-2">
        <img v-if="metadata" :src="`/src/assets/${whichDayToPlay}/${metadata.filename}`" />

        <div class="guess-grid">
          <b>Make:</b>
          <b>Model:</b>
          <b>Year:</b>

          <template v-for="guess of guesses">
            <input type="text" readonly :value="guess.make" :class="makeOrModelClass(guess.make, answer.make)" />
            <input type="text" readonly :value="guess.model" :class="makeOrModelClass(guess.model, answer.model)" />
            <input type="number" readonly :value="guess.year" :class="yearClass(guess.year, answer.year)" />
          </template>

          <template v-if="currGuessIndex < numGuesses && !guessedCorrectly">
            <input type="text" v-model="currGuess.make" />
            <input type="text" v-model="currGuess.model" />
            <input type="number" v-model="currGuess.year" min="1900" :max="maxYear" />
          </template>

          <template v-for="_ of guessesAfterCurrent">
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

          <!-- 🟥🟨🔴🟡🟢🟫🟪🟦⏹️⏹🟥🟧🟧🟩✅❎❎<br/> -->
          <div class="results-grid">
            <b>Make:</b>
            <b>Model:</b>
            <b>Year:</b>
            <br/>

            <template v-for="guess of guesses">
              <span v-if="makeOrModelCorrect(guess.make, answer.make)">🟩</span>
              <span v-else>🟥</span>

              <span v-if="makeOrModelCorrect(guess.model, answer.model)">🟩</span>
              <span v-else>🟥</span>

              <span v-if="yearDist(guess.year, answer.year) === 0">✅</span>
              <span v-else-if="yearDist(guess.year, answer.year) <= 5">❎</span>
              <span v-else-if="yearDist(guess.year, answer.year) <= 10">🟨</span>
              <span v-else>🟥</span>

              <br/>
            </template>
          </div>

          <button type="button" @click="copyResults">Copy</button>
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
