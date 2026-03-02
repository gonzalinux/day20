<script setup lang="ts">
import { submitFeedback } from '@/services/feedback'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from './BaseModal.vue'

const { t } = useI18n()
const emit = defineEmits<{ close: [] }>()

const message = ref('')
const name = ref('')
const email = ref('')
const submitting = ref(false)
const success = ref(false)
const error = ref('')

const canSubmit = computed(() => message.value.length >= 10 && !submitting.value)

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  try {
    await submitFeedback({
      message: message.value,
      name: name.value || undefined,
      email: email.value || undefined,
    })
    success.value = true
    setTimeout(() => emit('close'), 2000)
  } catch {
    error.value = t('feedback.error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal :title="t('feedback.title')" @close="emit('close')">
    <div v-if="success" class="text-accent font-heading font-bold text-center py-4">
      {{ t('feedback.success') }}
    </div>
    <div v-else class="flex flex-col gap-3">
      <div>
        <label class="block text-sm text-secondary mb-1">{{ t('feedback.message') }}</label>
        <textarea
          v-model="message"
          :placeholder="t('feedback.messagePlaceholder')"
          rows="4"
          class="w-full rounded-lg bg-secondary/10 border border-secondary/20 px-3 py-2 text-primary placeholder-secondary/50 text-sm resize-none focus:outline-none focus:border-accent"
        />
        <div class="flex justify-between mt-1">
          <span class="text-xs text-secondary/60">{{ t('feedback.messageHint') }}</span>
          <span class="text-xs" :class="message.length >= 10 ? 'text-accent' : 'text-secondary/60'">
            {{ message.length }}
          </span>
        </div>
      </div>
      <div>
        <label class="block text-sm text-secondary mb-1">{{ t('feedback.name') }}</label>
        <input
          v-model="name"
          type="text"
          :placeholder="t('feedback.namePlaceholder')"
          class="w-full rounded-lg bg-secondary/10 border border-secondary/20 px-3 py-2 text-primary placeholder-secondary/50 text-sm focus:outline-none focus:border-accent"
        />
      </div>
      <div>
        <label class="block text-sm text-secondary mb-1">{{ t('feedback.email') }}</label>
        <input
          v-model="email"
          type="email"
          :placeholder="t('feedback.emailPlaceholder')"
          class="w-full rounded-lg bg-secondary/10 border border-secondary/20 px-3 py-2 text-primary placeholder-secondary/50 text-sm focus:outline-none focus:border-accent"
        />
      </div>
      <div v-if="error" class="text-red-400 text-sm">{{ error }}</div>
      <button
        :disabled="!canSubmit"
        class="w-full py-2 rounded-lg font-heading font-bold transition-all mt-1"
        :class="
          canSubmit
            ? 'bg-accent text-bg hover:opacity-90 cursor-pointer'
            : 'bg-secondary/20 text-secondary/40 cursor-not-allowed'
        "
        @click="submit"
      >
        {{ submitting ? t('feedback.submitting') : t('feedback.submit') }}
      </button>
    </div>
  </BaseModal>
</template>
