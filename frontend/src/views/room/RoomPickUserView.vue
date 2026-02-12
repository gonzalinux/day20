<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute, useRouter } from 'vue-router'
import PinPad from '@/components/PinPad.vue'
import { useRoomStore } from '@/stores/room'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const room = useRoomStore()

const selectingUser = ref(false)
const pickPinUserId = ref('')
const pickPinValue = ref('')
const error = ref('')
const roomId = route.params.id as string

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
    const user = room.users.find((u) => u.id === userId)
    if (user?.hasPin) {
      router.push(localePath(`/rooms/${roomId}/calendar`, locale.value))
    } else {
      router.push(localePath(`/rooms/${roomId}/pin?next=calendar`, locale.value))
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
    pickPinValue.value = ''
  } finally {
    selectingUser.value = false
  }
}

function submitPickPin() {
  pickUserAndContinue(pickPinUserId.value, pickPinValue.value)
}
</script>

<template>
  <div class="w-full max-w-md">
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

          <div v-if="pickPinUserId === user.id" class="mt-3 mb-1">
            <PinPad v-model="pickPinValue" @complete="submitPickPin" />
            <p v-if="error" class="text-red-500 text-sm text-center mt-2">{{ error }}</p>
          </div>
        </li>
      </ul>
      <p v-if="error && !pickPinUserId" class="text-red-500 text-sm mt-4">{{ error }}</p>
    </div>
  </div>
</template>
