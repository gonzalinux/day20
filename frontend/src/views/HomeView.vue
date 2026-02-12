<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'

const { t, locale } = useI18n()

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
        <RouterLink
          :to="localePath('/', locale)"
          class="font-heading font-bold text-primary no-underline"
        >
          <span class="text-4xl">D</span><span class="text-2xl">ay</span
          ><span class="text-4xl">20</span>
        </RouterLink>
        <ThemeToggle />
        <LangToggle />
      </div>

      <!-- Right: action buttons -->
      <div class="flex flex-col items-end gap-1 w-32">
        <RouterLink
          :to="localePath('/room-login?mode=join', locale)"
          class="bg-primary text-bg w-32 text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-heading text-center"
        >
          {{ t('nav.joinRoom') }}
        </RouterLink>
        <RouterLink
          :to="localePath('/room-login?mode=create', locale)"
          class="bg-accent text-bg w-32 text-sm font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-heading text-center"
        >
          {{ t('nav.createRoom') }}
        </RouterLink>
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

      <RouterLink
        :to="localePath('/room-login', locale)"
        class="d20-button group relative w-72 h-72 cursor-pointer shrink-0"
      >
        <img
          src="/d20ImageAccentLight.png"
          alt="D20"
          class="hover-image w-full h-full object-contain transition-[filter] duration-300"
        />
        <img
          src="/d20ImageLight.png"
          alt="D20"
          class="d20-image w-full absolute h-full object-contain inset-0 opacity-100"
        />
        <span
          class="absolute inset-0 flex items-center justify-center font-heading font-bold text-accent transition-colors duration-300 group-hover:text-primary d20-text"
        >
          <span class="text-6xl">D</span><span class="text-4xl">ay</span
          ><span class="text-6xl">20</span>
        </span>
      </RouterLink>
    </main>

    <section class="bg-secondary w-full py-16 px-6">
      <div class="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:gap-16">
        <div class="space-y-8 text-center md:text-left">
          <h2
            class="text-2xl md:text-4xl font-bold text-primary uppercase tracking-wide font-heading"
          >
            {{ t('home.howItWorks') }}
          </h2>
          <ol class="space-y-6 text-lg md:text-xl text-bg max-w-md mx-auto md:mx-0">
            <li class="flex items-center gap-3">
              <span
                ><VIcon name="gi-doorway" class="text-primary shrink-0" scale="1.5" />{{
                  t('home.step1')
                }}</span
              >
            </li>
            <li class="flex items-center gap-3">
              <span
                ><VIcon name="gi-paint-brush" class="text-primary shrink-0" scale="1.5" />{{
                  t('home.step2')
                }}</span
              >
            </li>
            <li class="flex items-center gap-3">
              <span
                ><VIcon name="gi-sands-of-time" class="text-primary shrink-0" scale="1.5" />
                {{ t('home.step3') }}
              </span>
            </li>
          </ol>
        </div>
        <!-- Image placeholder (right side on desktop, below on mobile) -->
        <div class="mt-8 md:mt-0 shrink-0"></div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-primary py-6 px-6 text-center text-sm text-bg">
      Created by
      <a
        href="https://github.com/gonzalinux"
        target="_blank"
        rel="noopener"
        class="text-bg hover:underline font-bold"
        >@gonzalinux</a
      >
      with love and care for his friends
    </footer>
  </div>
</template>

<style scoped>
.d20-image {
  filter: drop-shadow(0 0 12px var(--color-accent));
  transition:
    filter 500ms,
    opacity 300ms !important;
}
.d20-button:hover .hover-image {
  filter: drop-shadow(0 0 16px var(--color-primary));
}

.d20-button:hover .d20-image {
  opacity: 0%;
}

.d20-text {
  text-shadow:
    0 0 6px var(--color-bg),
    0 0 12px var(--color-bg),
    0 0 20px var(--color-bg),
    0 0 30px var(--color-bg);
  transition: text-shadow 300ms;
}

.d20-button:hover .d20-text {
  text-shadow:
    0 0 6px var(--color-bg),
    0 0 12px var(--color-bg),
    0 0 20px var(--color-bg),
    0 0 30px var(--color-bg);
}
</style>
