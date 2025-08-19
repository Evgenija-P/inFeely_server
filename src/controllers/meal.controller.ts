import cloudinary from '../config/cloudinary'
import { updateDailySummary } from '../helpers/updateDailySummary'
import Meal from '../models/Meal'

import { Request, Response } from 'express'

// 🔹 Спільна функція перевірки дублю
const checkUniqueMeal = async (userId: string, label: string, date: string, excludeId?: string) => {
	if (!['breakfast', 'lunch', 'dinner'].includes(label)) return false

	const existingMeal = await Meal.findOne({
		userId,
		label,
		date,
		_id: excludeId ? { $ne: excludeId } : undefined
	})

	return !!existingMeal
}

// 🔹 Створення мінімального запису (before)
export const createMealBefore = async (req: Request, res: Response) => {
	try {
		const { label, hungryLevel, dateTime, images: base64Images, ...rest } = req.body
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		// ✅ Перевірка обов'язкових полів
		if (!label || typeof hungryLevel !== 'number' || !dateTime) {
			return res.status(400).json({ message: 'label, hungryLevel, dateTime are required' })
		}

		const dateOnly = new Date(dateTime).toISOString().split('T')[0]
		const exists = await checkUniqueMeal(userId, label, dateOnly)
		if (exists)
			return res.status(400).json({ message: `You already have a ${label} for this day.` })

		// 📷 Завантаження фото
		const imageUrls: string[] = []
		if (Array.isArray(base64Images)) {
			for (const base64 of base64Images) {
				try {
					const result = await cloudinary.uploader.upload(base64, { folder: 'meals' })
					imageUrls.push(result.secure_url)
				} catch (err) {
					console.error('Error uploading image:', err)
				}
			}
		}

		const meal = await Meal.create({
			userId,
			label,
			hungryLevel,
			dateTime,
			date: dateOnly,
			images: imageUrls,
			...rest
		})

		await updateDailySummary(userId, dateOnly)

		res.status(201).json(meal)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Додавання fullLevel після мінімального запису (after)
export const createMealAfter = async (req: Request, res: Response) => {
	try {
		const { mealId } = req.params
		const { fullLevel, images: base64Images, ...rest } = req.body
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		if (typeof fullLevel !== 'number') {
			return res.status(400).json({ message: 'fullLevel is required' })
		}

		const meal = await Meal.findOne({ _id: mealId, userId })
		if (!meal) return res.status(404).json({ message: 'Meal not found' })
		if (meal.fullLevel !== undefined)
			return res.status(400).json({ message: 'fullLevel already set' })

		// 🔎 Перевірка дубля, якщо змінюється label/dateTime
		const newLabel = rest.label ?? meal.label
		const newDateTime = rest.dateTime ?? meal.dateTime
		const dateOnly = new Date(newDateTime).toISOString().split('T')[0]

		const exists = await checkUniqueMeal(userId, newLabel, dateOnly, meal._id.toString())
		if (exists)
			return res.status(400).json({ message: `You already have a ${newLabel} for this day.` })

		// 📷 Завантаження фото
		const imageUrls: string[] = meal.images
		if (Array.isArray(base64Images)) {
			for (const base64 of base64Images) {
				try {
					const result = await cloudinary.uploader.upload(base64, { folder: 'meals' })
					imageUrls.push(result.secure_url)
				} catch (err) {
					console.error('Error uploading image:', err)
				}
			}
		}

		meal.fullLevel = fullLevel
		meal.images = imageUrls
		Object.assign(meal, rest)
		await meal.save()
		await updateDailySummary(userId, dateOnly)
		res.json(meal)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Повне оновлення запису
export const updateMeal = async (req: Request, res: Response) => {
	try {
		const { mealId } = req.params
		const updateData = req.body
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const meal = await Meal.findOne({ _id: mealId, userId })
		if (!meal) return res.status(404).json({ message: 'Meal not found' })

		// 🔎 Перевірка дубля, якщо змінюється label/dateTime
		const newLabel = updateData.label ?? meal.label
		const newDateTime = updateData.dateTime ?? meal.dateTime
		const dateOnly = new Date(newDateTime).toISOString().split('T')[0]

		const exists = await checkUniqueMeal(userId, newLabel, dateOnly, meal._id.toString())
		if (exists)
			return res.status(400).json({ message: `You already have a ${newLabel} for this day.` })

		const updatedMeal = await Meal.findOneAndUpdate(
			{ _id: mealId, userId },
			{ $set: updateData },
			{ new: true }
		)

		await updateDailySummary(
			userId,
			(updateData.date ?? updatedMeal!.date).toISOString().split('T')[0]
		)

		res.json(updatedMeal)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

export const getMeals = async (req: Request, res: Response) => {
	try {
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const meals = await Meal.find({ userId }).sort({ dateTime: 1 })
		res.json(meals)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

export const getMealsByDate = async (req: Request, res: Response) => {
	try {
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const { date } = req.params
		if (!date) return res.status(400).json({ message: 'Date is required' })

		// Перетворюємо на формат YYYY-MM-DD, щоб порівняння було точне
		const dateOnly = new Date(date).toISOString().split('T')[0]

		const meals = await Meal.find({ userId, date: dateOnly }).sort({ dateTime: 1 })

		// Повертаємо усі записи, навіть якщо їх менше трьох (breakfast, lunch, dinner)
		res.json(meals)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Отримати конкретний запис по mealId
export const getMealById = async (req: Request, res: Response) => {
	try {
		const { mealId } = req.params
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const meal = await Meal.findOne({ _id: mealId, userId })
		if (!meal) return res.status(404).json({ message: 'Meal not found' })

		res.json(meal)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Отримати середні значення за день
export const getDailySummaryByDate = async (req: Request, res: Response) => {
	try {
		const { date } = req.params
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const summary = await DailySummary.findOne({ userId, date })
		if (!summary) {
			return res.json({ breakfast: 0, lunch: 0, dinner: 0 })
		}

		res.json(summary.dailyValues)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Отримати середні значення за період (startDate / endDate)
export const getDailySummaryByPeriod = async (req: Request, res: Response) => {
	try {
		const { startDate, endDate } = req.query
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })
		if (!startDate || !endDate)
			return res.status(400).json({ message: 'startDate and endDate are required' })

		const summaries = await DailySummary.find({
			userId,
			date: { $gte: startDate, $lte: endDate }
		}).sort({ date: 1 })

		res.json(summaries.map(s => ({ date: s.date, dailyValues: s.dailyValues })))
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Поточний місяць → календар: число → dailyValues
export const getCurrentMonthDailySummary = async (req: Request, res: Response) => {
	try {
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
			.toISOString()
			.split('T')[0]
		const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
			.toISOString()
			.split('T')[0]

		const summaries = await DailySummary.find({
			userId,
			date: { $gte: startOfMonth, $lte: endOfMonth }
		}).sort({ date: 1 })

		const result: Record<string, (typeof summaries)[0]['dailyValues']> = {}
		summaries.forEach(s => {
			result[s.date] = s.dailyValues
		})

		res.json(result)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Отримати всі прийоми за період
export const getMealsByPeriod = async (req: Request, res: Response) => {
	try {
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const { startDate, endDate } = req.query
		if (!startDate || !endDate)
			return res.status(400).json({ message: 'startDate and endDate are required' })

		// Форматуємо дати у YYYY-MM-DD для точності
		const start = new Date(startDate as string).toISOString().split('T')[0]
		const end = new Date(endDate as string).toISOString().split('T')[0]

		const meals = await Meal.find({
			userId,
			date: { $gte: start, $lte: end }
		}).sort({ dateTime: 1 })

		res.json(meals)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Отримати записи та середнє за останні 30 днів
export const getMealsLast30Days = async (req: Request, res: Response) => {
	try {
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const now = new Date()
		const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 днів назад

		// отримуємо всі записи користувача за останні 30 днів
		const meals = await Meal.find({
			userId,
			dateTime: { $gte: startDate, $lte: now }
		})

		// обчислюємо середні показники по трьох основних прийомах
		const mainMeals = meals.filter(m => ['breakfast', 'lunch', 'dinner'].includes(m.label))
		const avg = mainMeals.reduce(
			(acc, meal, _, arr) => {
				acc.hungryLevel =
					(acc.hungryLevel * acc.count + (meal.hungryLevel ?? 0)) / (acc.count + 1)
				if (meal.fullLevel !== undefined) {
					acc.fullLevel =
						(acc.fullLevel * acc.countFull + meal.fullLevel) / (acc.countFull + 1)
					acc.countFull += 1
				}
				acc.count += 1
				return acc
			},
			{ hungryLevel: 0, fullLevel: 0, count: 0, countFull: 0 }
		)

		res.json({
			meals,
			stats: {
				avgHungryLevel: avg.hungryLevel,
				avgFullLevel: avg.countFull > 0 ? avg.fullLevel : null,
				totalMeals: mainMeals.length
			},
			period: {
				from: startDate,
				to: now
			}
		})
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}

// 🔹 Видалення запису
export const deleteMeal = async (req: Request, res: Response) => {
	try {
		const { mealId } = req.params
		const userId = req.user?._id
		if (!userId) return res.status(401).json({ message: 'Unauthorized' })

		const meal = await Meal.findOneAndDelete({ _id: mealId, userId })
		if (!meal) return res.status(404).json({ message: 'Meal not found' })

		const dateOnly = new Date(meal.dateTime).toISOString().split('T')[0]
		await updateDailySummary(userId, dateOnly)

		res.json({ message: 'Meal deleted successfully' })
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}
