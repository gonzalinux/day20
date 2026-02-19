import type { RouteRecordRaw, Router } from 'vue-router'
import type { I18n } from 'vue-i18n'

const Home = () => import('@/views/HomeView.vue')
const NotFound = () => import('@/views/NotFoundView.vue')
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

export const routes: RouteRecordRaw[] = [
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
  { path: '/:pathMatch(.*)*', component: NotFound },
]

export function setupRouterGuards(router: Router, i18n: I18n): void {
  router.beforeEach((to) => {
    const isSpanish = to.path === '/es' || to.path.startsWith('/es/')
    const locale = isSpanish ? 'es' : 'en'

    const global = i18n.global as unknown as { locale: { value: string } }
    if (global.locale.value !== locale) {
      global.locale.value = locale
    }
    if (!import.meta.env.SSR) {
      document.documentElement.lang = locale
    }
  })
}
