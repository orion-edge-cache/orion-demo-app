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
      <div className="p-5 font-sans">
        <button onClick={handleBack} className="mb-5 px-4 py-2 bg-blue-500 text-white border-none rounded">
          Back to Users
        </button>
        <h1 className="text-2xl font-bold">{selectedUser.name}</h1>
        <p className="text-gray-600">Email: {selectedUser.email}</p>
        <h2 className="text-xl font-semibold mt-4">Posts</h2>
        {posts.map(post => (
          <div key={post.id} className="border border-gray-300 p-4 mb-4 rounded">
            <h3 className="text-lg font-medium">{post.title}</h3>
            <p className="text-gray-700">{post.body}</p>
            <h4 className="text-md font-medium mt-2">Comments</h4>
            {comments.filter(comment => comment.post_id === post.id).map(comment => (
              <div key={comment.id} className="bg-gray-800 p-2 mb-2 rounded">
                {comment.body}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-5 font-sans">
      <h1 className="text-2xl font-bold mb-5">Users</h1>
      <ul className="list-none p-0">
        {users.map(user => (
          <li key={user.id} onClick={() => handleUserClick(user)} className="cursor-pointer p-2 border border-gray-300 mb-1 rounded bg-gray-700 hover:bg-gray-200">
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
