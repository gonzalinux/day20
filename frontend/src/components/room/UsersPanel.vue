<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppInput from '@/components/AppInput.vue'
import { addUser } from '@/services/users'

type RoomUser = { id: string; name: string; role: string }

const props = defineProps<{
  users: RoomUser[]
  currentUserId: string
  roomId: string
}>()

const emit = defineEmits<{
  'user-added': [user: RoomUser]
}>()

const { t } = useI18n()

const currentUser = computed(() => props.users.find((u) => u.id === props.currentUserId))
const isAdmin = computed(() => currentUser.value?.role === 'admin')

const newPlayerName = ref('')
const addingPlayer = ref(false)
const error = ref('')

const emptyWeek = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
}

async function submitAddPlayer() {
  addingPlayer.value = true
  error.value = ''
  try {
    const user = await addUser(props.roomId, {
      name: newPlayerName.value,
      role: 'user' as const,
      weeklyAvailability: emptyWeek,
      overrides: [],
    })

    emit('user-added', { id: user._id, name: user.name, role: user.role })
    newPlayerName.value = ''
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    addingPlayer.value = false
  }
}
</script>

<template>
  <div class="h-full p-4 overflow-y-auto flex flex-col">
    <h2 class="text-xl font-heading font-bold text-accent mb-4">
      {{ t('room.navUsers') }}
    </h2>

    <ul class="flex flex-col gap-2">
      <li
        v-for="user in users"
        :key="user.id"
        class="flex items-center justify-between px-4 rounded-lg"
        :class="user.id === currentUserId ? 'bg-accent/10 ring-1 ring-accent/30' : 'bg-bg/50'"
      >
        <span class="text-primary font-body pt-3 pb-1">{{ user.name }}</span>
        <div class="flex items-center gap-1.5">
          <span
            v-if="user.id === currentUserId"
            class="text-xs font-heading font-bold text-primary bg-primary/15 px-2 py-0.5 rounded"
          >
            {{ t('room.you') }}
          </span>
          <span
            v-if="user.role === 'admin'"
            class="text-xs font-heading font-bold text-accent bg-accent/15 px-2 py-0.5 rounded"
          >
            {{ t('room.admin') }}
          </span>
        </div>
      </li>
    </ul>

    <!-- Add player form (admin only) -->
    <div v-if="isAdmin" class="mt-auto pt-4">
      <form class="flex gap-2" @submit.prevent="submitAddPlayer">
        <div class="flex-1">
          <AppInput v-model="newPlayerName" :placeholder="t('room.playerNamePlaceholder')" />
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
    </div>
  </div>
</template>
