import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import type { GameEngineData } from '../views/GameView.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('../views/GameView.vue'),
      meta: <GameEngineData> {
        gameType: 'motorcycle',
      },
    },
    {
      path: '/game/car',
      name: 'car',
      component: () => import('../views/GameView.vue'),
      meta: <GameEngineData> {
        gameType: 'car',
      },
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
});

export default router;
