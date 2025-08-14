import { verifyJwt } from '../utils/jwt'

import { NextFunction, Request, Response } from 'express'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
	try {
		const header = req.headers.authorization // "Bearer <token>"
		const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : undefined
		if (!token) return res.status(401).json({ message: 'Unauthorized' })

		const payload = verifyJwt(token)
		req.user = { _id: payload._id, email: payload.email }
		next()
	} catch (e) {
		return res.status(401).json({ message: 'Invalid token' })
	}
}
