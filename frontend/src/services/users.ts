import { api } from './client'

export async function addUser(
  roomId: string,
  ...args: Parameters<ReturnType<typeof api.rooms>['users']['post']>
) {
  const { data, error } = await api.rooms({ room_id: roomId }).users.post(...args)
  if (error) throw error
  return data
}

export async function deleteUsers(
  roomId: string,
  ...args: Parameters<ReturnType<typeof api.rooms>['users']['delete']>
) {
  const { data, error } = await api.rooms({ room_id: roomId }).users.delete(...args)
  if (error) throw error
  return data
}

export async function getUsersFromRoom(roomId: string) {
  const { data, error } = await api.rooms({ room_id: roomId }).users.get()
  if (error) throw error
  return data
}

export async function setPin(roomId: string, userId: string, pin: string) {
  const { data, error } = await api
    .rooms({ room_id: roomId })
    .users({ user_id: userId })
    .pin.put({ pin })
  if (error) throw error
  return data
}

export async function removePin(roomId: string, userId: string) {
  const { data, error } = await api
    .rooms({ room_id: roomId })
    .users({ user_id: userId })
    .pin.delete()
  if (error) throw error
  return data
}

export async function updateUser(
  roomId: string,
  userId: string,
  body: Parameters<ReturnType<ReturnType<typeof api.rooms>['users']>['patch']>[0],
) {
  const { data, error } = await api
    .rooms({ room_id: roomId })
    .users({ user_id: userId })
    .patch(body)
  if (error) throw error
  return data
}
