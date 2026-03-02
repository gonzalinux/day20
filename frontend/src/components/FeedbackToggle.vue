<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FeedbackModal from './FeedbackModal.vue'
const { t } = useI18n()
const show = ref(false)
</script>

<template>
  <button
    :title="t('feedback.buttonLabel')"
    class="text-primary hover:opacity-70 transition-opacity cursor-pointer rounded-full border-2 size-8"
    @click="show = true"
  >
    <VIcon class="size-7 p-0 m-0" name="gi-chat-bubble" scale="1.5" />
  </button>
  <FeedbackModal v-if="show" @close="show = false" />
</template>
