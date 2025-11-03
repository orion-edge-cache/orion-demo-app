import dotenv from 'dotenv'
dotenv.config()

import { PORT, app } from './app'

app.listen(PORT, () => {
  console.log("Server running, listening on Port", PORT)
})
