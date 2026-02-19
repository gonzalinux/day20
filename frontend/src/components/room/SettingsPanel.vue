<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { localePath } from '@/i18n'
import { useRoomStore } from '@/stores/room'
import { useToast } from '@/composables/useToast'
import type { WeeklyAvailability } from '@/utils/availability'
import SettingsRow from './SettingsRow.vue'
import DurationModal from './DurationModal.vue'
import PinModal from './PinModal.vue'
import DefaultAvailabilityModal from './DefaultAvailabilityModal.vue'
import TimezoneModal from './TimezoneModal.vue'
import BaseModal from '@/components/BaseModal.vue'

const room = useRoomStore()
const router = useRouter()
const { t, locale } = useI18n()
const toast = useToast()

const linkCopied = ref(false)
const showDeleteConfirm = ref(false)
const showDurationModal = ref(false)
const showPinModal = ref(false)
const showTimeWindowModal = ref(false)
const showResetConfirm = ref(false)
const showTimezoneModal = ref(false)
const pinSuccess = ref('')
const resetSuccess = ref('')
const tzSuccess = ref('')

async function saveDuration(min: number, max: number) {
  showDurationModal.value = false
  await room.saveDuration(min, max)
}

async function savePin(pin: string) {
  await room.setPin(room.currentUserId, pin)
  showPinModal.value = false
  pinSuccess.value = t('room.pinSet')
  setTimeout(() => (pinSuccess.value = ''), 2000)
}

async function confirmReset() {
  showResetConfirm.value = false
  await room.resetAvailability()
  resetSuccess.value = t('room.resetAvailabilityDone')
  setTimeout(() => (resetSuccess.value = ''), 2000)
}

async function saveTimezone(tz: string) {
  showTimezoneModal.value = false
  await room.saveUserTimezone(tz)
  tzSuccess.value = t('room.timezoneUpdated')
  setTimeout(() => (tzSuccess.value = ''), 2000)
}

async function handleSaveDefaultAvailability(availability: WeeklyAvailability) {
  showTimeWindowModal.value = false
  await room.saveDefaultAvailability(availability)
}

async function confirmDeleteRoom() {
  showDeleteConfirm.value = false
  await room.deleteRoom()
  room.$reset()
  router.push(localePath('/', locale.value))
}

async function copyShareLink() {
  const path = localePath(`/rooms/${room.room.id}`, locale.value)
  const url = new URL(path, window.location.origin)
  if (room.room.magicToken) url.searchParams.set('token', room.room.magicToken)

  try {
    await navigator.clipboard.writeText(url.toString())
    linkCopied.value = true
    setTimeout(() => (linkCopied.value = false), 2000)
  } catch {
    toast.show(t('room.clipboardError'), 'error')
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 p-2 overflow-y-auto">
      <h2 class="text-3xl font-heading font-bold text-accent mb-6">
        {{ t('room.navSettings') }}
      </h2>

      <div class="flex flex-col gap-4">
        <SettingsRow @click="showDurationModal = true">
          <template #label>{{ t('room.settingsDuration') }}</template>
          <template #subtitle
            >{{ room.room.duration.min }}{{ t('room.settingsDurationUnit') }} –
            {{ room.room.duration.max }}{{ t('room.settingsDurationUnit') }}</template
          >
          <VIcon name="gi-sands-of-time" class="text-secondary/50" scale="1.2" />
        </SettingsRow>

        <SettingsRow @click="showTimezoneModal = true">
          <template #label>{{ t('room.timezone') }}</template>
          <template #subtitle>{{
            tzSuccess || room.currentUser?.timezone || room.browserTimezone
          }}</template>
          <VIcon name="gi-world" class="text-secondary/50" scale="1.2" />
        </SettingsRow>

        <SettingsRow @click="showPinModal = true">
          <template #label>{{
            room.currentUser?.hasPin ? t('room.changePin') : t('room.setPin')
          }}</template>
          <template #subtitle>{{ pinSuccess || t('room.pinHint') }}</template>
          <VIcon name="gi-padlock" class="text-secondary/50" scale="1.2" />
        </SettingsRow>

        <SettingsRow @click="showResetConfirm = true">
          <template #label>{{ t('room.resetAvailability') }}</template>
          <template #subtitle>{{ resetSuccess || t('room.resetAvailabilityHint') }}</template>
          <VIcon name="gi-return-arrow" class="text-secondary/50" scale="1.2" />
        </SettingsRow>

        <SettingsRow v-if="room.isAdmin" @click="showTimeWindowModal = true">
          <template #label>{{ t('room.editTimeWindow') }}</template>
          <template #subtitle>{{ t('room.editTimeWindowHint') }}</template>
          <VIcon name="gi-calendar-half-year" class="text-secondary/50" scale="1.2" />
        </SettingsRow>

        <SettingsRow v-if="room.isAdmin" @click="showDeleteConfirm = true">
          <template #label
            ><span class="text-red-400">{{ t('room.deleteRoom') }}</span></template
          >
          <template #subtitle>{{ t('room.deleteRoomHint') }}</template>
          <VIcon name="gi-broken-skull" class="text-red-400/50" scale="1.2" />
        </SettingsRow>
      </div>
    </div>

    <!-- Copy share link (floating at bottom) -->
    <div class="shrink-0 px-4 pt-4 pb-20 lg:pb-4 border-t border-secondary/20">
      <button
        @click="copyShareLink"
        class="w-full h-21 flex items-center justify-between px-4 py-1 rounded-xl bg-accent/15 ring-1 ring-accent/30 hover:bg-accent/25 transition-colors cursor-pointer"
      >
        <div class="flex flex-col items-start justify-between h-full">
          <span class="text-lg font-heading font-bold text-accent">
            {{ t('room.settingsCopyLink') }}
          </span>
          <span class="text-md text-secondary/70 text-left leading-tight">
            {{ linkCopied ? t('room.settingsLinkCopied') + '\n' : t('room.settingsCopyLinkHint') }}
            <div v-if="linkCopied" class="md h-2 w-2"></div>
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

    <TimezoneModal
      v-if="showTimezoneModal"
      @save="saveTimezone"
      @close="showTimezoneModal = false"
    />

    <PinModal v-if="showPinModal" @save="savePin" @close="showPinModal = false" />

    <DefaultAvailabilityModal
      v-if="showTimeWindowModal"
      :default-availability="room.room.defaultAvailability"
      @save="handleSaveDefaultAvailability"
      @close="showTimeWindowModal = false"
    />

    <BaseModal
      v-if="showResetConfirm"
      :title="t('room.resetConfirmTitle')"
      :actions="[
        {
          label: t('room.durationCancel'),
          handler: () => (showResetConfirm = false),
          variant: 'secondary',
        },
        { label: t('room.resetConfirmButton'), handler: confirmReset, variant: 'danger' },
      ]"
      @close="showResetConfirm = false"
    >
      <p class="text-primary/80 font-body">{{ t('room.resetConfirmMessage') }}</p>
    </BaseModal>

    <BaseModal
      v-if="showDeleteConfirm"
      :title="t('room.deleteRoomConfirmTitle')"
      :actions="[
        {
          label: t('room.durationCancel'),
          handler: () => (showDeleteConfirm = false),
          variant: 'secondary',
        },
        { label: t('room.deleteRoomConfirmButton'), handler: confirmDeleteRoom, variant: 'danger' },
      ]"
      @close="showDeleteConfirm = false"
    >
      <p class="text-primary/80 font-body">{{ t('room.deleteRoomConfirmMessage') }}</p>
    </BaseModal>
  </div>
</template>
