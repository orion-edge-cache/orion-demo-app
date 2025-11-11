import dotenv from 'dotenv'
if (process.env.ENV === 'development') {
  dotenv.config()
}
import { PORT, app } from './app'

app.listen(PORT, () => {
  console.log("Server running, listening on Port", PORT)
})
