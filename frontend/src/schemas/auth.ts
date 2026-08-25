import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

const passwordSchema = z
  .string()
  .min(6, 'Au moins 6 caractères')
  .regex(/[A-Z]/, 'Une majuscule requise')
  .regex(/[a-z]/, 'Une minuscule requise')
  .regex(/[0-9]/, 'Un chiffre requis')

export const registerSchema = z
  .object({
    email: z.string().email('Email invalide'),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine(d => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
