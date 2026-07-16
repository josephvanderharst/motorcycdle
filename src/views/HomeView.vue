<script setup lang="ts">
import { ref } from 'vue';

const days = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
</script>

<template>
  <div class="d-flex w-100 justify-content-center">
    <div class="col-12 col-md-10 col-xl-8">
      <div class="d-flex flex-column align-items-center py-2 gap-2">
        <h1>Welcome to Motorcycdle!</h1>
        <h2 class="mb-0" style="line-height: 1rem">
          The
          <a target="_blank" href="https://www.nytimes.com/games/wordle/index.html">Wordle</a>-
          and
          <a target="_blank" href="https://www.playcardle.com/">Cardle</a>-inspired Motorcycle-guessing game!
        </h2>
        <h4><i>^^^ Wordle and Cardle are pretty cool. You should play them! ^^^</i></h4>

        <div class="game-tile-container">
          <router-link class="game-tile" v-for="day of days" :key="day" :to="{ path: 'game', query: { day: day } }">
            <h1>Day {{ day }}</h1>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-tile-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;

  max-width: 99%;
  width: 500px;
}

.game-tile {
  min-width: 10vw;
  width: 150px;
  max-width: 33vw;

  aspect-ratio: 1 / 1;
  border: 2px solid black;
  border-radius: 1rem;

  text-align: center;
  align-content: center;

  background-color: var(--bs-light);
  color: initial;
  text-decoration: none;

  transition: all;
  transition-duration: 0.25s;

  &:hover {
    scale: 1.1;
    background-color: var(--bs-success-bg-subtle);
  }
}
</style>
