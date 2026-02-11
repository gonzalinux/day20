<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppInput from '@/components/AppInput.vue'

const emit = defineEmits<{ save: [pin: string]; close: [] }>()
const { t } = useI18n()

const pin = ref('')
const saving = ref(false)
const error = ref('')

async function save() {
  if (pin.value.length !== 4) return
  emit('save', pin.value)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative rounded-2xl bg-bg shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 class="text-xl font-heading font-bold text-accent mb-2">
          {{ t('room.setPin') }}
        </h3>
        <p class="text-sm text-secondary/70 mb-6">{{ t('room.pinHint') }}</p>

        <form @submit.prevent="save">
          <AppInput
            v-model="pin"
            :placeholder="t('room.enterPin')"
            type="password"
            inputmode="numeric"
            maxlength="4"
            pattern="\d{4}"
          />

          <div class="flex gap-3 mt-6">
            <button
              type="button"
              class="flex-1 px-4 py-3 rounded-lg bg-secondary/20 text-primary font-heading font-bold hover:bg-secondary/30 transition-colors cursor-pointer"
              @click="emit('close')"
            >
              {{ t('room.durationCancel') }}
            </button>
            <button
              type="submit"
              :disabled="pin.length !== 4"
              class="flex-1 px-4 py-3 rounded-lg bg-accent text-bg font-heading font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ t('room.durationSave') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
