import type { Post } from '../types'
import { usePosts } from '../hooks/usePosts'
import { useComments } from '../hooks/useComments'
import { useAppContext } from '../context/AppContext'
import PostForm from '../ui/PostForm'
import Button from '../ui/Button'

const UserDetail: React.FC = () => {
  const { selectedUser } = useAppContext()
  const {
    posts,
    handleCreatePost,
    handleUpdatePost,
    handleDeletePost
  } = usePosts(selectedUser?.id)
  const { comments } = useComments(selectedUser?.id)
  const {
    setShowPostForm,
    showPostForm,
    setEditingPost,
    editingPost,
    setSelectedPost,
    handleBack,
    setEditingUser
  } = useAppContext()

  const handleAddPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const body = formData.get('body') as string

    if (editingPost) {
      await handleUpdatePost(editingPost.id, title, body, selectedUser.id)
      setEditingPost(null)
    } else {
      await handleCreatePost(title, body, selectedUser.id)
    }
    setShowPostForm(false)
  }

  const handleDeletePostClick = (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      handleDeletePost(postId)
    }
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setShowPostForm(true)
  }

  const handleCancelPostForm = () => {
    setShowPostForm(false)
    setEditingPost(null)
  }

  if (!selectedUser) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 mb-8">
          <Button onClick={handleBack}>
            ← Back to Users
          </Button>
          <Button
            variant="primary"
            onClick={() => { setEditingUser(selectedUser); setShowPostForm(false); }}
          >
            Edit User
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this user?')) {
                // This would be handled by the context
              }
            }}
          >
            Delete User
          </Button>
        </div>
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 mb-8 border border-slate-700">
          <h1 className="text-4xl font-bold text-white mb-2">{selectedUser.name}</h1>
          <p className="text-slate-400 text-lg">Email: {selectedUser.email}</p>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Posts ({posts.length})</h2>
          <Button
            onClick={() => { setEditingPost(null); setShowPostForm(true); }}
          >
            + Add Post
          </Button>
        </div>
        {posts.length === 0 ? (
          <p className="text-slate-400">No posts yet.</p>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              className="bg-slate-800 rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-shadow border border-slate-700 cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <h3 className="text-xl font-bold text-white mb-3">{post.title}</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">{post.body}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                  Comments ({comments.filter(comment => comment.post_id === post.id).length})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditPost(post)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePostClick(post.id)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
        {showPostForm && (
          <PostForm
            editingPost={editingPost}
            onSubmit={handleAddPost}
            onCancel={handleCancelPostForm}
          />
        )}
      </div>
    </div>
  )
}

export default UserDetail
