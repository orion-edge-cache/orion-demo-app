import React from 'react'
import type { User } from '../types'
import Button from '../ui/Button'

interface UserFormProps {
  editingUser: User | null
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

const UserForm: React.FC<UserFormProps> = ({ editingUser, onSubmit, onCancel }) => {
  return (
    <div className="mb-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-4">
        {editingUser ? 'Edit User' : 'Add User'}
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name..."
          defaultValue={editingUser?.name || ''}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email..."
          defaultValue={editingUser?.email || ''}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
          required
        />
        <div className="flex gap-2">
          <Button type="submit">
            {editingUser ? 'Update' : 'Add'} User
          </Button>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default UserForm
