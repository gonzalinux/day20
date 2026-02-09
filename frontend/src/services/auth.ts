import { api } from './client'

export async function loginRoom(id: string, credentials: { password?: string; token?: string }) {
  const { data, error } = await api.rooms.login.post({ id, ...credentials })
  if (error) throw error
  return data
}

export async function selectUser(roomId: string, userId: string) {
  const { data, error } = await api.rooms({ id: roomId })['select-user'].post({ userId })
  if (error) throw error
  return data
}
