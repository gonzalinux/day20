import { api } from './client'

export async function submitFeedback(data: { message: string; name?: string; email?: string }) {
  const res = await api.feedback.post(data)
  if (res.error) throw res.error
  return res.data
}
