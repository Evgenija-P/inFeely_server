import app from './app'
import { connectDB } from './config/db'

import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 5000

connectDB()

app.listen(PORT, () => {
	console.log(`🚀 Server is running on port ${PORT}`)
})
