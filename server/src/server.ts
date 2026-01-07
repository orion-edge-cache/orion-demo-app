import dotenv from 'dotenv'
dotenv.config()
import { PORT, app } from './app'
import { logEnvironment } from './config'

const startServer = () => {
  logEnvironment()
  
  app.listen(PORT, () => {
    console.log(`Server running, listening on Port ${PORT}`)
  })
}

startServer()
