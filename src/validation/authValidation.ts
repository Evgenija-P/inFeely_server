import { z } from 'zod'

export const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	name: z.string().min(1, 'Name is required')
})

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6, 'Password must be at least 6 characters')
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
