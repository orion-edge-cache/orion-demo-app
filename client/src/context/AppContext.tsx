import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import type { User, Post, Comment } from '../types'

const LOCALHOST_PORT = import.meta.env.VITE_AWS_LOCALHOST_PORT
const LOCALHOST_BASE_URL = import.meta.env.VITE_LOCALHOST_BASE_URL + LOCALHOST_PORT

const API_BASE_URL = import.meta.env.VITE_AWS_SITE_BASE_URL ||
  LOCALHOST_BASE_URL

console.log('AppContext.tsx: API BASE URL:', API_BASE_URL)

interface AppContextType {
  users: User[]
  posts: Post[]
  comments: Comment[]
  selectedUser: User | null
  setSelectedUser: (user: User | null) => void
  selectedPost: Post | null
  setSelectedPost: (post: Post | null) => void
  showUserForm: boolean
  setShowUserForm: (show: boolean) => void
  showPostForm: boolean
  setShowPostForm: (show: boolean) => void
  showCommentForm: boolean
  setShowCommentForm: (show: boolean) => void
  editingUser: User | null
  setEditingUser: (user: User | null) => void
  editingPost: Post | null
  setEditingPost: (post: Post | null) => void
  editingComment: Comment | null
  setEditingComment: (comment: Comment | null) => void
  handleBack: () => void
  handleReset: () => Promise<void>
  refetchData: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)

  const refetchData = async () => {
    try {
      const [usersRes, postsRes, commentsRes] = await Promise.all([
        axios.post(`${API_BASE_URL}/graphql`, {
          query: 'query {users {id name email}}'
        }),
        axios.post(`${API_BASE_URL}/graphql`, {
          query: 'query {posts {id title body user_id}}'
        }),
        axios.post(`${API_BASE_URL}/graphql`, {
          query: 'query {comments {id body user_id post_id}}'
        })
      ])
      console.log('USER DATA')
      console.log(usersRes.data)

      setUsers(usersRes.data.data.users)
      setPosts(postsRes.data.data.posts)
      setComments(commentsRes.data.data.comments)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  useEffect(() => {
    refetchData()
  }, [])

  const handleBack = () => {
    setSelectedUser(null)
    setSelectedPost(null)
    setShowUserForm(false)
    setShowPostForm(false)
    setShowCommentForm(false)
    setEditingUser(null)
    setEditingPost(null)
    setEditingComment(null)
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the database to its initial state?')) {
      try {
        await import('../services/api').then(api => api.resetDatabase())
        await refetchData()
        handleBack()
        alert('Database reset successfully!')
      } catch (error) {
        alert('Failed to reset database')
      }
    }
  }

  return (
    <AppContext.Provider
      value={{
        users,
        posts,
        comments,
        selectedUser,
        setSelectedUser,
        selectedPost,
        setSelectedPost,
        showUserForm,
        setShowUserForm,
        showPostForm,
        setShowPostForm,
        showCommentForm,
        setShowCommentForm,
        editingUser,
        setEditingUser,
        editingPost,
        setEditingPost,
        editingComment,
        setEditingComment,
        handleBack,
        handleReset,
        refetchData
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
