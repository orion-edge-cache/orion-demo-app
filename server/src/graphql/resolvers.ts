import axios from 'axios'
import { Resolvers } from './resolvers-types'

const baseApiUrl = 'http://localhost:3000/api'

export const resolvers: Resolvers = {
  Query: {
    users: async () => {
      await setTimeout(() => {

      })
      const res = await axios.get(`${baseApiUrl}/users`)
      console.log(res.data)
      return res.data
    },
    posts: async () => {
      const res = await axios.get(`${baseApiUrl}/posts`)
      return res.data
    },
    comments: async () => {
      const res = await axios.get(`${baseApiUrl}/comments`)
      return res.data
    },
    user: async (_: any, { id }: { id: string }) => {
      const res = await axios.get(`${baseApiUrl}/users/${id}`)
      return res.data
    },
    post: async (_: any, { id }: { id: string }) => {
      const res = await axios.get(`${baseApiUrl}/posts/${id}`)
      return res.data
    },
    comment: async (_: any, { id }: { id: string }) => {
      const res = await axios.get(`${baseApiUrl}/comments/${id}`)
      return res.data
    }
  },
  Mutation: {
    createUser: async (_parent, args, _context) => {
      const { name, email } = args
      console.log('\u001b[1;31mARGS:', JSON.stringify(args))
      const res = await axios.post(`${baseApiUrl}/users`, { name, email })
      return res.data
    },
    createPost: async (_parent, args, _context) => {
      const { title, user_id, body } = args
      const res = await axios.post(`${baseApiUrl}/posts`, { title, user_id, body })
      return res.data
    },
    createComment: async (_parent, args, _context) => {
      const { post_id, user_id, body } = args
      const res = await axios.post(`${baseApiUrl}/comments`, { post_id, user_id, body })
      return res.data
    },
    updateUser: async (_parent, args, _context) => {
      const { id, name, email } = args
      const res = await axios.put(`${baseApiUrl}/user/${id}`, { name, email })
      return res.data
    },
    updatePost: async (_parent, args, _context) => {
      const { id, title, user_id, body } = args
      const res = await axios.put(`${baseApiUrl}/post/${id}`, { title, user_id, body })
      return res.data
    },
    updateComment: async (_parent, args, _context) => {
      const { id, post_id, user_id, body } = args
      const res = await axios.put(`${baseApiUrl}/comment/${id}`, { post_id, user_id, body })
      return res.data
    },
    deleteUser: async (_parent, args, _context) => {
      const { id } = args
      const res = await axios.put(`${baseApiUrl}/user/${id}`)
      return res.data
    },
    deletePost: async (_parent, args, _context) => {
      const { id } = args
      const res = await axios.put(`${baseApiUrl}/post/${id}`)
      return res.data
    },
    deleteComment: async (_parent, args, _context) => {
      const { id } = args
      const res = await axios.put(`${baseApiUrl}/comment/${id}`)
      return res.data
    }
  }
}
