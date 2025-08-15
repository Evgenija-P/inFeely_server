import cloudinary from '../config/cloudinary'
import Meal from '../models/Meal'

import { Request, Response } from 'express'

export const createMeal = async (req: Request, res: Response) => {
	console.log('Creating meal with data:', req.body)

	try {
		if (!req.user?._id) {
			return res.status(401).json({ message: 'Unauthorized' })
		}

		const { label, dateTime, images: base64Images } = req.body
		const userId = req.user._id

		// Перевірка 1 breakfast/lunch/dinner на день
		if (['breakfast', 'lunch', 'dinner'].includes(label)) {
			if (!dateTime) {
				return res.status(400).json({ message: 'dateTime is required' })
			}

			// Виділяємо тільки дату (без часу)
			const dateOnly = new Date(dateTime).toISOString().split('T')[0]

			const exists = await Meal.findOne({
				userId,
				label,
				// Знаходимо всі записи у цей же день
				dateTime: {
					$gte: new Date(dateOnly),
					$lt: new Date(new Date(dateOnly).setDate(new Date(dateOnly).getDate() + 1))
				}
			})

			if (exists) {
				return res
					.status(400)
					.json({ message: `You already have a ${label} for this day.` })
			}
		}

		const imageUrls: string[] = []

		// Завантаження base64-зображень в Cloudinary
		if (Array.isArray(base64Images) && base64Images.length > 0) {
			for (const base64 of base64Images) {
				try {
					const result = await cloudinary.uploader.upload(base64, {
						folder: 'meals'
					})
					imageUrls.push(result.secure_url)
				} catch (err) {
					console.error('Error uploading image:', err)
				}
			}
		}

		const meal = await Meal.create({
			...req.body,
			userId,
			images: imageUrls // тепер тут будуть посилання на Cloudinary
		})

		res.status(201).json(meal)
	} catch (error) {
		console.error('Error creating meal:', error)
		res.status(500).json({ message: (error as Error).message })
	}
}

export const getMeals = async (req: Request, res: Response) => {
	try {
		if (!req.user?._id) {
			return res.status(401).json({ message: 'Unauthorized' })
		}

		const userId = req.user._id
		const meals = await Meal.find({ userId }).sort({ dateTime: -1 })
		res.json(meals)
	} catch (error) {
		res.status(500).json({ message: (error as Error).message })
	}
}
