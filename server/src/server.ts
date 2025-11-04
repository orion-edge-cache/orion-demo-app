import { PORT, app } from './app'

app.listen(PORT, () => {
  console.log("Server running, listening on Port", PORT)
})
