<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { localePath } from '@/i18n'
import { getStoredRooms, forgetRoom, type StoredRoom } from '@/utils/storedRooms'

const { t, locale } = useI18n()
const router = useRouter()

const rooms = ref<StoredRoom[]>(getStoredRooms())

function quickJoin(r: StoredRoom) {
  router.push({
    path: localePath(`/rooms/${r.id}`, locale.value),
    query: { token: r.token },
  })
}

function forget(r: StoredRoom) {
  forgetRoom(r.id)
  rooms.value = getStoredRooms()
}
</script>

<template>
  <div v-if="rooms.length" class="flex flex-col gap-2">
    <h2 class="text-sm font-heading font-bold text-secondary uppercase tracking-wide px-1">
      {{ t('roomLogin.yourRooms') }}
    </h2>
    <div
      v-for="r in rooms"
      :key="r.id"
      class="flex items-center rounded-xl bg-secondary/20 shadow hover:shadow-lg transition-all duration-200"
    >
      <button
        @click="quickJoin(r)"
        class="flex-1 flex items-center gap-3 px-4 py-3 text-left cursor-pointer min-w-0"
      >
        <VIcon name="gi-dungeon-gate" class="text-primary shrink-0" scale="1.3" />
        <span class="font-heading font-bold text-primary truncate">{{ r.name }}</span>
      </button>
      <button
        @click="forget(r)"
        :aria-label="t('roomLogin.forgetRoom')"
        :title="t('roomLogin.forgetRoom')"
        class="px-4 py-3 text-secondary/40 hover:text-red-500 transition-colors cursor-pointer"
      >
        <VIcon name="fa-times" scale="1" />
      </button>
    </div>
  </div>
</template>
