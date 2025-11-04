import type { Comment } from '../types'
import { useComments } from '../hooks/useComments'
import { useAppContext } from '../context/AppContext'
import CommentForm from '../ui/CommentForm'
import Button from '../ui/Button'

const PostDetail: React.FC = () => {
  const { selectedPost, selectedUser } = useAppContext()
  const { comments, handleCreateComment, handleUpdateComment, handleDeleteComment } = useComments(selectedUser?.id)
  const {
    setShowCommentForm,
    showCommentForm,
    setEditingComment,
    editingComment,
    setSelectedPost,
    handleBack
  } = useAppContext()

  if (!selectedPost || !selectedUser) return null

  const postComments = comments.filter(comment => comment.post_id === selectedPost.id)

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const body = formData.get('body') as string

    if (editingComment) {
      await handleUpdateComment(editingComment.id, selectedPost.id, selectedUser.id, body)
      setEditingComment(null)
    } else {
      await handleCreateComment(selectedPost.id, selectedUser.id, body)
    }
    setShowCommentForm(false)
  }

  const handleDeleteCommentClick = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      handleDeleteComment(commentId)
    }
  }

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment)
    setShowCommentForm(true)
  }

  const handleCancelCommentForm = () => {
    setShowCommentForm(false)
    setEditingComment(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-8">
          <Button onClick={() => setSelectedPost(null)}>
            ← Back to Posts
          </Button>
          <Button onClick={handleBack}>
            Back to Users
          </Button>
        </div>
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 mb-8 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-4">{selectedPost.title}</h2>
          <p className="text-slate-300 mb-6 leading-relaxed">{selectedPost.body}</p>
          <div className="flex gap-2 mb-6">
            <Button
              variant="primary"
              onClick={() => { setEditingComment(null); setShowCommentForm(false); }}
            >
              Edit Post
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this post?')) {
                  // Handle delete post
                }
              }}
            >
              Delete Post
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Comments ({postComments.length})</h3>
          <Button
            onClick={() => { setEditingComment(null); setShowCommentForm(true); }}
          >
            + Add Comment
          </Button>
        </div>
        {postComments.length === 0 ? (
          <p className="text-slate-400">No comments yet.</p>
        ) : (
          postComments.map(comment => (
            <div
              key={comment.id}
              className="bg-slate-700 p-4 mb-4 rounded-lg border border-slate-600"
            >
              <p className="text-slate-200 mb-3">{comment.body}</p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleEditComment(comment)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteCommentClick(comment.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
        {showCommentForm && (
          <CommentForm
            editingComment={editingComment}
            onSubmit={handleAddComment}
            onCancel={handleCancelCommentForm}
          />
        )}
      </div>
    </div>
  )
}

export default PostDetail
