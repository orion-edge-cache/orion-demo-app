import dotenv from 'dotenv'
dotenv.config()
import { PORT, app, initializeApp } from './app'
import { logEnvironment } from './config'

const startServer = async () => {
  logEnvironment()
  
  // Initialize the app (will set up S3 if needed)
  await initializeApp()
  
  app.listen(PORT, () => {
    console.log(`Server running, listening on Port ${PORT}`)
  })
}

startServer().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
