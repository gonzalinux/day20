<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute, useRouter } from 'vue-router'
import { getMe, loginRoom } from '@/services/auth'
import { useRoomStore } from '@/stores/room'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const room = useRoomStore()

const error = ref('')
const roomId = route.params.id as string

function roomPath(sub: string) {
  return localePath(`/rooms/${roomId}/${sub}`, locale.value)
}

onMounted(async () => {
  try {
    const me = await getMe(roomId).catch(() => null)
    if (me) {
      if (me.userId) {
        room.currentUserId = me.userId
        await Promise.all([room.fetchRoom(), room.fetchUsers()])
        if (route.query.token) router.replace({ query: {} })
        router.replace(roomPath('calendar'))
        return
      }
      await Promise.all([room.fetchRoom(), room.fetchUsers()])
      if (route.query.token) router.replace({ query: {} })

      if (room.users.length !== 0) {
        router.replace(roomPath('pick-user'))
        return
      }
    }
  } catch {
    // No valid session — fall through to login
  }

  const token = route.query.token as string | undefined
  if (!token) {
    router.replace(localePath('/room-login?mode=join&name=' + roomId, locale.value))
    return
  }

  try {
    const result = await loginRoom(roomId, { token })
    room.room.name = result.room.name
    await room.fetchUsers()

    if (room.users.length === 0) {
      router.replace(roomPath('name'))
    } else {
      router.replace(roomPath('pick-user'))
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e)
  }
})
</script>

<template>
  <div class="text-center">
    <p v-if="!error" class="text-xl text-secondary animate-pulse">
      {{ t('room.loggingIn') }}
    </p>
    <p v-else class="text-red-500">{{ error }}</p>
  </div>
</template>
