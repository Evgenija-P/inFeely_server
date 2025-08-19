import { DailySummary } from '../models/DailySummary'
import Meal from '../models/Meal'

export const updateDailySummary = async (userId: string, date: string) => {
	const meals = await Meal.find({ userId, date })
	const dailyValues: Record<'breakfast' | 'lunch' | 'dinner', number> = {
		breakfast: 0,
		lunch: 0,
		dinner: 0
	}

	for (const label of ['breakfast', 'lunch', 'dinner'] as const) {
		const meal = meals.find(m => m.label === label)
		if (meal) {
			const hungry = typeof meal.hungryLevel === 'number' ? meal.hungryLevel : 0
			const full = typeof meal.fullLevel === 'number' ? meal.fullLevel : 0
			dailyValues[label] = (hungry + full) / 2
		}
	}

	await DailySummary.findOneAndUpdate(
		{ userId, date },
		{ $set: { dailyValues, updatedAt: new Date() } },
		{ upsert: true, new: true }
	)
}
