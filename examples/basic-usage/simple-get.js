/**
 * Example 1: Simple GET Request
 *
 * Demonstrates the most basic usage of fej - making a simple GET request.
 */

import { createFej } from 'fej';

// Create a fej instance
const api = createFej();

async function fetchUsers() {
  try {
    // Make a simple GET request
    const response = await api.fej('https://jsonplaceholder.typicode.com/users');

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse JSON response
    const users = await response.json();

    console.log('✅ Fetched users successfully:');
    console.log(`Total users: ${users.length}`);
    console.log('\nFirst user:', users[0]);

    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
  }
}

// Run the example
fetchUsers();
