import { createMeal, getMeals } from '../controllers/meal.controller'
import { authMiddleware } from '../middlewares/auth'

import { Router } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() }) // файли в пам'ять

router.use(authMiddleware)

router.post('/', upload.array('images', 6), createMeal) // до 6 фото
router.get('/', getMeals)
// router.patch('/:id', upload.array('images', 6), updateMeal)
// router.delete('/:id', deleteMeal)

export default router
