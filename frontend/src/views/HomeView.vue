<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'

const { t } = useI18n()

const scrolled = ref(false)
const titleEl = ref<HTMLElement | null>(null)

function onScroll() {
  if (!titleEl.value) return
  const bottom = titleEl.value.getBoundingClientRect().bottom
  scrolled.value = bottom < 0
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="min-h-screen bg-bg font-body">
    <!-- Navbar -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 transition-colors duration-300"
      :class="scrolled ? 'bg-secondary/90 backdrop-blur-sm' : 'bg-transparent'"
    >
      <!-- Left: logo + toggles -->
      <div class="flex gap-4 align-bottom">
        <span class="hidden md:block font-heading font-bold text-3xl text-primary">Day20</span>
        <ThemeToggle />
        <LangToggle />
      </div>

      <!-- Right: action buttons -->
      <div class="flex flex-col items-end gap-1 w-40">
        <button
          class="bg-accent text-bg w-40 text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-heading"
        >
          {{ t('nav.createRoom') }}
        </button>
        <button
          class="bg-primary text-bg w-40 text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-heading"
        >
          {{ t('nav.joinRoom') }}
        </button>
      </div>
    </nav>

    <!-- Hero -->
    <main class="flex flex-col items-center justify-center px-6 min-h-screen md:flex-row md:gap-16">
      <div class="flex flex-col items-start md:-translate-x-8">
        <h1 ref="titleEl" class="font-bold text-primary mb-6 font-heading">
          <span class="text-8xl">D</span><span class="text-5xl">ay</span
          ><span class="text-8xl">20</span>
        </h1>
        <div class="text-2xl text-secondary space-y-2 mb-8 ml-6">
          <p>{{ t('home.q1') }}</p>
          <p>{{ t('home.q2') }}</p>
          <p>{{ t('home.q3') }}</p>
          <p class="font-bold text-accent">{{ t('home.cta') }}</p>
        </div>
      </div>

      <button class="d20-button group relative w-48 h-48 cursor-pointer shrink-0">
        <img
          src="/d20Image.png"
          alt="D20"
          class="d20-image w-full h-full object-contain transition-[filter] duration-300"
        />
        <span
          class="absolute inset-0 flex items-center justify-center font-heading font-bold text-accent transition-colors duration-300 group-hover:text-primary"
        >
          <span class="text-4xl">D</span><span class="text-2xl">ay</span
          ><span class="text-4xl">20</span>
        </span>
      </button>
    </main>

    <section class="bg-secondary w-full py-16 px-6">
      <div class="max-w-2xl mx-auto space-y-8 text-center">
        <h2 class="text-2xl font-bold text-primary uppercase tracking-wide font-heading">
          {{ t('home.howItWorks') }}
        </h2>
        <ol class="space-y-6 text-lg text-bg max-w-md mx-auto">
          <li class="flex items-center gap-3">
            <VIcon name="gi-doorway" class="text-primary shrink-0" scale="1.5" />{{ t('home.step1') }}
          </li>
          <li class="flex items-center gap-3">
            <VIcon name="gi-paint-brush" class="text-primary shrink-0" scale="1.5" />{{ t('home.step2') }}
          </li>
          <li class="flex items-center gap-3">
            <VIcon name="gi-sands-of-time" class="text-primary shrink-0" scale="1.5" />{{ t('home.step3') }}
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<style scoped>
.d20-image {
  filter: drop-shadow(0 0 12px var(--color-accent));
}

.d20-button:hover .d20-image {
  filter: drop-shadow(0 0 16px var(--color-primary));
}
</style>
