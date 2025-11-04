import React from 'react'
import type { User } from '../types'
import { useUsers } from '../hooks/useUsers'
import { useAppContext } from '../context/AppContext'
import UserForm from '../ui/UserForm'
import Button from '../ui/Button'

const UserList: React.FC = () => {
  const { users, handleCreateUser, handleUpdateUser, handleDeleteUser } = useUsers()
  const {
    showUserForm,
    setShowUserForm,
    setEditingUser,
    editingUser,
    setSelectedUser,
    handleReset
  } = useAppContext()

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    if (editingUser) {
      await handleUpdateUser(editingUser.id, name, email)
      setEditingUser(null)
    } else {
      await handleCreateUser(name, email)
    }
    setShowUserForm(false)
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
  }

  const handleDeleteUserClick = (user: User) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      handleDeleteUser(user.id)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowUserForm(true)
  }

  const handleCancelUserForm = () => {
    setShowUserForm(false)
    setEditingUser(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white">Users</h1>
            <p className="text-slate-400 mt-2">Select a user to view their posts and comments</p>
          </div>
          <Button variant="warning" onClick={handleReset}>
            Reset DB
          </Button>
        </div>
        <div className="mb-6">
          <Button onClick={() => { setEditingUser(null); setShowUserForm(true); }}>
            + Add User
          </Button>
        </div>
        {showUserForm && (
          <UserForm
            editingUser={editingUser}
            onSubmit={handleAddUser}
            onCancel={handleCancelUserForm}
          />
        )}
        <div className="grid gap-3">
          {users.map(user => (
            <div
              key={user.id}
              className="bg-slate-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-700 hover:border-indigo-500"
            >
              <button
                onClick={() => handleUserClick(user)}
                className="text-left w-full"
              >
                <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                <p className="text-slate-400 text-sm mt-1">ID: {user.id}</p>
                <p className="text-slate-400 text-sm mt-1">{user.email}</p>
              </button>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditUser(user)
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteUserClick(user)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserList
