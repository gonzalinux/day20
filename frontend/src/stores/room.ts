import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { getRoom, updateRoom, deleteRoom as apiDeleteRoom } from '@/services/rooms'
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
import { detectTimezone, convertRoomWindowToLocal } from '@/utils/timezone'

export interface RoomUser {
  id: string
  name: string
  role: string
  hasPin: boolean
  pinSkipped: boolean
  weeklyAvailability: WeeklyAvailability
  overrides: Override[]
  timezone: string
}

export interface Room {
  id: string
  name: string
  description: string
  magicToken: string
  duration: { min: number; max: number }
  defaultAvailability: WeeklyAvailability
  timezone: string
}

function createEmptyWeek(): WeeklyAvailability {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  }
}

function createEmptyRoom(): Room {
  return {
    id: '',
    name: '',
    description: '',
    magicToken: '',
    duration: { min: 1, max: 4 },
    defaultAvailability: createEmptyWeek(),
    timezone: 'UTC',
  }
}

export const useRoomStore = defineStore('room', () => {
  const room = reactive<Room>(createEmptyRoom())
  const users = ref<RoomUser[]>([])
  const currentUserId = ref('')
  const browserTimezone = ref(detectTimezone())

  const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value))
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const timeRange = computed(() => getTimeRange(room.defaultAvailability))
  const localTimeWindow = computed(() =>
    convertRoomWindowToLocal(
      timeRange.value.startHour,
      timeRange.value.endHour,
      room.timezone,
      browserTimezone.value,
      new Date(),
    ),
  )

  function applyRoom(fetched: Omit<Room, 'id'>) {
    Object.assign(room, fetched)
  }

  async function fetchRoom() {
    const { room: fetched } = await getRoom(room.id)
    applyRoom(fetched)
  }

  async function fetchUsers() {
    const rawUsers = await getUsersFromRoom(room.id)
    users.value = rawUsers
  }

  async function addUser(name: string, role: 'admin' | 'user') {
    const tz = browserTimezone.value
    const user = await apiAddUser(room.id, {
      name,
      role,
      weeklyAvailability: createEmptyWeek(),
      overrides: [],
      timezone: tz,
    })
    users.value.push(user)
    return user
  }

  async function selectUser(userId: string, pin?: string) {
    await apiSelectUser(room.id, userId, pin)
    currentUserId.value = userId
  }

  async function setPin(userId: string, pin: string) {
    await apiSetPin(room.id, userId, pin)
    const user = users.value.find((u) => u.id === userId)
    if (user) {
      if (pin === '') {
        user.pinSkipped = true
        user.hasPin = false
      } else {
        user.hasPin = true
        user.pinSkipped = false
      }
    }
  }

  async function removePin(userId: string) {
    await apiRemovePin(room.id, userId)
    const user = users.value.find((u) => u.id === userId)
    if (user) user.hasPin = false
  }

  async function logoutUser() {
    await apiLogoutUser(room.id)
    currentUserId.value = ''
  }

  async function saveDuration(min: number, max: number) {
    room.duration = { min, max }
    await updateRoom(room.id, { id: room.id, duration: { min, max } })
  }

  let weeklyTimer: ReturnType<typeof setTimeout> | null = null
  let overrideTimer: ReturnType<typeof setTimeout> | null = null
  const saveError = ref(false)

  async function saveWeeklyAvailability(availability: WeeklyAvailability) {
    const user = currentUser.value
    if (!user) return
    const prev = user.weeklyAvailability
    user.weeklyAvailability = availability
    if (weeklyTimer) clearTimeout(weeklyTimer)
    weeklyTimer = setTimeout(async () => {
      try {
        await apiUpdateUser(room.id, user.id, { weeklyAvailability: availability })
      } catch {
        user.weeklyAvailability = prev
        saveError.value = true
      }
    }, 600)
  }

  async function saveOverrides(overrides: Override[]) {
    const user = currentUser.value
    if (!user) return
    const prev = user.overrides
    user.overrides = overrides
    if (overrideTimer) clearTimeout(overrideTimer)
    overrideTimer = setTimeout(async () => {
      try {
        await apiUpdateUser(room.id, user.id, { overrides })
      } catch {
        user.overrides = prev
        saveError.value = true
      }
    }, 600)
  }

  async function resetAvailability() {
    const user = currentUser.value
    if (!user) return
    user.weeklyAvailability = createEmptyWeek()
    user.overrides = []
    await apiUpdateUser(room.id, user.id, {
      weeklyAvailability: createEmptyWeek(),
      overrides: [],
    })
  }

  async function saveUserTimezone(tz: string) {
    const user = currentUser.value
    if (!user) return
    await apiUpdateUser(room.id, user.id, { timezone: tz })
    user.timezone = tz
    browserTimezone.value = tz
  }

  async function saveDefaultAvailability(availability: WeeklyAvailability) {
    room.defaultAvailability = availability
    await updateRoom(room.id, { id: room.id, defaultAvailability: availability })
  }

  async function deleteRoom() {
    await apiDeleteRoom(room.id)
  }

  function $reset() {
    Object.assign(room, createEmptyRoom())
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
    browserTimezone,
    localTimeWindow,
    applyRoom,
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
    saveError,
    resetAvailability,
    saveDefaultAvailability,
    saveUserTimezone,
    deleteRoom,
    $reset,
  }
})
