<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute, useRouter } from 'vue-router'
import AppInput from '@/components/AppInput.vue'
import BaseModal from '@/components/BaseModal.vue'
import { useRoomStore } from '@/stores/room'

const emit = defineEmits<{ 'open-combined': [] }>()

const room = useRoomStore()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const newPlayerName = ref('')
const addingPlayer = ref(false)
const error = ref('')
const removingPinFor = ref('')
const confirmRemovePinFor = ref('')
const loggingOut = ref(false)

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

async function handleRemovePin() {
  const userId = confirmRemovePinFor.value
  confirmRemovePinFor.value = ''
  if (!userId) return
  removingPinFor.value = userId
  error.value = ''
  try {
    await room.removePin(userId)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    removingPinFor.value = ''
  }
}

async function handleLogout() {
  loggingOut.value = true
  error.value = ''
  try {
    await room.logoutUser()
    const roomId = route.params.id as string
    router.push(localePath(`/rooms/${roomId}/pick-user`, locale.value))
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="h-full p-2 overflow-y-auto flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-3xl font-heading font-bold text-accent">
        {{ t('room.navUsers') }}
      </h2>
      <button
        :disabled="loggingOut"
        class="px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors cursor-pointer font-heading font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleLogout"
      >
        {{ t('room.logout') }}
      </button>
    </div>

    <p v-if="room.room.description" class="text-primary/60 font-body text-sm mb-4 leading-relaxed">
      {{ room.room.description }}
    </p>

    <ul class="flex flex-col gap-2">
      <li
        v-for="user in room.users"
        :key="user.id"
        class="flex items-center justify-between px-4 rounded-lg"
        :class="user.id === room.currentUserId ? 'bg-accent/10 ring-1 ring-accent/30' : 'bg-bg/50'"
      >
        <span class="text-primary font-body text-xl pt-3 pb-1">{{ user.name }}</span>
        <div class="flex items-center gap-1.5">
          <VIcon v-if="user.hasPin" name="gi-padlock" class="text-secondary" scale="1" />
          <!-- Admin: remove another user's PIN -->
          <button
            v-if="room.isAdmin && user.hasPin && user.id !== room.currentUserId"
            :disabled="removingPinFor === user.id"
            class="text-xs font-heading font-bold text-red-500 bg-red-500/15 px-2 py-1 rounded hover:bg-red-500/25 transition-colors cursor-pointer disabled:opacity-50"
            :title="t('room.removePin')"
            @click="confirmRemovePinFor = user.id"
          >
            {{ t('room.removePin') }}
          </button>
          <span
            v-if="user.id === room.currentUserId"
            class="text-sm font-heading font-bold text-primary bg-primary/15 px-2 py-0.5 rounded"
          >
            {{ t('room.you') }}
          </span>
          <span
            v-if="user.role === 'admin'"
            class="text-sm font-heading font-bold text-accent bg-accent/15 px-2 py-0.5 rounded"
          >
            {{ t('room.admin') }}
          </span>
        </div>
      </li>
    </ul>

    <!-- Bottom actions -->
    <div class="mt-auto pt-4 flex flex-col gap-2">
      <!-- Add player form (admin only) -->
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <div v-if="room.isAdmin">
        <form class="flex gap-2" @submit.prevent="submitAddPlayer">
          <div class="flex-1">
            <AppInput v-model="newPlayerName" :placeholder="t('room.playerNamePlaceholder')" />
          </div>
          <button
            type="submit"
            :disabled="addingPlayer || !newPlayerName.trim()"
            class="bg-accent text-bg font-heading font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start"
          >
            {{ t('room.add') }}
          </button>
        </form>
      </div>
      <!-- Combined Calendar button -->
      <button
        class="w-full px-4 py-3 mb-15 text-lg lg:my-0 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors cursor-pointer font-heading font-bold"
        @click="emit('open-combined')"
      >
        {{ t('room.combinedCalendar') }}
      </button>
    </div>

    <BaseModal
      v-if="confirmRemovePinFor"
      :title="t('room.removePin')"
      :actions="[
        {
          label: t('room.durationCancel'),
          handler: () => (confirmRemovePinFor = ''),
          variant: 'secondary',
        },
        { label: t('room.removePin'), handler: handleRemovePin, variant: 'danger' },
      ]"
      @close="confirmRemovePinFor = ''"
    >
      <p class="text-primary/80 font-body">
        {{
          t('room.removePinConfirm', {
            name: room.users.find((u) => u.id === confirmRemovePinFor)?.name,
          })
        }}
      </p>
    </BaseModal>
  </div>
</template>
