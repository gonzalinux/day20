import { OhVueIcon, addIcons } from 'oh-vue-icons'
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaComment,
  FaTimes,
  GiBrokenSkull,
  GiCalendarHalfYear,
  GiChatBubble,
  GiCheckMark,
  GiCog,
  GiDiceTwentyFacesTwenty,
  GiDoorway,
  GiDungeonGate,
  GiLinkedRings,
  GiMoonBats,
  GiPadlock,
  GiPaintBrush,
  GiReturnArrow,
  GiSandsOfTime,
  GiScrollUnfurled,
  GiSunrise,
  GiTabletopPlayers,
  GiWorld,
} from 'oh-vue-icons/icons'
import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'
import './main.css'

import App from './App.vue'
import { createI18nInstance } from './i18n'
import { routes, setupRouterGuards } from './router'

addIcons(
  GiDiceTwentyFacesTwenty,
  GiDoorway,
  GiScrollUnfurled,
  GiPaintBrush,
  GiSandsOfTime,
  GiSunrise,
  GiMoonBats,
  GiDungeonGate,
  GiReturnArrow,
  GiTabletopPlayers,
  GiCalendarHalfYear,
  GiCog,
  GiLinkedRings,
  GiCheckMark,
  GiPadlock,
  GiBrokenSkull,
  GiWorld,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaComment,
  FaTimes,
  GiChatBubble,
)

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  ({ app, router }) => {
    const i18n = createI18nInstance()
    app.component('VIcon', OhVueIcon)
    app.use(createPinia())
    app.use(i18n)
    setupRouterGuards(router, i18n)
  },
)
