export interface Feedback {
  id: string
  message: string
  name?: string
  email?: string
  createdAt: Date
  read: boolean
}
