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

const adminName = ref('')
const saving = ref(false)
const error = ref('')
const roomId = route.params.id as string

async function submitName() {
  saving.value = true
  error.value = ''
  try {
    const user = await room.addUser(adminName.value, 'admin')
    await room.selectUser(user._id)
    router.push(localePath(`/rooms/${roomId}/pin?next=add-players`, locale.value))
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
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
</template>
