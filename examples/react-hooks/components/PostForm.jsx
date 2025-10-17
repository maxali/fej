/**
 * PostForm Component
 *
 * Demonstrates using useFejMutation to create new posts.
 */

import React, { useState } from 'react';
import { useFejMutation } from '../hooks/useFejMutation.js';

export function PostForm({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { mutate, loading, error, isSuccess } = useFejMutation(
    '/posts',
    {
      method: 'POST',
      onSuccess: (data) => {
        console.log('Post created:', data);
        // Reset form
        setTitle('');
        setBody('');
        // Notify parent
        if (onPostCreated) {
          onPostCreated(data);
        }
      },
      onError: (error) => {
        console.error('Failed to create post:', error);
      },
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !body) {
      return;
    }

    try {
      await mutate({
        title,
        body,
        userId: 1,
      });
    } catch (err) {
      // Error is already handled by onError
    }
  };

  return (
    <div className="post-form">
      <h2>Create New Post</h2>

      {isSuccess && (
        <div className="success-message">Post created successfully!</div>
      )}

      {error && (
        <div className="error-message">
          Failed to create post: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="Enter post title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="body">Body:</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={loading}
            placeholder="Enter post content"
            rows={5}
            required
          />
        </div>

        <button type="submit" disabled={loading || !title || !body}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
