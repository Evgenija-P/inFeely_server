import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IDailySummary extends Document {
	userId: string
	date: string
	dailyValues: {
		breakfast: number
		lunch: number
		dinner: number
	}
	updatedAt: Date
}

const dailySummarySchema = new Schema<IDailySummary>(
	{
		userId: { type: String, required: true, index: true },
		date: { type: String, required: true },
		dailyValues: {
			breakfast: { type: Number, default: 0 },
			lunch: { type: Number, default: 0 },
			dinner: { type: Number, default: 0 }
		},
		updatedAt: { type: Date, default: Date.now }
	},
	{ timestamps: true }
)

export const DailySummary: Model<IDailySummary> = mongoose.model<IDailySummary>(
	'DailySummary',
	dailySummarySchema
)
