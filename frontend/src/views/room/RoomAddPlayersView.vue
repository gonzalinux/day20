<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute, useRouter } from 'vue-router'
import AppInput from '@/components/AppInput.vue'
import { useRoomStore } from '@/stores/room'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const room = useRoomStore()

const newPlayerName = ref('')
const addingPlayer = ref(false)
const error = ref('')
const roomId = route.params.id as string

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

function finishAddPlayers() {
  router.push(localePath(`/rooms/${roomId}/calendar`, locale.value))
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
      <h2 class="text-2xl font-heading font-bold text-accent mb-2">
        {{ t('room.addPlayers') }}
      </h2>
      <p class="text-sm text-secondary/70 mb-6">{{ t('room.addPlayersHint') }}</p>

      <ul class="flex flex-col gap-2 mb-6">
        <li
          v-for="user in room.users"
          :key="user.id"
          class="flex items-center justify-between px-4 py-2 rounded-lg bg-bg/50"
        >
          <span class="text-primary font-heading">{{ user.name }}</span>
          <span
            v-if="user.role === 'admin'"
            class="text-xs font-heading font-bold text-accent bg-accent/15 px-2 py-0.5 rounded"
          >
            {{ t('room.admin') }}
          </span>
        </li>
      </ul>

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
          class="bg-accent text-bg font-heading font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start"
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
</template>
