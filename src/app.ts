import authRoutes from './routes/auth.routes'
import mealRoute from './routes/meal.route'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { Application } from 'express'
import morgan from 'morgan'

dotenv.config()

const app: Application = express()

app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

app.use('/meal', mealRoute)
app.use('/api/auth', authRoutes)

export default app
