import { IUser, User } from '../models/User'
import { signJwt } from '../utils/jwt'
import { comparePassword, hashPassword } from '../utils/password'

import appleSigninAuth from 'apple-signin-auth'
import { Request, Response } from 'express'
import { OAuth2Client } from 'google-auth-library'
import { Types } from 'mongoose'

const googleClientId = process.env.GOOGLE_CLIENT_ID as string
const googleClient = new OAuth2Client(googleClientId)

// коректне приведення _id
const buildAuthResponse = (user: IUser) => {
	const id = user._id instanceof Types.ObjectId ? user._id.toString() : String(user._id)
	const token = signJwt({ _id: id, email: user.email })
	return {
		token,
		user: {
			_id: id,
			email: user.email,
			name: user.name,
			avatarUrl: user.avatarUrl,
			goal: user.goal,
			period: user.period,
			authProviders: user.authProviders,
			isFirstRender: user.isFirstRender,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		}
	}
}

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
	try {
		const { email, password, name, goal, period, isFirstRender } = req.body as {
			email: string
			password: string
			name: string
			goal: string
			period: [number, number]
			isFirstRender: boolean
		}

		if (!email || !password || !name || !goal || !period || period.length !== 2) {
			return res.status(400).json({
				message:
					'All fields (email, password, name, goal, period) are required with 2 period values'
			})
		}

		const existing = await User.findOne({ email: email.toLowerCase() })
		if (existing) return res.status(409).json({ message: 'Email already in use' })

		const passwordHash = await hashPassword(password)

		const user = await User.create({
			email: email.toLowerCase(),
			passwordHash,
			name,
			goal,
			period,
			authProviders: ['password'],
			isFirstRender: isFirstRender ?? true
		})

		return res.status(201).json(buildAuthResponse(user))
	} catch (e: any) {
		return res.status(500).json({ message: e.message || 'Register error' })
	}
}

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body as { email: string; password: string }
		const user = await User.findOne({ email: email.toLowerCase() })
		if (!user || !user.passwordHash)
			return res.status(401).json({ message: 'Invalid credentials' })

		const ok = await comparePassword(password, user.passwordHash)
		if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

		return res.status(200).json(buildAuthResponse(user))
	} catch (e: any) {
		return res.status(500).json({ message: e.message || 'Login error' })
	}
}

// POST /api/auth/oauth/google
export const oauthGoogle = async (req: Request, res: Response) => {
	try {
		const { idToken } = req.body as { idToken: string }
		if (!idToken) return res.status(400).json({ message: 'idToken is required' })

		const ticket = await googleClient.verifyIdToken({ idToken, audience: googleClientId })
		const payload = ticket.getPayload()
		if (!payload || !payload.email || !payload.email_verified)
			return res.status(401).json({ message: 'Google token not verified' })

		const email = payload.email.toLowerCase()
		let user = await User.findOne({ email })

		if (user) {
			if (!user.googleId) user.googleId = payload.sub || null
			if (!user.authProviders.includes('google')) user.authProviders.push('google')
			if (!user.name && payload.name) user.name = payload.name
			if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture
			await user.save()
		} else {
			user = await User.create({
				email,
				googleId: payload.sub || null,
				name: payload.name,
				avatarUrl: payload.picture,
				authProviders: ['google']
			})
		}

		return res.json(buildAuthResponse(user))
	} catch (e: any) {
		return res.status(401).json({ message: e.message || 'Google auth failed' })
	}
}

// POST /api/auth/oauth/apple
export const oauthApple = async (req: Request, res: Response) => {
	try {
		const { identityToken } = req.body as { identityToken: string }
		if (!identityToken) return res.status(400).json({ message: 'identityToken is required' })

		const decoded = await appleSigninAuth.verifyIdToken(identityToken, {
			audience: process.env.APPLE_CLIENT_ID as string,
			ignoreExpiration: false
		})

		const email = (decoded.email || '').toLowerCase()
		const appleSub = decoded.sub
		if (!appleSub) return res.status(401).json({ message: 'Invalid Apple token' })

		let user: IUser | null = null

		if (email) {
			user = await User.findOne({ email })
			if (user) {
				if (!user.appleId) user.appleId = appleSub
				if (!user.authProviders.includes('apple')) user.authProviders.push('apple')
				await user.save()
			} else {
				user = await User.create({
					email,
					appleId: appleSub,
					authProviders: ['apple']
				})
			}
		} else {
			user = await User.findOne({ appleId: appleSub })
			if (!user) {
				return res
					.status(400)
					.json({ message: 'Email not provided by Apple. Link flow required.' })
			}
		}

		return res.json(buildAuthResponse(user))
	} catch (e: any) {
		return res.status(401).json({ message: e.message || 'Apple auth failed' })
	}
}

// GET /api/auth/me
export const me = async (req: Request, res: Response) => {
	try {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
		const user = await User.findById(req.user._id).select(
			'_id email name avatarUrl authProviders createdAt'
		)
		if (!user) return res.status(404).json({ message: 'User not found' })
		return res.json({ user })
	} catch (e: any) {
		return res.status(500).json({ message: e.message || 'Me error' })
	}
}

// POST /api/auth/logout
export const logout = async (_req: Request, res: Response) => {
	return res.json({ success: true })
}
