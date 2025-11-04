import axios from 'axios'
import { Resolvers } from './resolvers-types'

export const resolvers: Resolvers = {
  Query: {
    users: async () => {
      const res = await axios.get('http://localhost:3000/api/users')
      console.log(res.data)
      return res.data
    },
    posts: async () => {
      const res = await axios.get('http://localhost:3000/api/posts')
      return res.data
    },
    comments: async () => {
      const res = await axios.get('http://localhost:3000/api/comments')
      return res.data
    },
    user: async (_: any, { id }: { id: string }) => {
      const res = await axios.get(`http://localhost:3000/api/users/${id}`)
      return res.data
    },
    post: async (_: any, { id }: { id: string }) => {
      const res = await axios.get(`http://localhost:3000/api/posts/${id}`)
      return res.data
    },
    comment: async (_: any, { id }: { id: string }) => {
      const res = await axios.get(`http://localhost:3000/api/comments/${id}`)
      return res.data
    }
  }
}
