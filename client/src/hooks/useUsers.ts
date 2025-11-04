import { useState, useEffect } from 'react'
import type { User } from '../types'
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser
} from '../services/api'

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUsers()
      console.log(data.users)
      setUsers(data.users)
    } catch (err) {
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (name: string, email: string) => {
    await createUser(name, email)
    await loadUsers()
  }

  const handleUpdateUser = async (id: string, name: string, email: string) => {
    await updateUser(id, name, email)
    await loadUsers()
  }

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id)
    await loadUsers()
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return {
    users,
    loading,
    error,
    loadUsers,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser
  }
}
