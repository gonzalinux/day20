<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'
import AppInput from '@/components/AppInput.vue'
import { createRoom } from '@/services/rooms'
import { loginRoom } from '@/services/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const initialMode = route.query.mode
const activePanel = ref<'create' | 'join' | null>(
  initialMode === 'create' || initialMode === 'join' ? initialMode : null,
)

const createStep = ref(1)
const roomName = ref('')
const roomPassword = ref('')
const roomDescription = ref('')
const sessionMinHours = ref(1)
const sessionMaxHours = ref(4)

watch(sessionMinHours, (min) => {
  if (sessionMaxHours.value < min) sessionMaxHours.value = min
})

function setPanel(mode: 'create' | 'join' | null) {
  activePanel.value = mode
  if (mode !== 'create') createStep.value = 1
  router.replace({ query: mode ? { mode } : {} })
}

function nextCreateStep() {
  createStep.value = 2
}

function prevCreateStep() {
  createStep.value = 1
}

const loading = ref(false)
const createError = ref('')
const joinError = ref('')

const emptyWeek = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
}

async function submitCreateRoom() {
  loading.value = true
  createError.value = ''
  try {
    const { _id, magicToken } = await createRoom({
      name: roomName.value,
      description: roomDescription.value,
      password: roomPassword.value,
      duration: { min: sessionMinHours.value, max: sessionMaxHours.value },
      defaultAvailability: emptyWeek,
    })
    router.push({ path: `/rooms/${_id}`, query: { token: magicToken } })
  } catch (e: unknown) {
    createError.value = (e as Error)?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function submitJoinRoom() {
  loading.value = true
  joinError.value = ''
  try {
    const { room } = await loginRoom(roomName.value, {
      password: roomPassword.value,
    })
    router.push({ path: `/rooms/${room._id}`, query: { token: room.magicToken } })
  } catch (e: unknown) {
    joinError.value = (e as Error)?.message ?? String(e)
  } finally {
    loading.value = false
  }
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
            @click="createStep === 1 ? setPanel(null) : prevCreateStep()"
            class="flex items-center gap-2 text-secondary hover:text-primary transition-colors cursor-pointer mb-6 font-heading"
          >
            <VIcon name="gi-return-arrow" scale="1.2" />
            {{ t('roomLogin.back') }}
          </button>

          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
            <h2 class="text-2xl font-heading font-bold text-accent mb-6">
              {{ t('roomLogin.createRoom') }}
            </h2>

            <!-- Step indicator -->
            <div class="flex items-center gap-2 mb-6">
              <span
                class="size-7 rounded-full flex items-center justify-center text-sm font-bold font-heading"
                :class="createStep === 1 ? 'bg-accent text-bg' : 'bg-secondary/30 text-secondary'"
                >1</span
              >
              <span class="h-0.5 flex-1 bg-secondary/30" />
              <span
                class="size-7 rounded-full flex items-center justify-center text-sm font-bold font-heading"
                :class="createStep === 2 ? 'bg-accent text-bg' : 'bg-secondary/30 text-secondary'"
                >2</span
              >
            </div>

            <Transition name="fade" mode="out-in">
              <!-- Step 1: Name & Password -->
              <form
                v-if="createStep === 1"
                key="step1"
                class="flex flex-col gap-4"
                @submit.prevent="nextCreateStep"
              >
                <AppInput
                  v-model="roomName"
                  :label="t('roomLogin.roomName')"
                  :placeholder="t('roomLogin.roomName')"
                  class="focus:border-accent"
                />
                <AppInput
                  v-model="roomPassword"
                  type="password"
                  :label="t('roomLogin.password')"
                  :placeholder="t('roomLogin.password')"
                  class="focus:border-accent"
                />
                <button
                  type="submit"
                  class="mt-2 bg-accent text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {{ t('roomLogin.next') }}
                </button>
              </form>

              <!-- Step 2: Description & Duration -->
              <form
                v-else
                key="step2"
                class="flex flex-col gap-4"
                @submit.prevent="submitCreateRoom"
              >
                <AppInput
                  v-model="roomDescription"
                  :label="t('roomLogin.description')"
                  :placeholder="t('roomLogin.descriptionPlaceholder')"
                  class="focus:border-accent"
                />
                <div class="flex gap-4">
                  <AppInput
                    v-model="sessionMinHours"
                    type="number"
                    :min="1"
                    :max="23"
                    :label="t('roomLogin.minDuration')"
                    placeholder="1"
                    class="focus:border-accent"
                  />
                  <AppInput
                    v-model="sessionMaxHours"
                    type="number"
                    :min="sessionMinHours"
                    :max="24"
                    :label="t('roomLogin.maxDuration')"
                    placeholder="4"
                    class="focus:border-accent"
                  />
                </div>
                <p v-if="createError" class="text-red-500 text-sm">{{ createError }}</p>
                <button
                  type="submit"
                  :disabled="loading"
                  class="mt-2 bg-accent text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ loading ? t('roomLogin.creating') : t('roomLogin.create') }}
                </button>
              </form>
            </Transition>
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
              <AppInput
                v-model="roomName"
                :label="t('roomLogin.roomName')"
                :placeholder="t('roomLogin.roomName')"
                class="focus:border-primary"
              />
              <AppInput
                v-model="roomPassword"
                type="password"
                :label="t('roomLogin.password')"
                :placeholder="t('roomLogin.password')"
                class="focus:border-primary"
              />
              <button
                @click="submitJoinRoom"
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
