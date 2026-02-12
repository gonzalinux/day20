<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PinPad from '@/components/PinPad.vue'

const emit = defineEmits<{ save: [pin: string]; close: [] }>()
const { t } = useI18n()

const pin = ref('')

function onComplete(value: string) {
  emit('save', value)
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center" @click.self="emit('close')">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative rounded-2xl bg-bg shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 class="text-xl font-heading font-bold text-accent mb-2 text-center">
          {{ t('room.setPin') }}
        </h3>
        <p class="text-sm text-secondary/70 mb-6 text-center">{{ t('room.pinHint') }}</p>

        <PinPad v-model="pin" @complete="onComplete" />

        <button
          type="button"
          class="w-full mt-6 px-4 py-3 rounded-lg bg-secondary/20 text-primary font-heading font-bold hover:bg-secondary/30 transition-colors cursor-pointer"
          @click="emit('close')"
        >
          {{ t('room.durationCancel') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
