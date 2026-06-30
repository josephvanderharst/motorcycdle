<script setup lang="ts">
defineProps<{
  headerHeight: string;
}>();
</script>

<template>
  <nav class="app-header" :style="{ height: headerHeight }">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
    <RouterLink to="/game">Game</RouterLink>
  </nav>
</template>

<style scoped>
.app-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.5rem;
  background-color: var(--bs-primary);

  a {
    color: var(--bs-gray-100);
  }
}
</style>
