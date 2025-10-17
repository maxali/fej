/**
 * UserList Component
 *
 * Demonstrates using useFejQuery to fetch and display data.
 */

import React from 'react';
import { useFejQuery } from '../hooks/useFejQuery.js';

export function UserList() {
  const { data: users, loading, error, refetch } = useFejQuery(
    '/users',
    {
      onSuccess: (data) => {
        console.log('Fetched users:', data.length);
      },
    }
  );

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error loading users: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="header">
        <h2>Users ({users?.length || 0})</h2>
        <button onClick={refetch}>Refresh</button>
      </div>

      <ul>
        {users?.map((user) => (
          <li key={user.id} className="user-item">
            <strong>{user.name}</strong>
            <span className="email">{user.email}</span>
            <span className="company">{user.company.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
