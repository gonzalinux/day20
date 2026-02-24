<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import DemoRoomForm from './DemoRoomForm.vue'
import DemoCalendar from './DemoCalendar.vue'
import DemoCombinedCalendar from './DemoCombinedCalendar.vue'
import { DEMO_ROOM_NAME, DEMO_YOU } from './demoConstants'

const { t } = useI18n()

const step = ref<1 | 2 | 3>(1)
const started = ref(false)
const demoRoomName = ref('')
const userSlots = ref<boolean[][]>([])
const sectionRef = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null

function onStep1Done(name: string) {
  demoRoomName.value = name
  step.value = 2
}

function onStep2Done(slots: boolean[][]) {
  userSlots.value = slots
  step.value = 3
}

function reset() {
  step.value = 1
  demoRoomName.value = ''
  userSlots.value = []
}

function goToStep(n: 1 | 2 | 3) {
  if (n === 1) {
    reset()
  } else if (n === 2) {
    if (!demoRoomName.value) demoRoomName.value = DEMO_ROOM_NAME
    userSlots.value = []
    step.value = 2
  } else {
    if (!demoRoomName.value) demoRoomName.value = DEMO_ROOM_NAME
    if (!userSlots.value.length) userSlots.value = DEMO_YOU.map((d) => [...d])
    step.value = 3
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        started.value = true
        observer?.disconnect()
        observer = null
      }
    },
    { threshold: 0.1 },
  )
  if (sectionRef.value) observer.observe(sectionRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

const steps = [
  { key: 1, label: () => t('home.step1'), icon: 'gi-doorway' },
  { key: 2, label: () => t('home.step2'), icon: 'gi-paint-brush' },
  { key: 3, label: () => t('home.step3'), icon: 'gi-sands-of-time' },
] as const
</script>

<template>
  <div ref="sectionRef" class="flex flex-col md:flex-row md:items-start md:gap-16">
    <div class="md:w-auto mb-8 md:mb-0 shrink-0">
      <h2
        class="text-2xl md:text-4xl font-bold text-primary dark:text-bg uppercase tracking-wide font-heading mb-6 text-center md:text-left"
      >
        {{ t('home.howItWorks') }}
      </h2>
      <ol class="space-y-5 max-w-xs mx-auto md:mx-0">
        <li
          v-for="s in steps"
          :key="s.key"
          class="flex items-center gap-3 text-bg dark:text-bg transition-all duration-300 cursor-pointer select-none"
          :class="step === s.key ? 'opacity-100 font-bold' : 'opacity-40 hover:opacity-70'"
          @click="started && goToStep(s.key)"
        >
          <VIcon
            :name="s.icon"
            class="shrink-0"
            :class="step === s.key ? 'text-primary dark:text-bg' : 'text-bg dark:text-bg'"
            scale="1.5"
          />
          <span
            class="text-lg md:text-xl"
            :class="step === s.key ? 'text-primary dark:text-bg' : ''"
          >
            {{ s.label() }}
          </span>
        </li>
      </ol>
    </div>

    <div class="flex-1 flex items-center justify-center md:h-[500px]">
      <Transition name="fade" mode="out-in">
        <div v-if="!started" key="pre" class="w-full max-w-sm min-h-64" />
        <div v-else-if="step === 1" key="1" class="w-full">
          <DemoRoomForm @advance="onStep1Done" />
        </div>
        <div v-else-if="step === 2" key="2" class="w-full">
          <DemoCalendar :room-name="demoRoomName" @advance="onStep2Done" />
        </div>
        <div v-else key="3" class="w-full">
          <DemoCombinedCalendar
            :room-name="demoRoomName"
            :user-slots="userSlots"
            @restart="reset"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
