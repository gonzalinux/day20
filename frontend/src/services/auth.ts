import { api } from './client'

export async function loginRoom(id: string, credentials: { password?: string; token?: string }) {
  const { data, error } = await api.rooms.login.post({ id, ...credentials })
  if (error) throw error
  return data
}

export async function getMe(roomId: string) {
  const { data, error } = await api.rooms({ room_id: roomId }).me.get()
  if (error) throw error
  return data
}

export async function selectUser(roomId: string, userId: string) {
  const { data, error } = await api.rooms({ room_id: roomId })['select-user'].post({ userId })
  if (error) throw error
  return data
}
