# React Hooks Integration

Example demonstrating how to integrate fej with React using custom hooks.

## Features

- `useFej` - Custom hook for making API calls
- `useFejQuery` - Hook with built-in loading and error states
- `useFejMutation` - Hook for mutations (POST, PUT, DELETE)
- TypeScript support
- Automatic error handling
- Request cancellation on unmount

## Setup

```bash
npm install
npm run dev
```

## What You'll Learn

- Creating custom React hooks for fej
- Managing loading and error states
- Request cancellation with useEffect cleanup
- Type-safe API calls with TypeScript
- Optimistic updates
- Cache invalidation patterns

## Structure

- `hooks/` - Custom hooks for fej integration
- `components/` - Example React components using the hooks
- `App.jsx` - Main application demonstrating all patterns
