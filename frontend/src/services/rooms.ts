import { api, throwError } from './client'

export async function createRoom(...args: Parameters<typeof api.rooms.post>) {
  const { data, error } = await api.rooms.post(...args)
  if (error) throwError(error)
  return data
}

export async function roomExists(id: string) {
  const { data, error } = await api.rooms({ room_id: id }).exists.get()
  if (error) throwError(error)
  return data.exists
}

export async function getRoom(id: string) {
  const { data, error } = await api.rooms({ room_id: id }).get()
  if (error) throwError(error)
  return data
}

export async function deleteRoom(id: string) {
  const { data, error } = await api.rooms({ room_id: id }).delete()
  if (error) throwError(error)
  return data
}

export async function updateRoom(
  id: string,
  ...args: Parameters<ReturnType<typeof api.rooms>['patch']>
) {
  const { data, error } = await api.rooms({ room_id: id }).patch(...args)
  if (error) throwError(error)
  return data
}
