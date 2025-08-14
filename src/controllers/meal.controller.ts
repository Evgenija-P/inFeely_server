import cloudinary from '../config/cloudinary'
import Meal from '../models/Meal'

import { Request, Response } from 'express'

export const createMeal = async (req: Request, res: Response) => {
	try {
		const { label, date } = req.body
		if (!req.user?._id) {
			return res.status(401).json({ message: 'Unauthorized' })
		}

		const userId = req.user._id

		// Перевірка 1 breakfast/lunch/dinner на день
		if (['breakfast', 'lunch', 'dinner'].includes(label)) {
			const exists = await Meal.findOne({ userId, date, label })
			if (exists)
				return res
					.status(400)
					.json({ message: `You already have a ${label} for this day.` })
		}

		const files = req.files as Express.Multer.File[]
		const imageUrls: string[] = []

		for (const file of files || []) {
			const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
				const stream = cloudinary.uploader.upload_stream(
					{ folder: 'meals' },
					(error, result) => {
						if (error) reject(error)
						else resolve(result as { secure_url: string })
					}
				)
				stream.end(file.buffer)
			})
			imageUrls.push(result.secure_url)
		}

		const meal = await Meal.create({ ...req.body, userId, images: imageUrls })
		res.status(201).json(meal)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}
export const getMeals = async (req: Request, res: Response) => {
	try {
		if (!req.user?._id) {
			return res.status(401).json({ message: 'Unauthorized' })
		}

		const userId = req.user._id
		const meals = await Meal.find({ userId }).sort({ date: -1 })
		res.json(meals)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}
