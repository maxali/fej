/**
 * PostList Component
 *
 * Demonstrates pagination, filtering, and conditional fetching.
 */

import React, { useState } from 'react';
import { useFejQuery } from '../hooks/useFejQuery.js';

export function PostList() {
  const [userId, setUserId] = useState('1');
  const [enabled, setEnabled] = useState(true);

  const { data: posts, loading, error, refetch } = useFejQuery(
    `/posts?userId=${userId}`,
    {
      enabled,
      deps: [userId], // Refetch when userId changes
      onSuccess: (data) => {
        console.log(`Fetched ${data.length} posts for user ${userId}`);
      },
    }
  );

  return (
    <div className="post-list">
      <div className="controls">
        <h2>Posts</h2>

        <div className="filters">
          <label>
            User ID:
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
            >
              {[1, 2, 3, 4, 5].map((id) => (
                <option key={id} value={id}>
                  User {id}
                </option>
              ))}
            </select>
          </label>

          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Auto-fetch
          </label>

          <button onClick={refetch} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {!enabled && (
        <div className="info-message">
          Auto-fetch is disabled. Click Refresh to load posts.
        </div>
      )}

      {loading && <div className="loading">Loading posts...</div>}

      {error && (
        <div className="error">
          <p>Error: {error.message}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      )}

      {posts && (
        <>
          <p className="post-count">{posts.length} posts found</p>
          <ul>
            {posts.map((post) => (
              <li key={post.id} className="post-item">
                <h3>{post.title}</h3>
                <p>{post.body}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
