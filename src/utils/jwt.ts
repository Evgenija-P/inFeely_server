import dotenv from 'dotenv'
import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { StringValue } from 'ms'

dotenv.config()

// якщо тип є

const JWT_SECRET: Secret = process.env.JWT_SECRET!
const JWT_EXPIRES = (process.env.JWT_EXPIRES || '30d') as StringValue

export interface JwtPayload {
	_id: string
	email: string
}

export const signJwt = (payload: JwtPayload) => {
	const options: SignOptions = { expiresIn: JWT_EXPIRES }
	return jwt.sign(payload, JWT_SECRET, options)
}

export const verifyJwt = (token: string): JwtPayload => {
	return jwt.verify(token, JWT_SECRET) as JwtPayload
}
