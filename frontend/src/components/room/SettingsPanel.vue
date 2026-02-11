<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoomStore } from '@/stores/room'
import ThemeToggle from '@/components/ThemeToggle.vue'
import LangToggle from '@/components/LangToggle.vue'
import SettingsRow from './SettingsRow.vue'
import DurationModal from './DurationModal.vue'

const room = useRoomStore()
const { t, locale } = useI18n()

const themeToggle = ref<InstanceType<typeof ThemeToggle>>()
const langToggle = ref<InstanceType<typeof LangToggle>>()

const linkCopied = ref(false)
const showDurationModal = ref(false)

async function saveDuration(min: number, max: number) {
  showDurationModal.value = false
  await room.saveDuration(min, max)
}

function copyShareLink() {
  const path = localePath(`/rooms/${room.room.id}`, locale.value)
  const url = new URL(path, window.location.origin)
  if (room.room.magicToken) url.searchParams.set('token', room.room.magicToken)

  navigator.clipboard.writeText(url.toString())
  linkCopied.value = true
  setTimeout(() => (linkCopied.value = false), 2000)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 p-4 overflow-y-auto">
      <h2 class="text-2xl font-heading font-bold text-accent mb-6">
        {{ t('room.navSettings') }}
      </h2>

      <div class="flex flex-col gap-4">
        <SettingsRow @click="themeToggle?.toggle()">
          <template #label>{{ t('room.settingsTheme') }}</template>
          <ThemeToggle ref="themeToggle" />
        </SettingsRow>

        <SettingsRow @click="langToggle?.toggle()">
          <template #label>{{ t('room.settingsLang') }}</template>
          <LangToggle ref="langToggle" />
        </SettingsRow>

        <SettingsRow @click="showDurationModal = true">
          <template #label>{{ t('room.settingsDuration') }}</template>
          <template #subtitle>{{ room.room.duration.min }}{{ t('room.settingsDurationUnit') }} – {{ room.room.duration.max }}{{ t('room.settingsDurationUnit') }}</template>
        </SettingsRow>
      </div>
    </div>

    <!-- Copy share link (floating at bottom) -->
    <div class="shrink-0 px-4 pt-4 pb-20 lg:pb-4 border-t border-secondary/20">
      <button
        @click="copyShareLink"
        class="w-full flex items-center justify-between px-5 py-4 rounded-xl bg-accent/15 ring-1 ring-accent/30 hover:bg-accent/25 transition-colors cursor-pointer"
      >
        <div class="flex flex-col items-start">
          <span class="text-lg font-heading font-bold text-accent">
            {{ t('room.settingsCopyLink') }}
          </span>
          <span class="text-sm text-secondary/70">
            {{ linkCopied ? t('room.settingsLinkCopied') : t('room.settingsCopyLinkHint') }}
          </span>
        </div>
        <VIcon
          :name="linkCopied ? 'gi-check-mark' : 'gi-linked-rings'"
          :class="linkCopied ? 'text-green-400' : 'text-accent'"
          class="shrink-0"
          scale="1.5"
        />
      </button>
    </div>

    <DurationModal
      v-if="showDurationModal"
      :min="room.room.duration.min"
      :max="room.room.duration.max"
      @save="saveDuration"
      @close="showDurationModal = false"
    />
  </div>
</template>
