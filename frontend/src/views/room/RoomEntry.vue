<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { localePath } from '@/i18n'
import { useRoute, useRouter } from 'vue-router'
import { getMe, loginRoom } from '@/services/auth'
import { useRoomStore } from '@/stores/room'
import { getStoredRooms, rememberRoom } from '@/utils/storedRooms'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const room = useRoomStore()

const error = ref('')
const roomId = route.params.id as string

function roomPath(sub: string) {
  return localePath(`/rooms/${roomId}/${sub}`, locale.value)
}

function persist(userId?: string) {
  rememberRoom({
    id: roomId,
    name: room.room.name || roomId,
    token: (route.query.token as string | undefined) || room.room.magicToken,
    userId,
  })
}

async function pickUserOrResume() {
  const remembered = getStoredRooms().find((r) => r.id === roomId)?.userId
  const user = remembered ? room.users.find((u) => u.id === remembered) : undefined
  if (user && !user.hasPin) {
    try {
      await room.selectUser(user.id)
      persist(user.id)
      router.replace(user.pinSkipped ? roomPath('calendar') : roomPath('pin?next=calendar'))
      return
    } catch {
      // fall through to manual pick
    }
  }
  router.replace(roomPath('pick-user'))
}

onMounted(async () => {
  try {
    const me = await getMe(roomId).catch(() => null)
    if (me) {
      if (me.userId) {
        room.currentUserId = me.userId
        await Promise.all([room.fetchRoom(), room.fetchUsers()])
        if (route.query.token) router.replace({ query: {} })
        persist(me.userId)
        router.replace(roomPath('calendar'))
        return
      }
      await Promise.all([room.fetchRoom(), room.fetchUsers()])
      if (route.query.token) router.replace({ query: {} })

      if (room.users.length !== 0) {
        persist()
        await pickUserOrResume()
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
    room.applyRoom(result.room)
    await room.fetchUsers()

    if (room.users.length === 0) {
      persist()
      router.replace(roomPath('name'))
    } else {
      persist()
      await pickUserOrResume()
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
