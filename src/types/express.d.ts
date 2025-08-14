import 'express'
import 'express-serve-static-core'

declare module 'express-serve-static-core' {
	interface Request {
		user?: { _id: string; email: string }
		file?: Express.Multer.File
		files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
	}
}
