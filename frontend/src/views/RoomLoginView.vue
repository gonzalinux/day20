<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { localePath } from '@/i18n'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'
import AppInput from '@/components/AppInput.vue'
import { createRoom, roomExists } from '@/services/rooms'
import { loginRoom } from '@/services/auth'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const initialMode = route.query.mode
const initialName = route.query.name as string | undefined
const activePanel = ref<'create' | 'join' | null>(
  initialMode === 'create' || initialMode === 'join' ? initialMode : null,
)

const createStep = ref(1)
const roomName = ref(initialName ?? '')
const roomPassword = ref('')
const roomDescription = ref('')
const sessionMinHours = ref(1)
const sessionMaxHours = ref(4)
const availableFrom = ref(10)
const availableTo = ref(23)

const enabledDays = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: true,
}

watch(sessionMinHours, (min) => {
  if (sessionMaxHours.value < min) sessionMaxHours.value = min
})

function setPanel(mode: 'create' | 'join' | null) {
  activePanel.value = mode
  if (mode !== 'create') createStep.value = 1
  nameError.value = ''
  passwordError.value = ''
  createError.value = ''
  joinError.value = ''
  router.replace({ query: mode ? { mode } : {} })
}

async function nextCreateStep() {
  if (createStep.value === 1) {
    if (!validateStep1()) return
    createError.value = ''
    loading.value = true
    try {
      const exists = await roomExists(roomName.value)
      if (exists) {
        createError.value = t('roomLogin.roomAlreadyExists')
        return
      }
    } catch {
      // If the check fails, let the user proceed — creation will catch the real error
    } finally {
      loading.value = false
    }
  }
  createStep.value++
}

function prevCreateStep() {
  createStep.value--
}

const loading = ref(false)
const createError = ref('')
const joinError = ref('')
const nameError = ref('')
const passwordError = ref('')

function validateStep1(): boolean {
  nameError.value = ''
  passwordError.value = ''
  let valid = true
  if (!roomName.value.trim()) {
    nameError.value = t('roomLogin.nameRequired')
    valid = false
  }
  if (!roomPassword.value.trim()) {
    passwordError.value = t('roomLogin.passwordRequired')
    valid = false
  }
  return valid
}

type TimeOfDay = { hour: number; minute: number }
type DayKey = keyof typeof enabledDays

function buildDefaultAvailability() {
  const days = Object.keys(enabledDays) as DayKey[]
  return days.reduce(
    (week, day) => {
      week[day] = enabledDays[day]
        ? [
            {
              start: { hour: availableFrom.value, minute: 0 },
              end: { hour: availableTo.value, minute: 0 },
            },
          ]
        : []
      return week
    },
    {} as Record<DayKey, { start: TimeOfDay; end: TimeOfDay }[]>,
  )
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
      defaultAvailability: buildDefaultAvailability(),
    })
    router.push({ path: localePath(`/rooms/${_id}`, locale.value), query: { token: magicToken } })
  } catch (e: unknown) {
    createError.value = (e as Error)?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function submitJoinRoom() {
  if (!validateStep1()) return
  loading.value = true
  joinError.value = ''
  try {
    const { room } = await loginRoom(roomName.value, {
      password: roomPassword.value,
    })
    router.push({
      path: localePath(`/rooms/${room._id}`, locale.value),
      query: { token: room.magicToken },
    })
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
    </nav>

    <!-- Content -->
    <main class="flex flex-col items-center justify-center px-6 min-h-screen pt-2 lg:pt-16">
      <!-- Title -->
      <h1 class="font-bold text-primary mb-2 font-heading">
        <span class="text-6xl lg:text-8xl">D</span><span class="text-4xl">ay</span
        ><span class="text-6xl">20</span>
      </h1>
      <p class="text-xl text-secondary mb-6 lg:mb-12 font-body">{{ t('roomLogin.title') }}</p>

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
                @click="createStep = 1"
                class="size-7 rounded-full flex items-center justify-center text-sm font-bold font-heading pb-1 select-none cursor-pointer"
                :class="createStep === 1 ? 'bg-accent text-bg' : 'bg-secondary/30 text-secondary'"
                >1</span
              >
              <span class="h-0.5 flex-1 bg-secondary/30" />
              <span
                @click="createStep > 1 ? createStep = 2 : null"
                class="size-7 rounded-full flex items-center justify-center text-sm font-bold font-heading pb-1 select-none"
                :class="[createStep === 2 ? 'bg-accent text-bg' : 'bg-secondary/30 text-secondary', createStep > 1 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50']"
                >2</span
              >
              <span class="h-0.5 flex-1 bg-secondary/30" />
              <span
                @click="createStep > 2 ? createStep = 3 : null"
                class="size-7 rounded-full flex items-center justify-center text-sm font-bold font-heading pb-1 select-none"
                :class="[createStep === 3 ? 'bg-accent text-bg' : 'bg-secondary/30 text-secondary', createStep > 2 ? 'cursor-pointer' : 'cursor-not-allowed opacity-50']"
                >3</span
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
                  :error="nameError"
                  class="focus:border-accent"
                />
                <AppInput
                  v-model="roomPassword"
                  type="password"
                  :label="t('roomLogin.password')"
                  :placeholder="t('roomLogin.password')"
                  :error="passwordError"
                  class="focus:border-accent"
                />
                <p v-if="createError" class="text-red-500 text-sm">{{ createError }}</p>
                <button
                  type="submit"
                  :disabled="loading"
                  class="mt-2 bg-accent text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ t('roomLogin.next') }}
                </button>
              </form>

              <!-- Step 2: Description & Duration -->
              <form
                v-else-if="createStep === 2"
                key="step2"
                class="flex flex-col gap-4"
                @submit.prevent="nextCreateStep"
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
                <button
                  type="submit"
                  class="mt-2 bg-accent text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {{ t('roomLogin.next') }}
                </button>
              </form>

              <!-- Step 3: Available Session Times -->
              <form
                v-else
                key="step3"
                class="flex flex-col gap-4"
                @submit.prevent="submitCreateRoom"
              >
                <p class="text-sm text-secondary/70 italic">
                  {{ t('roomLogin.availableTimesHint') }}
                </p>
                <div class="flex gap-2.5 justify-center">
                  <button
                    v-for="[name, enabled] in Object.entries(enabledDays)"
                    :key="name"
                    type="button"
                    class="w-10 h-11 rounded-lg text-xs font-heading font-bold transition-colors cursor-pointer"
                    :class="enabled ? 'bg-accent text-bg' : 'bg-secondary/20 text-secondary'"
                    @click="enabledDays[name as DayKey] = !enabled"
                  >
                    {{ t(`roomLogin.day_${name}`) }}
                  </button>
                </div>
                <div class="flex gap-4">
                  <AppInput
                    v-model="availableFrom"
                    type="number"
                    :min="0"
                    :max="23"
                    :label="t('roomLogin.availableFrom')"
                    placeholder="10"
                    class="focus:border-accent"
                  />
                  <AppInput
                    v-model="availableTo"
                    type="number"
                    :min="1"
                    :max="24"
                    :label="t('roomLogin.availableTo')"
                    placeholder="23"
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
                :error="nameError"
                class="focus:border-primary"
              />
              <AppInput
                v-model="roomPassword"
                type="password"
                :label="t('roomLogin.password')"
                :placeholder="t('roomLogin.password')"
                :error="passwordError"
                class="focus:border-primary"
              />
              <p v-if="joinError" class="text-red-500 text-sm">{{ joinError }}</p>
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
