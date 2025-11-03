import axios from 'axios'
import { Resolvers } from './resolvers-types'

export const resolvers: Resolvers = {
  Query: {
    users: async () => {
      const res = await axios.get('http://localhost:3000/api/users')
      return res.data
    }
  }
}
