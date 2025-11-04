import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import type { User, Post, Comment } from './types'

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    const getUsers = async () => {
      const res = await axios.post('http://localhost:3000/graphql', {
        query: 'query {users {id name email}}'
      })
      const { data } = res.data
      setUsers(data.users)
    }
    getUsers()
  }, [])

  const handleUserClick = async (user: User) => {
    setSelectedUser(user)
    // Fetch posts
    const postsRes = await axios.post('http://localhost:3000/graphql', {
      query: 'query {posts {id title body user_id}}'
    })
    const { data: postsData } = postsRes.data
    const userPosts = postsData.posts.filter((post: Post) => post.user_id === user.id)
    setPosts(userPosts)

    // Fetch comments
    const commentsRes = await axios.post('http://localhost:3000/graphql', {
      query: 'query {comments {id body user_id post_id}}'
    })
    const { data: commentsData } = commentsRes.data
    setComments(commentsData.comments)
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPosts([])
    setComments([])
  }

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={handleBack} className="mb-8 px-6 py-2 bg-indigo-600 text-white border-none rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm">
            ← Back to Users
          </button>
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{selectedUser.name}</h1>
            <p className="text-slate-500 text-lg">Email: {selectedUser.email}</p>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Posts</h2>
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-xl shadow-md p-6 mb-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 mb-3">{post.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{post.body}</p>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Comments ({comments.filter(comment => comment.post_id === post.id).length})</h4>
              {comments.filter(comment => comment.post_id === post.id).map(comment => (
                <div key={comment.id} className="bg-slate-50 p-4 mb-3 rounded-lg border border-slate-200">
                  <p className="text-slate-700">{comment.body}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-500 mt-2">Select a user to view their posts and comments</p>
        </div>
        <div className="grid gap-3">
          {users.map(user => (
            <button key={user.id} onClick={() => handleUserClick(user)} className="text-left bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:bg-indigo-50 transition-all border border-slate-200 hover:border-indigo-300">
              <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{user.email}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
