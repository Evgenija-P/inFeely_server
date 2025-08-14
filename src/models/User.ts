import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IUser extends Document {
	email: string
	passwordHash?: string
	googleId?: string | null
	appleId?: string | null
	name: string // тепер обов’язкове
	goal: string // додаємо
	period: [number, number] // додаємо, масив з двох чисел
	avatarUrl?: string
	authProviders: Array<'password' | 'google' | 'apple'>
	isFirstRender: boolean
	createdAt: Date
	updatedAt: Date
}

const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
			lowercase: true,
			trim: true
		},
		passwordHash: { type: String },
		googleId: { type: String, default: null },
		appleId: { type: String, default: null },
		name: { type: String, required: true },
		goal: { type: String, required: true },
		period: {
			type: [Number],
			required: true,
			validate: [(val: number[]) => val.length === 2, 'Period must have 2 numbers']
		},
		avatarUrl: { type: String },
		authProviders: {
			type: [String],
			enum: ['password', 'google', 'apple'],
			default: ['password']
		},
		isFirstRender: { type: Boolean, default: true, required: true }
	},
	{ timestamps: true }
)

userSchema.index({ email: 1 }, { unique: true })

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)
