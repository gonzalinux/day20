<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'
import AppInput from '@/components/AppInput.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const initialMode = route.query.mode
const activePanel = ref<'create' | 'join' | null>(
  initialMode === 'create' || initialMode === 'join' ? initialMode : null,
)

function setPanel(mode: 'create' | 'join' | null) {
  activePanel.value = mode
  router.replace({ query: mode ? { mode } : {} })
}
</script>

<template>
  <div class="min-h-screen bg-bg font-body">
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 flex items-center px-6 py-3 bg-transparent">
      <div class="flex gap-4 align-bottom">
        <span class="hidden md:block font-heading font-bold text-3xl text-primary">Day20</span>
        <ThemeToggle />
        <LangToggle />
      </div>
    </nav>

    <!-- Content -->
    <main class="flex flex-col items-center justify-center px-6 min-h-screen pt-16">
      <!-- Title -->
      <h1 class="font-bold text-primary mb-2 font-heading">
        <span class="text-8xl">D</span><span class="text-5xl">ay</span
        ><span class="text-8xl">20</span>
      </h1>
      <p class="text-xl text-secondary mb-12 font-body">{{ t('roomLogin.title') }}</p>

      <!-- Default: two big buttons -->
      <Transition name="fade" mode="out-in">
        <div
          v-if="activePanel === null"
          key="buttons"
          class="flex flex-col md:flex-row gap-6 w-full max-w-2xl"
        >
          <!-- Create Room -->
          <button
            @click="setPanel('create')"
            class="flex-1 flex flex-col items-center gap-4 p-8 rounded-2xl bg-secondary/20 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
          >
            <VIcon
              name="gi-doorway"
              class="text-accent group-hover:scale-110 transition-transform"
              scale="3"
            />
            <span class="text-2xl font-heading font-bold text-accent">{{
              t('roomLogin.createRoom')
            }}</span>
            <span class="text-sm text-secondary">{{ t('roomLogin.createDesc') }}</span>
          </button>

          <!-- Join Room -->
          <button
            @click="setPanel('join')"
            class="flex-1 flex flex-col items-center gap-4 p-8 rounded-2xl bg-secondary/20 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
          >
            <VIcon
              name="gi-dungeon-gate"
              class="text-primary group-hover:scale-110 transition-transform"
              scale="3"
            />
            <span class="text-2xl font-heading font-bold text-primary">{{
              t('roomLogin.joinRoom')
            }}</span>
            <span class="text-sm text-secondary">{{ t('roomLogin.joinDesc') }}</span>
          </button>
        </div>

        <!-- Create Room Panel -->
        <div v-else-if="activePanel === 'create'" key="create" class="w-full max-w-md">
          <button
            @click="setPanel(null)"
            class="flex items-center gap-2 text-secondary hover:text-primary transition-colors cursor-pointer mb-6 font-heading"
          >
            <VIcon name="gi-return-arrow" scale="1.2" />
            {{ t('roomLogin.back') }}
          </button>

          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
            <h2 class="text-2xl font-heading font-bold text-accent mb-6">
              {{ t('roomLogin.createRoom') }}
            </h2>
            <form class="flex flex-col gap-4" @submit.prevent>
              <div>
                <label class="block text-sm font-semibold text-secondary mb-1">{{
                  t('roomLogin.roomName')
                }}</label>
                <AppInput
                  :placeholder="t('roomLogin.roomName')"
                  class="focus:border-accent"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-secondary mb-1">{{
                  t('roomLogin.password')
                }}</label>
                <AppInput
                  type="password"
                  :placeholder="t('roomLogin.password')"
                  class="focus:border-accent"
                />
              </div>
              <button
                type="submit"
                class="mt-2 bg-accent text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                {{ t('roomLogin.create') }}
              </button>
            </form>
          </div>
        </div>

        <!-- Join Room Panel -->
        <div v-else-if="activePanel === 'join'" key="join" class="w-full max-w-md">
          <button
            @click="setPanel(null)"
            class="flex items-center gap-2 text-secondary hover:text-primary transition-colors cursor-pointer mb-6 font-heading"
          >
            <VIcon name="gi-return-arrow" scale="1.2" />
            {{ t('roomLogin.back') }}
          </button>

          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
            <h2 class="text-2xl font-heading font-bold text-primary mb-6">
              {{ t('roomLogin.joinRoom') }}
            </h2>
            <p class="text-sm text-secondary/70 italic mb-4">{{ t('roomLogin.joinHint') }}</p>
            <form class="flex flex-col gap-4" @submit.prevent>
              <div>
                <label class="block text-sm font-semibold text-secondary mb-1">{{
                  t('roomLogin.roomCode')
                }}</label>
                <AppInput
                  :placeholder="t('roomLogin.roomCode')"
                  class="focus:border-primary"
                />
              </div>
              <div>
                <label class="block text-sm font-semibold text-secondary mb-1">{{
                  t('roomLogin.password')
                }}</label>
                <AppInput
                  type="password"
                  :placeholder="t('roomLogin.password')"
                  class="focus:border-primary"
                />
              </div>
              <button
                type="submit"
                class="mt-2 bg-primary text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                {{ t('roomLogin.join') }}
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
