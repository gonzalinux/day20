import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/room-login',
      component: () => import('@/views/RoomLoginView.vue'),
    },
    {
      path: '/rooms/:id',
      component: () => import('@/views/RoomView.vue'),
    },
  ],
})

export default router
