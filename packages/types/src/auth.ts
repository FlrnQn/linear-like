import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(255),
})
export type SignupInput = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginSchema>

export interface PublicUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

export interface AuthResponse {
  user: PublicUser
  accessToken: string
}
