import { api } from './client'

export async function addUsers(
  roomId: string,
  ...args: Parameters<ReturnType<typeof api.rooms>['users']['post']>
) {
  const { data, error } = await api.rooms({ id: roomId }).users.post(...args)
  if (error) throw error
  return data
}

export async function deleteUsers(
  roomId: string,
  ...args: Parameters<ReturnType<typeof api.rooms>['users']['delete']>
) {
  const { data, error } = await api.rooms({ id: roomId }).users.delete(...args)
  if (error) throw error
  return data
}

export async function getUsersFromRoom(roomId: string) {
  const { data, error } = await api.rooms({ id: roomId }).users.get()
  if (error) throw error
  return data.map((user) => ({
    id: user._id,
    name: user.name,
    role: user.role,
  }))
}
