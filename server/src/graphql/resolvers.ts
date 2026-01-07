import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs'
import path from 'path'
import { Resolvers } from './resolvers-types'

// ─────────────────────────────────────────────────────────────────────────────
// Database Types (internal, not exported)
// ─────────────────────────────────────────────────────────────────────────────

interface DbUser {
  id: string
  name: string
  email: string
}

interface DbPost {
  id: string
  title: string
  body: string
  user_id: string
  created_at?: string
}

interface DbComment {
  id: string
  body: string
  user_id: string
  post_id: string
}

interface Database {
  users: DbUser[]
  posts: DbPost[]
  comments: DbComment[]
}

// ─────────────────────────────────────────────────────────────────────────────
// File Path Helpers
// ─────────────────────────────────────────────────────────────────────────────

const isLambda = (): boolean => {
  return process.env.DEPLOYMENT_ENV === 'aws-lambda'
}

const getDbPath = (): string => {
  if (isLambda()) {
    return '/tmp/db.json'
  }
  return path.join(__dirname, '../db/json/db.json')
}

const getResetPath = (): string => {
  // Reset file is always in the packaged location
  return path.join(__dirname, '../db/json/db-reset.json')
}

const getPackagedDbPath = (): string => {
  // Original db.json packaged with Lambda
  return path.join(__dirname, '../db/json/db.json')
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure db.json exists in /tmp for Lambda (cold start handling)
 */
const ensureDbExists = (): void => {
  if (isLambda()) {
    const tmpPath = getDbPath()
    if (!existsSync(tmpPath)) {
      // Cold start: copy packaged db.json to /tmp
      const sourcePath = getPackagedDbPath()
      console.log(`Cold start: copying db.json from ${sourcePath} to ${tmpPath}`)
      copyFileSync(sourcePath, tmpPath)
      console.log('Cold start: db.json copied to /tmp')
    }
  }
}

/**
 * Read the database from disk
 */
const readDb = (): Database => {
  ensureDbExists()
  const dbPath = getDbPath()
  try {
    const content = readFileSync(dbPath, 'utf-8')
    return JSON.parse(content) as Database
  } catch (error) {
    console.error('Error reading database:', error)
    throw new Error('Failed to read database')
  }
}

/**
 * Write the database to disk
 */
const writeDb = (data: Database): void => {
  const dbPath = getDbPath()
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8')
    console.log('Database written successfully')
  } catch (error) {
    console.error('Error writing database:', error)
    throw new Error('Failed to write database')
  }
}

/**
 * Demo delay to simulate network latency
 */
const demoDelay = (): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, 500))
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolvers
// ─────────────────────────────────────────────────────────────────────────────

