<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute, useRouter } from 'vue-router'
import AppInput from '@/components/AppInput.vue'
import RoomCalendarLayout from '@/components/room/RoomCalendarLayout.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'
import { getMe, loginRoom } from '@/services/auth'
import { useRoomStore } from '@/stores/room'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const room = useRoomStore()

type State = 'loading' | 'nameYourself' | 'setAdminPin' | 'addPlayers' | 'pickUser' | 'calendar'
const state = ref<State>('loading')
const error = ref('')

room.$reset()
room.room.id = route.params.id as string

// nameYourself
const adminName = ref('')
const saving = ref(false)

// setAdminPin
const adminPin = ref('')
const settingPin = ref(false)

// pickUser
const selectingUser = ref(false)
const pickPinUserId = ref('')
const pickPinValue = ref('')

// addPlayers
const newPlayerName = ref('')
const addingPlayer = ref(false)

onMounted(async () => {
  try {
    // Check if we already have a valid session with a userId
    const me = await getMe(room.room.id).catch(() => null)
    if (me?.userId) {
      room.currentUserId = me.userId
      await Promise.all([room.fetchRoom(), room.fetchUsers()])
      if (route.query.token) router.replace({ query: {} })
      state.value = 'calendar'
      return
    }
  } catch {
    // No valid session — fall through to login
  }

  const token = route.query.token as string | undefined
  if (!token) {
    router.replace('/room-login?mode=join&name=' + room.room.id)
    error.value = 'No token provided'
    return
  }

  try {
    const result = await loginRoom(room.room.id, { token })
    router.replace({ query: {} })
    room.room.name = result.room.name
    await room.fetchUsers()
    if (room.users.length === 0) {
      state.value = 'nameYourself'
    } else {
      state.value = 'pickUser'
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})

async function submitName() {
  saving.value = true
  error.value = ''
  try {
    const user = await room.addUser(adminName.value, 'admin')
    await room.selectUser(user._id)
    state.value = 'setAdminPin'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

async function submitAdminPin() {
  settingPin.value = true
  error.value = ''
  try {
    await room.setPin(room.currentUserId, adminPin.value)
    state.value = 'addPlayers'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingPin.value = false
  }
}

async function submitAddPlayer() {
  addingPlayer.value = true
  error.value = ''
  try {
    await room.addUser(newPlayerName.value, 'user')
    newPlayerName.value = ''
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    addingPlayer.value = false
  }
}

function handlePickUser(userId: string) {
  const user = room.users.find((u) => u.id === userId)
  if (user?.hasPin) {
    pickPinUserId.value = userId
    pickPinValue.value = ''
    error.value = ''
    return
  }
  pickUserAndContinue(userId)
}

async function pickUserAndContinue(userId: string, pin?: string) {
  selectingUser.value = true
  error.value = ''
  try {
    await room.selectUser(userId, pin)
    state.value = 'calendar'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    selectingUser.value = false
  }
}

function submitPickPin() {
  pickUserAndContinue(pickPinUserId.value, pickPinValue.value)
}

function finishAddPlayers() {
  state.value = 'calendar'
}

// Delay layout class switch until the leave transition finishes,
// so the outgoing content doesn't jump while fading out.
const fullLayout = ref(false)

function onAfterLeave() {
  fullLayout.value = state.value === 'calendar'
}
</script>

<template>
  <div class="min-h-screen bg-bg font-body">
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-transparent">
      <RouterLink :to="localePath('/', locale)" class="font-heading font-bold text-primary no-underline">
        <span class="text-4xl">D</span><span class="text-2xl">ay</span
        ><span class="text-4xl">20</span>
      </RouterLink>
      <div class="flex items-center gap-2">
        <ThemeToggle />
        <LangToggle />
      </div>
    </nav>

    <!-- Content -->
    <main
      class="flex flex-col pt-16"
      :class="fullLayout ? 'h-screen' : 'items-center justify-center px-6 min-h-screen'"
    >
      <h1 v-if="room.room.name && !fullLayout" class="text-3xl font-heading font-bold text-primary mb-8">
        {{ room.room.name }}
      </h1>

      <Transition name="fade" mode="out-in" @after-leave="onAfterLeave">
        <!-- Loading -->
        <div v-if="state === 'loading'" key="loading" class="text-center">
          <p v-if="!error" class="text-xl text-secondary animate-pulse">
            {{ t('room.loggingIn') }}
          </p>
          <p v-else class="text-red-500">{{ error }}</p>
        </div>

        <!-- Name Yourself -->
        <div v-else-if="state === 'nameYourself'" key="nameYourself" class="w-full max-w-md">
          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
            <h2 class="text-2xl font-heading font-bold text-accent mb-2">
              {{ t('room.nameYourself') }}
            </h2>
            <p class="text-sm text-secondary/70 mb-6">{{ t('room.nameYourselfHint') }}</p>

            <form class="flex flex-col gap-4" @submit.prevent="submitName">
              <AppInput
                v-model="adminName"
                :label="t('room.yourName')"
                :placeholder="t('room.namePlaceholder')"
                class="focus:border-accent"
              />
              <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
              <button
                type="submit"
                :disabled="saving || !adminName.trim()"
                class="mt-2 bg-accent text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? t('room.saving') : t('room.continue') }}
              </button>
            </form>
          </div>
        </div>

        <!-- Set Admin PIN -->
        <div v-else-if="state === 'setAdminPin'" key="setAdminPin" class="w-full max-w-md">
          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
            <h2 class="text-2xl font-heading font-bold text-accent mb-2">
              {{ t('room.setPin') }}
            </h2>
            <p class="text-sm text-secondary/70 mb-6">{{ t('room.adminPinRequired') }}</p>

            <form class="flex flex-col gap-4" @submit.prevent="submitAdminPin">
              <AppInput
                v-model="adminPin"
                :label="t('room.pin')"
                :placeholder="t('room.pinHint')"
                type="password"
                inputmode="numeric"
                maxlength="4"
                pattern="\d{4}"
              />
              <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
              <button
                type="submit"
                :disabled="settingPin || adminPin.length !== 4"
                class="mt-2 bg-accent text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ settingPin ? t('room.saving') : t('room.continue') }}
              </button>
            </form>
          </div>
        </div>

        <!-- Add Players -->
        <div v-else-if="state === 'addPlayers'" key="addPlayers" class="w-full max-w-md">
          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
            <h2 class="text-2xl font-heading font-bold text-accent mb-2">
              {{ t('room.addPlayers') }}
            </h2>
            <p class="text-sm text-secondary/70 mb-6">{{ t('room.addPlayersHint') }}</p>

            <!-- User list -->
            <ul class="flex flex-col gap-2 mb-6">
              <li
                v-for="user in room.users"
                :key="user.id"
                class="flex items-center justify-between px-4 py-2 rounded-lg bg-bg/50"
              >
                <span class="text-primary font-body">{{ user.name }}</span>
                <span
                  v-if="user.role === 'admin'"
                  class="text-xs font-heading font-bold text-accent bg-accent/15 px-2 py-0.5 rounded"
                >
                  {{ t('room.admin') }}
                </span>
              </li>
            </ul>

            <!-- Add player form -->
            <form class="flex gap-2" @submit.prevent="submitAddPlayer">
              <div class="flex-1">
                <AppInput
                  v-model="newPlayerName"
                  :placeholder="t('room.playerNamePlaceholder')"
                  class="focus:border-accent"
                />
              </div>
              <button
                type="submit"
                :disabled="addingPlayer || !newPlayerName.trim()"
                class="bg-accent text-bg font-heading font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                {{ t('room.add') }}
              </button>
            </form>
            <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>

            <button
              @click="finishAddPlayers"
              class="mt-6 w-full bg-primary text-bg font-heading font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              {{ t('room.done') }}
            </button>
          </div>
        </div>

        <!-- Pick User -->
        <div v-else-if="state === 'pickUser'" key="pickUser" class="w-full max-w-md">
          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
            <h2 class="text-2xl font-heading font-bold text-accent mb-2">
              {{ t('room.whoAreYou') }}
            </h2>
            <p class="text-sm text-secondary/70 mb-6">{{ t('room.whoAreYouHint') }}</p>

            <ul class="flex flex-col gap-2">
              <li v-for="user in room.users" :key="user.id">
                <button
                  :disabled="selectingUser"
                  class="w-full flex items-center justify-between px-4 rounded-lg bg-bg/50 hover:bg-accent/10 hover:ring-1 hover:ring-accent/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="handlePickUser(user.id)"
                >
                  <span class="text-primary font-body pt-3 pb-1">{{ user.name }}</span>
                  <div class="flex items-center gap-1.5">
                    <VIcon v-if="user.hasPin" name="gi-padlock" class="text-secondary/50" scale="0.8" />
                    <span
                      v-if="user.role === 'admin'"
                      class="text-xs font-heading font-bold text-accent bg-accent/15 px-2 py-0.5 rounded"
                    >
                      {{ t('room.admin') }}
                    </span>
                  </div>
                </button>

                <!-- Inline PIN input -->
                <form
                  v-if="pickPinUserId === user.id"
                  class="flex gap-2 mt-1 px-1"
                  @submit.prevent="submitPickPin"
                >
                  <div class="flex-1">
                    <AppInput
                      v-model="pickPinValue"
                      :placeholder="t('room.enterPin')"
                      type="password"
                      inputmode="numeric"
                      maxlength="4"
                      pattern="\d{4}"
                    />
                  </div>
                  <button
                    type="submit"
                    :disabled="selectingUser || pickPinValue.length !== 4"
                    class="bg-accent text-bg font-heading font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    OK
                  </button>
                </form>
              </li>
            </ul>
            <p v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</p>
          </div>
        </div>

        <!-- Calendar layout -->
        <RoomCalendarLayout
          v-else-if="state === 'calendar'"
          key="calendar"
        />
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
