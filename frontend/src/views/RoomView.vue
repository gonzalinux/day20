<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'
import AppInput from '@/components/AppInput.vue'
import { loginRoom, selectUser } from '@/services/auth'
import { addUsers, getUsersFromRoom } from '@/services/users'

const { t } = useI18n()
const route = useRoute()

type State = 'loading' | 'nameYourself' | 'addPlayers' | 'calendar'
const state = ref<State>('loading')
const error = ref('')

const roomId = route.params.id as string
const roomName = ref('')

// nameYourself
const adminName = ref('')
const saving = ref(false)

// addPlayers
const users = ref<{ id: string; name: string; role: string }[]>([])
const newPlayerName = ref('')
const addingPlayer = ref(false)

const emptyWeek = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
}

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (!token) {
    error.value = 'No token provided'
    return
  }

  try {
    const result = await loginRoom(roomId, { token })
    roomName.value = result.room.name
    const fetchedUsers = await getUsersFromRoom(result.room._id)

    users.value = fetchedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
    }))
    if (fetchedUsers.length === 0) {
      state.value = 'nameYourself'
    } else {
      state.value = 'calendar'
    }
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
})

async function submitName() {
  saving.value = true
  error.value = ''
  try {
    const { insertedIds } = await addUsers(roomId, {
      users: [
        {
          roomId,
          name: adminName.value,
          role: 'admin' as const,
          weeklyAvailability: emptyWeek,
          overrides: [],
        },
      ],
    })
    await selectUser(roomId, insertedIds[0])
    users.value.push({ id: insertedIds[0], name: adminName.value, role: 'admin' })
    state.value = 'addPlayers'
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    saving.value = false
  }
}

async function submitAddPlayer() {
  addingPlayer.value = true
  error.value = ''
  try {
    const { insertedIds } = await addUsers(roomId, {
      users: [
        {
          roomId,
          name: newPlayerName.value,
          role: 'user' as const,
          weeklyAvailability: emptyWeek,
          overrides: [],
        },
      ],
    })
    users.value.push({ id: insertedIds[0], name: newPlayerName.value, role: 'user' })
    newPlayerName.value = ''
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    addingPlayer.value = false
  }
}

function finishAddPlayers() {
  state.value = 'calendar'
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
      <h1 v-if="roomName" class="text-3xl font-heading font-bold text-primary mb-8">
        {{ roomName }}
      </h1>

      <Transition name="fade" mode="out-in">
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
                v-for="user in users"
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

        <!-- Calendar placeholder -->
        <div v-else-if="state === 'calendar'" key="calendar" class="w-full max-w-2xl">
          <div class="rounded-2xl bg-secondary/20 shadow-lg p-8 text-center">
            <VIcon name="gi-calendar-half-year" class="text-accent mb-4" scale="3" />
            <h2 class="text-2xl font-heading font-bold text-accent mb-2">
              {{ t('room.calendarTitle') }}
            </h2>
            <p class="text-secondary">{{ t('room.calendarPlaceholder') }}</p>
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
