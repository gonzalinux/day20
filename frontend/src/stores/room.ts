import { ref, computed } from 'vue'
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
    magicToken: '',
    duration: { min: 1, max: 4 },
    defaultAvailability: createEmptyWeek(),
    timezone: 'UTC',
  }
}

export const useRoomStore = defineStore('room', () => {
  const room = ref<Room>(createEmptyRoom())
  const users = ref<RoomUser[]>([])
  const currentUserId = ref('')
  const browserTimezone = ref(detectTimezone())

  const currentUser = computed(() => users.value.find((u) => u.id === currentUserId.value))
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const timeRange = computed(() => getTimeRange(room.value.defaultAvailability))
  const localTimeWindow = computed(() =>
    convertRoomWindowToLocal(
      timeRange.value.startHour,
      timeRange.value.endHour,
      room.value.timezone,
      browserTimezone.value,
      new Date(),
    ),
  )

  async function fetchRoom() {
    const { room: fetched } = await getRoom(room.value.id)
    room.value.name = fetched.name
    room.value.magicToken = fetched.magicToken
    room.value.duration = { min: fetched.duration.min, max: fetched.duration.max }
    room.value.defaultAvailability = fetched.defaultAvailability as WeeklyAvailability
    room.value.timezone = fetched.timezone
  }

  async function fetchUsers() {
    const rawUsers = await getUsersFromRoom(room.value.id)

    users.value = rawUsers
  }

  async function addUser(name: string, role: 'admin' | 'user') {
    const tz = browserTimezone.value
    const user = await apiAddUser(room.value.id, {
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
    await apiSelectUser(room.value.id, userId, pin)
    currentUserId.value = userId
  }

  async function setPin(userId: string, pin: string) {
    await apiSetPin(room.value.id, userId, pin)
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
      id: room.value.id,
      duration: { min, max },
    })
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
        await apiUpdateUser(room.value.id, user.id, { weeklyAvailability: availability })
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
        await apiUpdateUser(room.value.id, user.id, { overrides })
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
    await apiUpdateUser(room.value.id, user.id, {
      weeklyAvailability: createEmptyWeek(),
      overrides: [],
    })
  }

  async function saveUserTimezone(tz: string) {
    const user = currentUser.value
    if (!user) return
    await apiUpdateUser(room.value.id, user.id, { timezone: tz })
    user.timezone = tz
    browserTimezone.value = tz
  }

  async function saveDefaultAvailability(availability: WeeklyAvailability) {
    room.value.defaultAvailability = availability
    await updateRoom(room.value.id, {
      id: room.value.id,
      defaultAvailability: availability,
    })
  }

  async function deleteRoom() {
    await apiDeleteRoom(room.value.id)
  }

  function $reset() {
    room.value = createEmptyRoom()
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
