import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getRoom, updateRoom } from '@/services/rooms'
import { getUsersFromRoom, addUser as apiAddUser } from '@/services/users'
import { selectUser as apiSelectUser } from '@/services/auth'

export interface RoomUser {
  id: string
  name: string
  role: string
}

export interface Room {
  id: string
  name: string
  magicToken: string
  duration: { min: number; max: number }
}

const emptyRoom: Room = {
  id: '',
  name: '',
  magicToken: '',
  duration: { min: 1, max: 4 },
}

export const useRoomStore = defineStore('room', () => {
  const room = ref<Room>({ ...emptyRoom })
  const users = ref<RoomUser[]>([])
  const currentUserId = ref('')

  const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value))
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  async function fetchRoom() {
    const { room: fetched } = await getRoom(room.value.id)
    room.value.name = fetched.name
    room.value.magicToken = fetched.magicToken
    room.value.duration = { min: fetched.duration.min, max: fetched.duration.max }
  }

  async function fetchUsers() {
    users.value = await getUsersFromRoom(room.value.id)
  }

  async function addUser(name: string, role: 'admin' | 'user') {
    const emptyWeek = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }
    const user = await apiAddUser(room.value.id, {
      name,
      role,
      weeklyAvailability: emptyWeek,
      overrides: [],
    })
    users.value.push({ id: user._id, name: user.name, role: user.role })
    return user
  }

  async function selectUser(userId: string) {
    await apiSelectUser(room.value.id, userId)
    currentUserId.value = userId
  }

  async function saveDuration(min: number, max: number) {
    room.value.duration = { min, max }
    await updateRoom(room.value.id, {
      _id: room.value.id,
      duration: { min, max },
    })
  }

  function $reset() {
    room.value = { ...emptyRoom }
    users.value = []
    currentUserId.value = ''
  }

  return {
    room,
    users,
    currentUserId,
    currentUser,
    isAdmin,
    fetchRoom,
    fetchUsers,
    addUser,
    selectUser,
    saveDuration,
    $reset,
  }
})
