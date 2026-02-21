import './main.css'
import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import { OhVueIcon, addIcons } from 'oh-vue-icons'
import {
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
} from 'oh-vue-icons/icons'

import App from './App.vue'
import { routes, setupRouterGuards } from './router'
import { createI18nInstance } from './i18n'

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
