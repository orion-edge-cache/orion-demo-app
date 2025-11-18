import axios from 'axios'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { Resolvers } from './resolvers-types'

const localhost = process.env.LOCALHOST_BASE_URL
const port = process.env.AWS_LOCALHOST_PORT
const baseApiUrl = `${localhost}:${port}/api`

export const resolvers: Resolvers = {
  Query: {
    users: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const res = await axios.get(`${baseApiUrl}/users`)
      return res.data
    },
    posts: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const res = await axios.get(`${baseApiUrl}/posts`)
      return res.data
    },
    comments: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const res = await axios.get(`${baseApiUrl}/comments`)
      return res.data
    },
    user: async (_: any, { id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const res = await axios.get(`${baseApiUrl}/users/${id}`)
      return res.data
    },
    post: async (_: any, { id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const res = await axios.get(`${baseApiUrl}/posts/${id}`)
      return res.data
    },
    comment: async (_: any, { id }: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const res = await axios.get(`${baseApiUrl}/comments/${id}`)
      return res.data
    },
    postsByUser: async (_: any, { user_id }: { user_id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      const res = await axios.get(`${baseApiUrl}/posts?user_id=${user_id}`);
      return res.data;
    },
  },
  User: {
    //For User.posts (resolver on User type):
    posts: async (parent: { id: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const res = await axios.get(`${baseApiUrl}/posts?user_id=${parent.id}`);
      return res.data;
    }
  },
  Mutation: {
    createUser: async (_parent, args, _context) => {
      const { name, email } = args
      const users = await axios.get(`${baseApiUrl}/users`)
      const id = String(users.data.length + 1)
      const res = await axios.post(`${baseApiUrl}/users`, { id, name, email })
      return res.data
    },
    createPost: async (_parent, args, _context) => {
      const { title, user_id, body } = args
      const posts = await axios.get(`${baseApiUrl}/posts`)
      const id = String(posts.data.length + 1)
      const res = await axios.post(`${baseApiUrl}/posts`, { id, title, user_id, body })
      return res.data
    },
    createComment: async (_parent, args, _context) => {
      const { post_id, user_id, body } = args
      const comments = await axios.get(`${baseApiUrl}/comments`)
      const id = String(comments.data.length + 1)
      const res = await axios.post(`${baseApiUrl}/comments`, { id, post_id, user_id, body })
      return res.data
    },
    updateUser: async (_parent, args, _context) => {
      const { id, name, email } = args
      console.log("UPDATE USER")
      const res = await axios.put(`${baseApiUrl}/users/${id}`, { name, email })
      return res.data
    },
    updatePost: async (_parent, args, _context) => {
      const { id, title, user_id, body } = args
      const res = await axios.put(`${baseApiUrl}/posts/${id}`, { title, user_id, body })
      return res.data
    },
    updateComment: async (_parent, args, _context) => {
      const { id, post_id, user_id, body } = args
      const res = await axios.put(`${baseApiUrl}/comments/${id}`, { post_id, user_id, body })
      return res.data
    },
    deleteUser: async (_parent, args, _context) => {
      const { id } = args
      const userRes = await axios.get(`${baseApiUrl}/users/${id}`)
      const user = userRes.data
      await axios.delete(`${baseApiUrl}/users/${id}`)
      return user
    },
    deletePost: async (_parent, args, _context) => {
      const { id } = args
      const res = await axios.delete(`${baseApiUrl}/posts/${id}`)
      return res.data
    },
    deleteComment: async (_parent, args, _context) => {
      const { id } = args
      const res = await axios.delete(`${baseApiUrl}/comments/${id}`)
      return res.data
    },
    reset: async () => {
      const dbJsonPath = path.join(__dirname, '../db/json/db.json')
      const dbDir = path.join(__dirname, '../db/json')
      try {
        const users = JSON.parse(readFileSync(path.join(dbDir, 'users.json'), 'utf-8'))
        const posts = JSON.parse(readFileSync(path.join(dbDir, 'posts.json'), 'utf-8'))
        const comments = JSON.parse(readFileSync(path.join(dbDir, 'comments.json'), 'utf-8'))

        const db = { users, posts, comments }
        writeFileSync(dbJsonPath, JSON.stringify(db, null, 2))
        return { users, posts, comments }
      } catch (error) {
        console.log('Failed to reset database', error)
        return null
      }
    }
  }
}
