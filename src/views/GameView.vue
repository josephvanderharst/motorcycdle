<script setup lang="ts">
import type { GameMetadata } from '@/types/game-metadata.type';
import type { Guess } from '@/types/guess.type';
import { computed, onMounted, reactive, ref, type Reactive, type Ref } from 'vue';

type SubimageBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width?: number;
  height?: number;
};

const devMode = ref(false);

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

const isGameLoading: Ref<boolean> = ref(false);
const isGameReady: Ref<boolean> = ref(false);

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
  makeSubimage();
}

const resultsAsEmojiArrays = computed<[string,string,string][]>(() => {
  return guesses.map(guess => {
    const squares: [string,string,string] = ['🟥','🟥','🟥'];

    if (makeOrModelCorrect(guess.make, answer.value.make)) squares[0] = '🟩';

    if (makeOrModelCorrect(guess.model, answer.value.model)) squares[1] = '🟩';

    const dist = yearDist(guess.year, answer.value.year);
    if (dist === 0) squares[2] = '✅';
    else if (dist <= 5) squares[2] = '❎';
    else if (dist <= 10) squares[2] = '🟨';

    return squares;
  });
});

function copyResults(): void {
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

  const metadataUrl = `src/assets/${whichDayToPlay}/metadata.json`;
  metadata.value = await getJson<GameMetadata>(metadataUrl);

  await fetchImageData();
  await makeSubimage();

  if (metadata.value) {
    isGameReady.value = true;
  }
  isGameLoading.value = false;
}

const mainImageUrl = ref<string>(null!);
const mainImageBlob = ref<Blob>(null!);
const mainImageDimensions = ref<{width: number, height: number}>(null!);

const subImageUrl = ref<string>(null!);

async function fetchImageData() {
  const src = `/src/assets/${whichDayToPlay}/${metadata.value.filename}`;
  const resp = await fetch(src);
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  mainImageBlob.value = blob;
  mainImageUrl.value = url;
  subImageUrl.value = url;

  const bitmap = await createImageBitmap(blob);
  mainImageDimensions.value = {
    width: bitmap.width,
    height: bitmap.height,
  };
  bitmap.close();
}

const subImageBounds = ref<SubimageBounds>(null!);
async function makeSubimage() {
  const bounds = metadata.value.guess_boundaries[currGuessIndex.value];

  if (!bounds) return null;

  const leftPercent = bounds.x_start_percent;
  const rightPercent = bounds.x_end_percent;
  const topPercent = bounds.y_start_percent;
  const bottomPercent = bounds.y_end_percent;

  const widthPercent = rightPercent - leftPercent;
  const heightPercent = bottomPercent - topPercent;

  // const horizCenter = (leftPercent + rightPercent) / 2;
  // const vertCenter = (topPercent + bottomPercent) / 2;

  // const horizShift = 50 - horizCenter;
  // const vertShift = 50 - vertCenter;

  // const vertScale = 100 / (bottomPercent - topPercent);
  // const horizScale = 100 / (rightPercent - leftPercent);
  // const scale = Math.max(vertScale, horizScale, 1);
 
  // console.log(topPercent, rightPercent, bottomPercent, leftPercent, scale, horizShift, vertShift);

  const bitmap = await createImageBitmap(mainImageBlob.value);

  const leftPx = leftPercent / 100 * bitmap.width;
  const rightPx = rightPercent / 100 * bitmap.width;
  const topPx = topPercent / 100 * bitmap.height;
  const bottomPx = bottomPercent / 100 * bitmap.height;

  const widthPx = rightPx - leftPx;
  const heightPx = bottomPx - topPx;

  subImageBounds.value = {
    left: leftPercent,
    right: rightPercent,
    top: topPercent,
    bottom: bottomPercent,
    width: widthPercent,
    height: heightPercent,
  };
  
  console.log('%', leftPercent, rightPercent, topPercent, bottomPercent, widthPercent, heightPercent);
  console.log('px', leftPx, rightPx, topPx, bottomPx, widthPx, heightPx);

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;

  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, leftPx, topPx, widthPx, heightPx, 0, 0, widthPx, heightPx);

  const extract = context.getImageData(0, 0, widthPx, heightPx);

  console.log(extract);

  subImageUrl.value = canvas.toDataURL();
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
        <img :src="subImageUrl" />

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
            <input type="number" v-model="currGuess.year" min="1900" :max="maxYear" />
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