export const resolvers: Resolvers = {
  Query: {
    // Get all users
    users: async () => {
      await demoDelay()
      const db = readDb()
      return db.users as any
    },

    // Get all posts
    posts: async () => {
      await demoDelay()
      const db = readDb()
      return db.posts as any
    },

    // Get all comments
    comments: async () => {
      await demoDelay()
      const db = readDb()
      return db.comments as any
    },

    // Get user by ID
    user: async (_parent, { id }) => {
      await demoDelay()
      const db = readDb()
      const user = db.users.find(u => u.id === id)
      return (user || null) as any
    },

    // Get post by ID
    post: async (_parent, { id }) => {
      await demoDelay()
      const db = readDb()
      const post = db.posts.find(p => p.id === id)
      return (post || null) as any
    },

    // Get comment by ID
    comment: async (_parent, { id }) => {
      await demoDelay()
      const db = readDb()
      const comment = db.comments.find(c => c.id === id)
      return (comment || null) as any
    },

    // Get posts by user ID (manual filtering)
    postsByUser: async (_parent, { user_id }) => {
      await demoDelay()
      const db = readDb()
      return db.posts.filter(p => p.user_id === user_id) as any
    },
  },

  User: {
    // Resolve posts for a user (manual filtering)
    posts: async (parent) => {
      await demoDelay()
      const db = readDb()
      return db.posts.filter(p => p.user_id === parent.id) as any
    },
  },

  Mutation: {
    // Create a new user
    createUser: async (_parent, { name, email }) => {
      const db = readDb()
      
      // Generate new ID (max existing ID + 1)
      const maxId = db.users.reduce((max, u) => Math.max(max, parseInt(u.id, 10)), 0)
      const id = String(maxId + 1)
      
      const newUser: DbUser = { id, name, email }
      db.users.push(newUser)
      writeDb(db)
      
      console.log(`Created user: ${JSON.stringify(newUser)}`)
      return newUser as any
    },

    // Create a new post
    createPost: async (_parent, { title, user_id, body }) => {
      const db = readDb()
      
      // Generate new ID
      const maxId = db.posts.reduce((max, p) => Math.max(max, parseInt(p.id, 10)), 0)
      const id = String(maxId + 1)
      
      const newPost: DbPost = {
        id,
        title,
        body,
        user_id,
        created_at: new Date().toISOString(),
      }
      db.posts.push(newPost)
      writeDb(db)
      
      console.log(`Created post: ${JSON.stringify(newPost)}`)
      return newPost as any
    },

    // Create a new comment
    createComment: async (_parent, { post_id, user_id, body }) => {
      const db = readDb()
      
      // Generate new ID
      const maxId = db.comments.reduce((max, c) => Math.max(max, parseInt(c.id, 10)), 0)
      const id = String(maxId + 1)
      
      const newComment: DbComment = { id, body, user_id, post_id }
      db.comments.push(newComment)
      writeDb(db)
      
      console.log(`Created comment: ${JSON.stringify(newComment)}`)
      return newComment as any
    },

    // Update an existing user
    updateUser: async (_parent, { id, name, email }) => {
      const db = readDb()
      
      const userIndex = db.users.findIndex(u => u.id === id)
      if (userIndex === -1) {
        console.log(`User not found: ${id}`)
        return null
      }
      
      db.users[userIndex] = { id, name, email }
      writeDb(db)
      
      console.log(`Updated user: ${JSON.stringify(db.users[userIndex])}`)
      return db.users[userIndex] as any
    },

    // Update an existing post
    updatePost: async (_parent, { id, title, user_id, body }) => {
      const db = readDb()
      
      const postIndex = db.posts.findIndex(p => p.id === id)
      if (postIndex === -1) {
        console.log(`Post not found: ${id}`)
        return null
      }
      
      // Preserve created_at if it exists
      const existingPost = db.posts[postIndex]
      db.posts[postIndex] = {
        id,
        title,
        body,
        user_id,
        created_at: existingPost?.created_at || new Date().toISOString(),
      }
      writeDb(db)
      
      console.log(`Updated post: ${JSON.stringify(db.posts[postIndex])}`)
      return db.posts[postIndex] as any
    },

    // Update an existing comment
    updateComment: async (_parent, { id, post_id, user_id, body }) => {
      const db = readDb()
      
      const commentIndex = db.comments.findIndex(c => c.id === id)
      if (commentIndex === -1) {
        console.log(`Comment not found: ${id}`)
        return null
      }
      
      db.comments[commentIndex] = { id, body, user_id, post_id }
      writeDb(db)
      
      console.log(`Updated comment: ${JSON.stringify(db.comments[commentIndex])}`)
      return db.comments[commentIndex] as any
    },

    // Delete a user
    deleteUser: async (_parent, { id }) => {
      const db = readDb()
      
      const userIndex = db.users.findIndex(u => u.id === id)
      if (userIndex === -1) {
        console.log(`User not found: ${id}`)
        return null
      }
      
      const [deletedUser] = db.users.splice(userIndex, 1)
      writeDb(db)
      
      console.log(`Deleted user: ${JSON.stringify(deletedUser)}`)
      return deletedUser as any
    },

    // Delete a post
    deletePost: async (_parent, { id }) => {
      const db = readDb()
      
      const postIndex = db.posts.findIndex(p => p.id === id)
      if (postIndex === -1) {
        console.log(`Post not found: ${id}`)
        return null
      }
      
      const [deletedPost] = db.posts.splice(postIndex, 1)
      writeDb(db)
      
      console.log(`Deleted post: ${JSON.stringify(deletedPost)}`)
      return deletedPost as any
    },

    // Delete a comment
    deleteComment: async (_parent, { id }) => {
      const db = readDb()
      
      const commentIndex = db.comments.findIndex(c => c.id === id)
      if (commentIndex === -1) {
        console.log(`Comment not found: ${id}`)
        return null
      }
      
      const [deletedComment] = db.comments.splice(commentIndex, 1)
      writeDb(db)
      
      console.log(`Deleted comment: ${JSON.stringify(deletedComment)}`)
      return deletedComment as any
    },

    // Reset database to initial state
    reset: async () => {
      try {
        const resetPath = getResetPath()
        const dbPath = getDbPath()
        
        console.log(`Resetting database from ${resetPath} to ${dbPath}`)
        copyFileSync(resetPath, dbPath)
        
        const db = readDb()
        console.log('Database reset successfully')
        
        return {
          users: db.users,
          posts: db.posts,
          comments: db.comments,
        } as any
      } catch (error) {
        console.error('Failed to reset database:', error)
        return null
      }
    },
  },
}
