export interface StoredRoom {
  id: string
  name: string
  token: string
  userId?: string
  lastJoined: number
}

const KEY = 'day20:rooms'

function read(): StoredRoom[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is StoredRoom =>
        !!r && typeof r.id === 'string' && typeof r.token === 'string' && r.token.length > 0,
    )
  } catch {
    return []
  }
}

function write(rooms: StoredRoom[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rooms))
  } catch {
    // storage unavailable or full — quick-join is a convenience, so ignore
  }
}

export function getStoredRooms(): StoredRoom[] {
  return read().sort((a, b) => b.lastJoined - a.lastJoined)
}

export function rememberRoom(entry: { id: string; name?: string; token?: string; userId?: string }) {
  if (!entry.id) return
  const rooms = read()
  const existing = rooms.find((r) => r.id === entry.id)
  const token = entry.token || existing?.token
  if (!token) return
  const merged: StoredRoom = {
    id: entry.id,
    name: entry.name || existing?.name || entry.id,
    token,
    userId: entry.userId ?? existing?.userId,
    lastJoined: Date.now(),
  }
  write([merged, ...rooms.filter((r) => r.id !== entry.id)])
}

export function setStoredRoomUser(id: string, userId: string) {
  const rooms = read()
  const existing = rooms.find((r) => r.id === id)
  if (!existing) return
  existing.userId = userId
  existing.lastJoined = Date.now()
  write(rooms)
}

export function clearStoredRoomUser(id: string) {
  const rooms = read()
  const existing = rooms.find((r) => r.id === id)
  if (!existing || existing.userId === undefined) return
  delete existing.userId
  write(rooms)
}

export function forgetRoom(id: string) {
  write(read().filter((r) => r.id !== id))
}
