import { createRouter, createWebHistory } from 'vue-router'
import i18n from '@/i18n'

const Home = () => import('@/views/HomeView.vue')
const RoomLogin = () => import('@/views/RoomLoginView.vue')
const RoomLayout = () => import('@/views/RoomView.vue')
const RoomEntry = () => import('@/views/room/RoomEntry.vue')
const RoomName = () => import('@/views/room/RoomNameView.vue')
const RoomPin = () => import('@/views/room/RoomPinView.vue')
const RoomAddPlayers = () => import('@/views/room/RoomAddPlayersView.vue')
const RoomPickUser = () => import('@/views/room/RoomPickUserView.vue')
const RoomCalendar = () => import('@/views/room/RoomCalendarView.vue')

const roomChildren = [
  { path: '', component: RoomEntry },
  { path: 'name', component: RoomName },
  { path: 'pin', component: RoomPin },
  { path: 'add-players', component: RoomAddPlayers },
  { path: 'pick-user', component: RoomPickUser },
  { path: 'calendar', component: RoomCalendar },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Spanish — prefixed
    {
      path: '/es',
      children: [
        { path: '', component: Home },
        { path: 'room-login', component: RoomLogin },
        { path: 'rooms/:id', component: RoomLayout, children: roomChildren },
      ],
    },
    // English — no prefix (default)
    { path: '/', component: Home },
    { path: '/room-login', component: RoomLogin },
    { path: '/rooms/:id', component: RoomLayout, children: roomChildren },
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
