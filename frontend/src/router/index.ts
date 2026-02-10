import { createRouter, createWebHistory } from 'vue-router'
import i18n from '@/i18n'

const Home = () => import('@/views/HomeView.vue')
const RoomLogin = () => import('@/views/RoomLoginView.vue')
const Room = () => import('@/views/RoomView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Spanish — prefixed
    {
      path: '/es',
      children: [
        { path: '', component: Home },
        { path: 'room-login', component: RoomLogin },
        { path: 'rooms/:id', component: Room },
      ],
    },
    // English — no prefix (default)
    { path: '/', component: Home },
    { path: '/room-login', component: RoomLogin },
    { path: '/rooms/:id', component: Room },
  ],
})

router.beforeEach((to) => {
  const isSpanish = to.path === '/es' || to.path.startsWith('/es/')
  const locale = isSpanish ? 'es' : 'en'

  const global = i18n.global as unknown as { locale: { value: string } }
  if (global.locale.value !== locale) {
    global.locale.value = locale
  }
})

export default router
