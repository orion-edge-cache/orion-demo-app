import { useState, useEffect } from 'react'
import type { Post } from '../types'
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost
} from '../services/api'

export const usePosts = (userId?: string) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPosts()
      const userPosts = data.posts.filter((post: Post) => post.user_id === userId)
      setPosts(userPosts)
    } catch (err) {
      setError('Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (title: string, body: string, user_id: string) => {
    await createPost(title, body, user_id)
    if (userId) await loadPosts()
  }

  const handleUpdatePost = async (id: string, title: string, body: string, user_id: string) => {
    await updatePost(id, title, body, user_id)
    if (userId) await loadPosts()
  }

  const handleDeletePost = async (id: string) => {
    await deletePost(id)
    if (userId) await loadPosts()
  }

  useEffect(() => {
    if (userId) {
      loadPosts()
    }
  }, [userId])

  return {
    posts,
    loading,
    error,
    loadPosts,
    handleCreatePost,
    handleUpdatePost,
    handleDeletePost
  }
}
