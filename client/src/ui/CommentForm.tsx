import React from 'react'
import type { Comment } from '../types'
import Button from '../ui/Button'

interface CommentFormProps {
  editingComment: Comment | null
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

const CommentForm: React.FC<CommentFormProps> = ({ editingComment, onSubmit, onCancel }) => {
  return (
    <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
      <h4 className="text-lg font-bold text-white mb-4">
        {editingComment ? 'Edit Comment' : 'Add Comment'}
      </h4>
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          name="body"
          placeholder="Comment..."
          defaultValue={editingComment?.body || ''}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500"
          required
        />
        <div className="flex gap-2">
          <Button type="submit">
            {editingComment ? 'Update' : 'Add'} Comment
          </Button>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CommentForm
