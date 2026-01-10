/**
 * GraphQL resolvers for the demo app
 */

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
  body: string;
  user_id: string;
  created_at?: string;
}

interface Comment {
  id: string;
  body: string;
  user_id: string;
  post_id: string;
}

interface Database {
  users: User[];
  posts: Post[];
  comments: Comment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// File Path Helpers
// ─────────────────────────────────────────────────────────────────────────────

const isLambda = (): boolean => {
  return process.env.DEPLOYMENT_ENV === 'aws-lambda';
};

const getDbPath = (): string => {
  if (isLambda()) {
    return '/tmp/db.json';
  }
  return path.join(__dirname, '../db/json/db.json');
};

const getResetPath = (): string => {
  // Reset file is always in the packaged location
  return path.join(__dirname, '../db/json/db-reset.json');
};

const getPackagedDbPath = (): string => {
  // Original db.json packaged with Lambda
  return path.join(__dirname, '../db/json/db.json');
};

// ─────────────────────────────────────────────────────────────────────────────
// Database Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensure db.json exists in /tmp for Lambda (cold start handling)
 */
const ensureDbExists = (): void => {
  if (isLambda()) {
    const tmpPath = getDbPath();
    if (!existsSync(tmpPath)) {
      // Cold start: copy packaged db.json to /tmp
      const sourcePath = getPackagedDbPath();
      console.log(`Cold start: copying db.json from ${sourcePath} to ${tmpPath}`);
      copyFileSync(sourcePath, tmpPath);
      console.log('Cold start: db.json copied to /tmp');
    }
  }
};

/**
 * Read the database from disk
 */
const readDb = (): Database => {
  ensureDbExists();
  const dbPath = getDbPath();
  try {
    const content = readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading database:', error);
    throw new Error('Failed to read database');
  }
};

/**
 * Write the database to disk
 */
const writeDb = (data: Database): void => {
  const dbPath = getDbPath();
  try {
    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Database written successfully');
  } catch (error) {
    console.error('Error writing database:', error);
    throw new Error('Failed to write database');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Resolvers
// ─────────────────────────────────────────────────────────────────────────────

export const resolvers = {
  Query: {
    // Get all users
    users: () => {
      const db = readDb();
      return db.users;
    },

    // Get all posts
    posts: () => {
      const db = readDb();
      return db.posts;
    },

    // Get all comments
    comments: () => {
      const db = readDb();
      return db.comments;
    },

    // Get user by ID
    user: (_parent: unknown, { id }: { id: string }) => {
      const db = readDb();
      const user = db.users.find((u) => u.id === id);
      return user || null;
    },

    // Get post by ID
    post: (_parent: unknown, { id }: { id: string }) => {
      const db = readDb();
      const post = db.posts.find((p) => p.id === id);
      return post || null;
    },

    // Get comment by ID
    comment: (_parent: unknown, { id }: { id: string }) => {
      const db = readDb();
      const comment = db.comments.find((c) => c.id === id);
      return comment || null;
    },

    // Get posts by user ID (manual filtering)
    postsByUser: (_parent: unknown, { user_id }: { user_id: string }) => {
      const db = readDb();
      return db.posts.filter((p) => p.user_id === user_id);
    },
  },

  User: {
    // Resolve posts for a user (manual filtering)
    posts: (parent: User) => {
      const db = readDb();
      return db.posts.filter((p) => p.user_id === parent.id);
    },
  },

  Mutation: {
    // Create a new user
    createUser: (_parent: unknown, { name, email }: { name: string; email: string }) => {
      const db = readDb();
      // Generate new ID (max existing ID + 1)
      const maxId = db.users.reduce((max, u) => Math.max(max, parseInt(u.id, 10)), 0);
      const id = String(maxId + 1);
      const newUser: User = { id, name, email };
      db.users.push(newUser);
      writeDb(db);
      console.log(`Created user: ${JSON.stringify(newUser)}`);
      return newUser;
    },

    // Create a new post
    createPost: (
      _parent: unknown,
      { title, user_id, body }: { title: string; user_id: string; body: string }
    ) => {
      const db = readDb();
      // Generate new ID
      const maxId = db.posts.reduce((max, p) => Math.max(max, parseInt(p.id, 10)), 0);
      const id = String(maxId + 1);
      const newPost: Post = {
        id,
        title,
        body,
        user_id,
        created_at: new Date().toISOString(),
      };
      db.posts.push(newPost);
      writeDb(db);
      console.log(`Created post: ${JSON.stringify(newPost)}`);
      return newPost;
    },

    // Create a new comment
    createComment: (
      _parent: unknown,
      { post_id, user_id, body }: { post_id: string; user_id: string; body: string }
    ) => {
      const db = readDb();
      // Generate new ID
      const maxId = db.comments.reduce((max, c) => Math.max(max, parseInt(c.id, 10)), 0);
      const id = String(maxId + 1);
      const newComment: Comment = { id, body, user_id, post_id };
      db.comments.push(newComment);
      writeDb(db);
      console.log(`Created comment: ${JSON.stringify(newComment)}`);
      return newComment;
    },

    // Update an existing user
    updateUser: (_parent: unknown, { id, name, email }: { id: string; name: string; email: string }) => {
      const db = readDb();
      const userIndex = db.users.findIndex((u) => u.id === id);
      if (userIndex === -1) {
        console.log(`User not found: ${id}`);
        return null;
      }
      db.users[userIndex] = { id, name, email };
      writeDb(db);
      console.log(`Updated user: ${JSON.stringify(db.users[userIndex])}`);
      return db.users[userIndex];
    },

    // Update an existing post
    updatePost: (
      _parent: unknown,
      { id, title, user_id, body }: { id: string; title: string; user_id: string; body: string }
    ) => {
      const db = readDb();
      const postIndex = db.posts.findIndex((p) => p.id === id);
      if (postIndex === -1) {
        console.log(`Post not found: ${id}`);
        return null;
      }
      // Preserve created_at if it exists
      const existingPost = db.posts[postIndex];
      db.posts[postIndex] = {
        id,
        title,
        body,
        user_id,
        created_at: existingPost?.created_at || new Date().toISOString(),
      };
      writeDb(db);
      console.log(`Updated post: ${JSON.stringify(db.posts[postIndex])}`);
      return db.posts[postIndex];
    },

    // Update an existing comment
    updateComment: (
      _parent: unknown,
      { id, post_id, user_id, body }: { id: string; post_id: string; user_id: string; body: string }
    ) => {
      const db = readDb();
      const commentIndex = db.comments.findIndex((c) => c.id === id);
      if (commentIndex === -1) {
        console.log(`Comment not found: ${id}`);
        return null;
      }
      db.comments[commentIndex] = { id, body, user_id, post_id };
      writeDb(db);
      console.log(`Updated comment: ${JSON.stringify(db.comments[commentIndex])}`);
      return db.comments[commentIndex];
    },

    // Delete a user
    deleteUser: (_parent: unknown, { id }: { id: string }) => {
      const db = readDb();
      const userIndex = db.users.findIndex((u) => u.id === id);
      if (userIndex === -1) {
        console.log(`User not found: ${id}`);
        return null;
      }
      const [deletedUser] = db.users.splice(userIndex, 1);
      writeDb(db);
      console.log(`Deleted user: ${JSON.stringify(deletedUser)}`);
      return deletedUser;
    },

    // Delete a post
    deletePost: (_parent: unknown, { id }: { id: string }) => {
      const db = readDb();
      const postIndex = db.posts.findIndex((p) => p.id === id);
      if (postIndex === -1) {
        console.log(`Post not found: ${id}`);
        return null;
      }
      const [deletedPost] = db.posts.splice(postIndex, 1);
      writeDb(db);
      console.log(`Deleted post: ${JSON.stringify(deletedPost)}`);
      return deletedPost;
    },

    // Delete a comment
    deleteComment: (_parent: unknown, { id }: { id: string }) => {
      const db = readDb();
      const commentIndex = db.comments.findIndex((c) => c.id === id);
      if (commentIndex === -1) {
        console.log(`Comment not found: ${id}`);
        return null;
      }
      const [deletedComment] = db.comments.splice(commentIndex, 1);
      writeDb(db);
      console.log(`Deleted comment: ${JSON.stringify(deletedComment)}`);
      return deletedComment;
    },

    // Reset database to initial state
    reset: () => {
      try {
        const resetPath = getResetPath();
        const dbPath = getDbPath();
        console.log(`Resetting database from ${resetPath} to ${dbPath}`);
        copyFileSync(resetPath, dbPath);
        const db = readDb();
        console.log('Database reset successfully');
        return {
          users: db.users,
          posts: db.posts,
          comments: db.comments,
        };
      } catch (error) {
        console.error('Failed to reset database:', error);
        return null;
      }
    },
  },
};
