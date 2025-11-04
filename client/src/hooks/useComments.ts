import { useState, useEffect } from 'react'
import type { Comment } from '../types'
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment
} from '../services/api'

export const useComments = (userId?: string) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadComments = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchComments()
      setComments(data.comments)
    } catch (err) {
      setError('Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateComment = async (post_id: string, user_id: string, body: string) => {
    await createComment(post_id, user_id, body)
    if (userId) await loadComments()
  }

  const handleUpdateComment = async (id: string, post_id: string, user_id: string, body: string) => {
    await updateComment(id, post_id, user_id, body)
    if (userId) await loadComments()
  }

  const handleDeleteComment = async (id: string) => {
    await deleteComment(id)
    if (userId) await loadComments()
  }

  useEffect(() => {
    if (userId) {
      loadComments()
    }
  }, [userId])

  return {
    comments,
    loading,
    error,
    loadComments,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment
  }
}
