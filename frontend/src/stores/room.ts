import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getRoom, updateRoom } from '@/services/rooms'
import {
  getUsersFromRoom,
  addUser as apiAddUser,
  setPin as apiSetPin,
  removePin as apiRemovePin,
  updateUser as apiUpdateUser,
} from '@/services/users'
import { selectUser as apiSelectUser, logoutUser as apiLogoutUser } from '@/services/auth'
import type { WeeklyAvailability, Override } from '@/utils/availability'
import { getTimeRange, formatDateKey } from '@/utils/availability'

export interface RoomUser {
  id: string
  name: string
  role: string
  hasPin: boolean
  weeklyAvailability: WeeklyAvailability
  overrides: Override[]
}

export interface Room {
  id: string
  name: string
  magicToken: string
  duration: { min: number; max: number }
  defaultAvailability: WeeklyAvailability
}

const emptyWeek: WeeklyAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
}

const emptyRoom: Room = {
  id: '',
  name: '',
  magicToken: '',
  duration: { min: 1, max: 4 },
  defaultAvailability: { ...emptyWeek },
}

export const useRoomStore = defineStore('room', () => {
  const room = ref<Room>({ ...emptyRoom })
  const users = ref<RoomUser[]>([])
  const currentUserId = ref('')

  const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value))
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const timeRange = computed(() => getTimeRange(room.value.defaultAvailability))

  async function fetchRoom() {
    const { room: fetched } = await getRoom(room.value.id)
    room.value.name = fetched.name
    room.value.magicToken = fetched.magicToken
    room.value.duration = { min: fetched.duration.min, max: fetched.duration.max }
    room.value.defaultAvailability = fetched.defaultAvailability as WeeklyAvailability
  }

  async function fetchUsers() {
    const rawUsers = await getUsersFromRoom(room.value.id)
    users.value = rawUsers.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      hasPin: u.hasPin,
      weeklyAvailability: (u.weeklyAvailability as WeeklyAvailability) ?? { ...emptyWeek },
      overrides: ((u.overrides as unknown as Override[]) ?? []).map((o) => ({
        ...o,
        date: typeof o.date === 'string' ? o.date : formatDateKey(new Date(o.date)),
      })),
    }))
  }

  async function addUser(name: string, role: 'admin' | 'user') {
    const user = await apiAddUser(room.value.id, {
      name,
      role,
      weeklyAvailability: { ...emptyWeek },
      overrides: [],
    })
    users.value.push({
      id: user._id,
      name: user.name,
      role: user.role,
      hasPin: user.hasPin,
      weeklyAvailability: { ...emptyWeek },
      overrides: [],
    })
    return user
  }

  async function selectUser(userId: string, pin?: string) {
    await apiSelectUser(room.value.id, userId, pin)
    currentUserId.value = userId
  }

  async function setPin(userId: string, pin: string) {
    await apiSetPin(room.value.id, userId, pin)
    const user = users.value.find((u) => u.id === userId)
    if (user) user.hasPin = true
  }

  async function removePin(userId: string) {
    await apiRemovePin(room.value.id, userId)
    const user = users.value.find((u) => u.id === userId)
    if (user) user.hasPin = false
  }

  async function logoutUser() {
    await apiLogoutUser(room.value.id)
    currentUserId.value = ''
  }

  async function saveDuration(min: number, max: number) {
    room.value.duration = { min, max }
    await updateRoom(room.value.id, {
      _id: room.value.id,
      duration: { min, max },
    })
  }

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  async function saveWeeklyAvailability(availability: WeeklyAvailability) {
    const user = currentUser.value
    if (!user) return
    user.weeklyAvailability = availability
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      await apiUpdateUser(room.value.id, user.id, { weeklyAvailability: availability })
    }, 600)
  }

  async function saveOverrides(overrides: Override[]) {
    const user = currentUser.value
    if (!user) return
    user.overrides = overrides
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      await apiUpdateUser(room.value.id, user.id, {
        overrides: overrides.map((o) => ({
          ...o,
          date: new Date(o.date),
        })),
      })
    }, 600)
  }

  async function resetAvailability() {
    const user = currentUser.value
    if (!user) return
    user.weeklyAvailability = { ...emptyWeek }
    user.overrides = []
    await apiUpdateUser(room.value.id, user.id, {
      weeklyAvailability: { ...emptyWeek },
      overrides: [],
    })
  }

  async function saveDefaultAvailability(availability: WeeklyAvailability) {
    room.value.defaultAvailability = availability
    await updateRoom(room.value.id, {
      _id: room.value.id,
      defaultAvailability: availability,
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
    timeRange,
    fetchRoom,
    fetchUsers,
    addUser,
    selectUser,
    setPin,
    removePin,
    logoutUser,
    saveDuration,
    saveWeeklyAvailability,
    saveOverrides,
    resetAvailability,
    saveDefaultAvailability,
    $reset,
  }
})
