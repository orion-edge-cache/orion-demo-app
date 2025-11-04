import React from 'react'
import type { Post } from '../types'
import Button from '../ui/Button'

interface PostFormProps {
  editingPost: Post | null
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

const PostForm: React.FC<PostFormProps> = ({ editingPost, onSubmit, onCancel }) => {
  return (
    <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
      <h4 className="text-lg font-bold text-white mb-4">
        {editingPost ? 'Edit Post' : 'Add Post'}
      </h4>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Title..."
          defaultValue={editingPost?.title || ''}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
          required
        />
        <textarea
          name="body"
          placeholder="Body..."
          defaultValue={editingPost?.body || ''}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
          required
        />
        <div className="flex gap-2">
          <Button type="submit">
            {editingPost ? 'Update' : 'Add'} Post
          </Button>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PostForm
