import './main.css'
import { createApp } from 'vue'
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
  GiArrowDunk,
  GiBrokenSkull,
} from 'oh-vue-icons/icons'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

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
  GiArrowDunk,
  GiBrokenSkull,
)

const app = createApp(App)

app.component('VIcon', OhVueIcon)
app.use(createPinia())
app.use(i18n)
app.use(router)

app.mount('#app')
