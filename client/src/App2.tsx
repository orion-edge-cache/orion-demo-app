import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import type { User, Post, Comment } from './types/types'

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [showUserForm, setShowUserForm] = useState(false)
  const [showPostForm, setShowPostForm] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const fetchUsers = async () => {
    const res = await axios.post('http://localhost:3000/graphql', {
      query: 'query {users {id name email}}'
    })
    const { data } = res.data
    setUsers(data.users)
  }

  const fetchPostsAndComments = async (userId: string) => {
    const postsRes = await axios.post('http://localhost:3000/graphql', {
      query: 'query {posts {id title body user_id}}'
    })
    const { data: postsData } = postsRes.data
    const userPosts = postsData.posts.filter((post: Post) => post.user_id === userId)
    setPosts(userPosts)

    const commentsRes = await axios.post('http://localhost:3000/graphql', {
      query: 'query {comments {id body user_id post_id}}'
    })
    const { data: commentsData } = commentsRes.data
    setComments(commentsData.comments)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUserClick = async (user: User) => {
    setSelectedUser(user)
    await fetchPostsAndComments(user.id)
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPosts([])
    setComments([])
    setShowUserForm(false)
    setShowPostForm(false)
    setShowCommentForm(false)
    setEditingUser(null)
    setEditingPost(null)
    setEditingComment(null)
    setSelectedPost(null)
  }

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    if (editingUser) {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { updateUser(id: "${editingUser.id}", name: "${name}", email: "${email}") { id name email } }`
      })
      setEditingUser(null)
    } else {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { createUser(name: "${name}", email: "${email}") { id name email } }`
      })
    }
    setShowUserForm(false)
    await fetchUsers()
    if (selectedUser) {
      setSelectedUser(null)
    }
  }

  const handleAddPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const body = formData.get('body') as string

    if (editingPost) {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { updatePost(id: "${editingPost.id}", title: "${title}", user_id: "${selectedUser.id}", body: "${body}") { id title body user_id } }`
      })
      setEditingPost(null)
    } else {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { createPost(title: "${title}", user_id: "${selectedUser.id}", body: "${body}") { id title body user_id } }`
      })
    }
    setShowPostForm(false)
    await fetchPostsAndComments(selectedUser.id)
  }

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser || !selectedPost) return
    const formData = new FormData(e.currentTarget)
    const body = formData.get('body') as string

    if (editingComment) {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { updateComment(id: "${editingComment.id}", post_id: "${selectedPost.id}", user_id: "${selectedUser.id}", body: "${body}") { id body user_id post_id } }`
      })
      setEditingComment(null)
    } else {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { createComment(post_id: "${selectedPost.id}", user_id: "${selectedUser.id}", body: "${body}") { id body user_id post_id } }`
      })
    }
    setShowCommentForm(false)
    await fetchPostsAndComments(selectedUser.id)
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { deleteUser(id: "${userId}") { id } }`
      })
      await fetchUsers()
      if (selectedUser?.id === userId) {
        handleBack()
      }
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { deletePost(id: "${postId}") { id } }`
      })
      if (selectedUser) {
        await fetchPostsAndComments(selectedUser.id)
      }
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await axios.post('http://localhost:3000/graphql', {
        query: `mutation { deleteComment(id: "${commentId}") { id } }`
      })
      if (selectedUser) {
        await fetchPostsAndComments(selectedUser.id)
      }
    }
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the database to its initial state?')) {
      try {
        await axios.post('http://localhost:3000/reset')
        await fetchUsers()
        handleBack()
        alert('Database reset successfully!')
      } catch (error) {
        alert('Failed to reset database')
      }
    }
  }

  if (selectedUser && selectedPost) {
    const postComments = comments.filter(comment => comment.post_id === selectedPost.id)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-8">
            <button onClick={() => setSelectedPost(null)} className="px-6 py-2 bg-slate-700 text-white border-none rounded-lg hover:bg-slate-600 transition-colors font-medium text-sm">
              ← Back to Posts
            </button>
            <button onClick={handleBack} className="px-6 py-2 bg-indigo-600 text-white border-none rounded-lg hover:bg-indigo-500 transition-colors font-medium text-sm">
              Back to Users
            </button>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-2xl p-8 mb-8 border border-slate-700">
            <h2 className="text-3xl font-bold text-white mb-4">{selectedPost.title}</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">{selectedPost.body}</p>
            <div className="flex gap-2 mb-6">
              <button onClick={() => { setEditingPost(selectedPost); setShowPostForm(true) }} className="px-4 py-2 bg-blue-600 text-white border-none rounded-lg hover:bg-blue-500 transition-colors font-medium text-sm">
                Edit Post
              </button>
              <button onClick={() => handleDeletePost(selectedPost.id)} className="px-4 py-2 bg-red-600 text-white border-none rounded-lg hover:bg-red-500 transition-colors font-medium text-sm">
                Delete Post
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Comments ({postComments.length})</h3>
            <button onClick={() => { setEditingComment(null); setShowCommentForm(true) }} className="px-4 py-2 bg-green-600 text-white border-none rounded-lg hover:bg-green-500 transition-colors font-medium text-sm">
              + Add Comment
            </button>
          </div>
          {postComments.length === 0 ? (
            <p className="text-slate-400">No comments yet.</p>
          ) : (
            postComments.map(comment => (
              <div key={comment.id} className="bg-slate-700 p-4 mb-4 rounded-lg border border-slate-600">
                <p className="text-slate-200 mb-3">{comment.body}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingComment(comment); setShowCommentForm(true) }} className="px-3 py-1 bg-blue-600 text-white border-none rounded text-sm hover:bg-blue-500 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteComment(comment.id)} className="px-3 py-1 bg-red-600 text-white border-none rounded text-sm hover:bg-red-500 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
          {showCommentForm && (
            <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h4 className="text-lg font-bold text-white mb-4">{editingComment ? 'Edit Comment' : 'Add Comment'}</h4>
              <form onSubmit={handleAddComment} className="space-y-4">
                <textarea name="body" placeholder="Comment..." defaultValue={editingComment?.body || ''} className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500" required></textarea>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white border-none rounded-lg hover:bg-green-500 transition-colors font-medium text-sm">
                    {editingComment ? 'Update' : 'Add'} Comment
                  </button>
                  <button type="button" onClick={() => { setShowCommentForm(false); setEditingComment(null) }} className="px-4 py-2 bg-slate-600 text-white border-none rounded-lg hover:bg-slate-500 transition-colors font-medium text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-8">
            <button onClick={handleBack} className="px-6 py-2 bg-indigo-600 text-white border-none rounded-lg hover:bg-indigo-500 transition-colors font-medium text-sm">
              ← Back to Users
            </button>
            <button onClick={() => { setEditingUser(selectedUser); setShowUserForm(true) }} className="px-6 py-2 bg-blue-600 text-white border-none rounded-lg hover:bg-blue-500 transition-colors font-medium text-sm">
              Edit User
            </button>
            <button onClick={() => handleDeleteUser(selectedUser.id)} className="px-6 py-2 bg-red-600 text-white border-none rounded-lg hover:bg-red-500 transition-colors font-medium text-sm">
              Delete User
            </button>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-2xl p-8 mb-8 border border-slate-700">
            <h1 className="text-4xl font-bold text-white mb-2">{selectedUser.name}</h1>
            <p className="text-slate-400 text-lg">Email: {selectedUser.email}</p>
          </div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Posts ({posts.length})</h2>
            <button onClick={() => { setEditingPost(null); setShowPostForm(true) }} className="px-4 py-2 bg-green-600 text-white border-none rounded-lg hover:bg-green-500 transition-colors font-medium text-sm">
              + Add Post
            </button>
          </div>
          {posts.length === 0 ? (
            <p className="text-slate-400">No posts yet.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="bg-slate-800 rounded-xl shadow-lg p-6 mb-6 hover:shadow-xl transition-shadow border border-slate-700 cursor-pointer" onClick={() => setSelectedPost(post)}>
                <h3 className="text-xl font-bold text-white mb-3">{post.title}</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">{post.body}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                    Comments ({comments.filter(comment => comment.post_id === post.id).length})
                  </span>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setEditingPost(post); setShowPostForm(true) }} className="px-3 py-1 bg-blue-600 text-white border-none rounded text-sm hover:bg-blue-500 transition-colors">
                      Edit
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id) }} className="px-3 py-1 bg-red-600 text-white border-none rounded text-sm hover:bg-red-500 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          {showPostForm && (
            <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h4 className="text-lg font-bold text-white mb-4">{editingPost ? 'Edit Post' : 'Add Post'}</h4>
              <form onSubmit={handleAddPost} className="space-y-4">
                <input type="text" name="title" placeholder="Title..." defaultValue={editingPost?.title || ''} className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500" required />
                <textarea name="body" placeholder="Body..." defaultValue={editingPost?.body || ''} className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500" required></textarea>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white border-none rounded-lg hover:bg-green-500 transition-colors font-medium text-sm">
                    {editingPost ? 'Update' : 'Add'} Post
                  </button>
                  <button type="button" onClick={() => { setShowPostForm(false); setEditingPost(null) }} className="px-4 py-2 bg-slate-600 text-white border-none rounded-lg hover:bg-slate-500 transition-colors font-medium text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white">Users</h1>
            <p className="text-slate-400 mt-2">Select a user to view their posts and comments</p>
          </div>
          <button onClick={handleReset} className="px-4 py-2 bg-yellow-600 text-white border-none rounded-lg hover:bg-yellow-500 transition-colors font-medium text-sm">
            Reset DB
          </button>
        </div>
        <div className="mb-6">
          <button onClick={() => { setEditingUser(null); setShowUserForm(true) }} className="px-4 py-2 bg-green-600 text-white border-none rounded-lg hover:bg-green-500 transition-colors font-medium text-sm">
            + Add User
          </button>
        </div>
        {showUserForm && (
          <div className="mb-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">{editingUser ? 'Edit User' : 'Add User'}</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input type="text" name="name" placeholder="Name..." defaultValue={editingUser?.name || ''} className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500" required />
              <input type="email" name="email" placeholder="Email..." defaultValue={editingUser?.email || ''} className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500" required />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white border-none rounded-lg hover:bg-green-500 transition-colors font-medium text-sm">
                  {editingUser ? 'Update' : 'Add'} User
                </button>
                <button type="button" onClick={() => { setShowUserForm(false); setEditingUser(null) }} className="px-4 py-2 bg-slate-600 text-white border-none rounded-lg hover:bg-slate-500 transition-colors font-medium text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="grid gap-3">
          {users.map(user => (
            <div key={user.id} className="bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-700 hover:border-indigo-500">
              <button onClick={() => handleUserClick(user)} className="text-left w-full">
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{user.email}</p>
              </button>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditingUser(user); setShowUserForm(true) }} className="px-3 py-1 bg-blue-600 text-white border-none rounded text-sm hover:bg-blue-500 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDeleteUser(user.id)} className="px-3 py-1 bg-red-600 text-white border-none rounded text-sm hover:bg-red-500 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
