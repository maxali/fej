/**
 * App Component
 *
 * Main application demonstrating all fej React hooks.
 */

import React, { useState } from 'react';
import { UserList } from './components/UserList.jsx';
import { PostForm } from './components/PostForm.jsx';
import { PostList } from './components/PostList.jsx';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState('users');
  const [createdPosts, setCreatedPosts] = useState([]);

  const handlePostCreated = (post) => {
    setCreatedPosts((prev) => [post, ...prev]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fej React Hooks Example</h1>
        <p>Demonstrating integration between fej and React</p>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create Post
        </button>
      </nav>

      <main className="content">
        {activeTab === 'users' && <UserList />}

        {activeTab === 'posts' && <PostList />}

        {activeTab === 'create' && (
          <>
            <PostForm onPostCreated={handlePostCreated} />

            {createdPosts.length > 0 && (
              <div className="created-posts">
                <h3>Recently Created Posts ({createdPosts.length})</h3>
                <ul>
                  {createdPosts.map((post, index) => (
                    <li key={index} className="created-post">
                      <strong>{post.title}</strong>
                      <p>{post.body}</p>
                      <small>ID: {post.id}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Using <a href="https://github.com/maxali/fej">fej</a> for HTTP requests
        </p>
      </footer>
    </div>
  );
}
