/**
 * Example 2: POST Request with JSON
 *
 * Demonstrates sending JSON data in a POST request.
 */

import { createFej } from 'fej';

// Create a fej instance
const api = createFej();

async function createPost() {
  try {
    const newPost = {
      title: 'My First Post',
      body: 'This is the content of my post.',
      userId: 1,
    };

    // Make a POST request with JSON body
    const response = await api.fej('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPost),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const createdPost = await response.json();

    console.log('✅ Post created successfully:');
    console.log(createdPost);

    return createdPost;
  } catch (error) {
    console.error('❌ Error creating post:', error.message);
  }
}

// Run the example
createPost();
