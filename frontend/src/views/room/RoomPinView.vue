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

const pinValue = ref('')
const settingPin = ref(false)
const error = ref('')
const roomId = route.params.id as string
const next = (route.query.next as string) || 'calendar'

async function submitSetPin(pin: string) {
  settingPin.value = true
  error.value = ''
  try {
    await room.setPin(room.currentUserId, pin)
    router.push(localePath(`/rooms/${roomId}/${next}`, locale.value))
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
    pinValue.value = ''
  } finally {
    settingPin.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="rounded-2xl bg-secondary/20 shadow-lg p-8">
      <h2 class="text-2xl font-heading font-bold text-accent mb-2 text-center">
        {{ t('room.setPin') }}
      </h2>
      <p class="text-sm text-secondary/70 mb-6 text-center">{{ t('room.pinHint') }}</p>

      <PinPad
        :canSkip="room.currentUser?.role !== 'admin'"
        v-model="pinValue"
        @complete="submitSetPin"
      />
      <p v-if="error" class="text-red-500 text-sm text-center mt-4">{{ error }}</p>
    </div>
  </div>
</template>
