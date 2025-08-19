import {
	createMealAfter,
	createMealBefore,
	deleteMeal,
	getCurrentMonthDailySummary,
	getDailySummaryByDate,
	getDailySummaryByPeriod,
	getMealById,
	getMeals,
	getMealsByDate,
	getMealsByPeriod,
	getMealsLast30Days,
	updateMeal
} from '../controllers/meal.controller'
import { authMiddleware } from '../middlewares/auth'

import { Router } from 'express'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() }) // файли в пам'ять

router.use(authMiddleware)

router.post('/before', upload.array('images', 6), createMealBefore) //попередній запис, тільки з назвою та рівнем голоду
router.post('/after/:mealId', upload.array('images', 6), createMealAfter) // запис "після", мінімум потрібно додати рівень ситості

router.get('/', getMeals) // отримання всіх записів
router.get('/:mealId', getMealById) // отримання інформації по конкретному запису
router.get('/day/:date', getMealsByDate) // отримання всіх записів за день
router.get('/day/period', getMealsByPeriod) // отримання даних за період, формат запиту ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/stats/day/:date', getDailySummaryByDate) // середні показники за день: середні дані по записам breakfast | lunch | dinner, повертає тільки масив з лейблом та середнім значенням
router.get('/stats/period', getDailySummaryByPeriod) //аналогічно, тільки дані за період по трьом основним прийомм їжі
router.get('/stats/last30days', getMealsLast30Days) // аналогічно, за останні 30 днів
router.get('/calendar', getCurrentMonthDailySummary) // Поточний місяць → календар: число → dailyValues, яля рендерінгу календаря
router.patch('/:mealId', upload.array('images', 6), updateMeal) //стандартне оновлення запису
router.delete('/:mealId', deleteMeal) //видалення запису

export default router

// створення (before + after) → createMealBefore, createMealAfter
// Мінімальний запис (before) + доповнення (after з fullLevel)

// оновлення → updateMeal
// Повне оновлення будь-якого запису

// видалення → deleteMeal
// Видалення запису та оновлення DailySummary

// отримання всіх записів (вся база) → getMeals
// Повертає всі записи користувача

// отримання записів за день (всі поля) → getMealsByDate
// Всі записи по конкретній даті (breakfast, lunch, dinner)

// отримання інформації по конкретному запису → getMealById
// Один запис по mealId

// отримання середніх значень за 3 основні прийоми їжі за конкретний день → getDailySummaryByDate
// Через DailySummary → повертає breakfast/lunch/dinner як середнє (hungryLevel + fullLevel)/2

// отримання середніх значень за 3 основні прийоми їжі період → getDailySummaryByPeriod
// Масив {date, dailyValues} за вільний період

// отримання середніх значень за 3 основні прийоми їжі за місяць (30 днів від поточної дати) → getMealsLast30Days
// Повертає середні за останні 30 днів + повні записи

// отримання середніх значень за 3 прийоми їжі з початку поточного місяця у форматі календаря (число → dailyValues) → getCurrentMonthDailySummary
// Для рендеру календаря, ключ = дата, значення = середні за день
