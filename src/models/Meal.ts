import mongoose, { Document, Schema } from 'mongoose'

export interface IMeal extends Document {
	label: 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'drink'
	description?: string
	date: string // YYYY-MM-DD
	dateTime: Date
	images: string[]
	place?: string
	eatWith?: string
	hungryLevel?: number
	motivation?: string[]
	feelingLevelBefore?: number
	feelingLevelAfter?: number
	noteBefore?: string
	noteAfter?: string
	tasteLevel?: number
	fullLevel?: number
	satisfactionLevel: 'Mostly body' | 'Mostly mind' | 'Both' | 'Neither'
	timeForEating?: number
	userId: mongoose.Types.ObjectId
}

const mealSchema = new Schema<IMeal>({
	label: {
		type: String,
		enum: ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'drink'],
		required: true
	},
	description: String,
	date: { type: String, required: true }, // формат YYYY-MM-DD
	dateTime: { type: Date, required: true },
	images: [String],
	place: String,
	eatWith: String,
	hungryLevel: Number,
	motivation: [String],
	feelingLevelBefore: Number,
	feelingLevelAfter: Number,
	noteBefore: String,
	noteAfter: String,
	tasteLevel: Number,
	fullLevel: Number,
	satisfactionLevel: {
		type: String,
		enum: ['Mostly body', 'Mostly mind', 'Both', 'Neither'],
		required: true
	},
	timeForEating: Number,
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
})

// Обмеження — лише один breakfast/lunch/dinner на день
mealSchema.pre('save', async function (next) {
	const meal = this as IMeal
	if (['breakfast', 'lunch', 'dinner'].includes(meal.label)) {
		const exists = await mongoose.models.Meal.findOne({
			userId: meal.userId,
			date: meal.date,
			label: meal.label
		})
		if (exists) {
			return next(new Error(`You already have a ${meal.label} for this day.`))
		}
	}
	next()
})

export default mongoose.model<IMeal>('Meal', mealSchema)
