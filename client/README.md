# GraphQL Client

A modern React frontend for managing users, posts, and comments through a GraphQL API. Built with Vite, TypeScript, React 19, and Tailwind CSS. Supports multi-environment deployments with automatic environment detection.

## Features

- **User Management**: Create, read, update, and delete users
- **Post Management**: Create, read, update, and delete posts associated with users
- **Comment System**: Create, read, update, and delete comments on posts
- **Dark Theme UI**: Modern dark mode interface using Tailwind CSS
- **Real-time Updates**: Automatic data refresh after mutations
- **GraphQL Integration**: Direct GraphQL queries and mutations for efficient data fetching
- **TypeScript Support**: Full type safety throughout the application
- **Database Reset**: One-click database reset to initial state
- **Multi-Environment Support**: Automatic environment detection (localhost, fastly, cloudfront, stellate)

## Tech Stack

- **React 19.1.1** - UI framework
- **Vite 7.1.7** - Build tool and dev server
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.16** - Styling
- **Axios 1.13.1** - HTTP client for GraphQL requests
- **ESLint** - Code linting

## Project Structure

```
src/
├── config/
│   └── env.ts              # Multi-environment configuration & detection
├── App.tsx                 # Main app component with all views
├── App.css                 # Application styles
├── main.tsx                # Entry point
├── context/
│   └── AppContext.tsx      # Global state management using React Context
├── services/
│   └── api.ts              # GraphQL helper functions for all operations
├── types/
│   └── index.ts            # TypeScript type definitions
└── assets/
    └── react.svg           # React logo
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Running GraphQL server on the configured endpoint

### Installation

```bash
# Install dependencies
npm install
```

### Environment Configuration

The client automatically detects its deployment environment based on hostname. You can optionally override this in `.env.local`:

```env
# Leave empty for auto-detection based on hostname
# Options: localhost, fastly, cloudfront, stellate
# VITE_DEPLOYMENT_ENV=localhost
```

### Environment Detection Logic

The client determines its environment in this priority order:

1. **`VITE_DEPLOYMENT_ENV` variable** - Explicit override (for testing)
2. **Hostname detection** - Auto-detect based on current domain
3. **Default** - localhost (if on localhost or 127.0.0.1)

**Hostname Patterns:**
- **fastly** - Contains `vfa102.website`
- **cloudfront** - Contains `cloudfront` or `dixw5rir038vz`
- **stellate** - Contains `stellate` or `capstone.stellate.sh`
- **localhost** - Hostname is `localhost` or `127.0.0.1`

### Development

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:5173
# Console output:
# 🎨 Client running in localhost environment
```

### Build

```bash
# Build for production (works for all environments)
npm run build

# Preview production build locally
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint --fix
```

## Multi-Environment Setup

### Environment Configurations

The client includes hardcoded configurations for all environments. One build works for all deployments:

| Environment | GraphQL URL | Auto-Detection |
|------------|-------------|-----------------|
| localhost | `http://localhost:3002/graphql` | hostname === 'localhost' or '127.0.0.1' |
| fastly | `https://vfa102.website/graphql` | hostname includes 'vfa102.website' |
| cloudfront | `https://dixw5rir038vz.cloudfront.net/graphql` | hostname includes 'cloudfront' or 'dixw5rir038vz' |
| stellate | `https://capstone.stellate.sh/graphql` | hostname includes 'stellate' or 'capstone.stellate.sh' |

### Deployment

```bash
# Single build works for all environments
npm run build

# Deploy dist/ to all CDN/hosting platforms
# Environment detection happens automatically at runtime
```

### Testing Different Environments

To test a specific environment locally:

```bash
# Option 1: Edit .env.local
VITE_DEPLOYMENT_ENV=fastly npm run dev

# Option 2: Create .env file
echo "VITE_DEPLOYMENT_ENV=cloudfront" > .env
npm run dev
```

## Environment Detection Output

The client logs its detected environment on startup:

```
🎨 Client running in localhost environment
📡 GraphQL request in localhost environment
📡 GraphQL request in localhost environment
```

## API Integration

The client communicates with the GraphQL server through these main service layers:

### GraphQL Queries & Mutations

**Users:**
- `users` - Fetch all users
- `createUser(name, email)` - Create a new user
- `updateUser(id, name, email)` - Update user information
- `deleteUser(id)` - Delete a user

**Posts:**
- `posts` - Fetch all posts
- `createPost(title, user_id, body)` - Create a new post
- `updatePost(id, title, user_id, body)` - Update post content
- `deletePost(id)` - Delete a post

**Comments:**
- `comments` - Fetch all comments
- `createComment(post_id, user_id, body)` - Add a comment to a post
- `updateComment(id, post_id, user_id, body)` - Edit a comment
- `deleteComment(id)` - Delete a comment

### GraphQL Server

The client connects to the GraphQL server's endpoint based on detected environment:
- Development: `http://localhost:3002/graphql`
- Production: Environment-specific URL (fastly/cloudfront/stellate)

## Application Flow

### State Management

Global state is managed through React Context (`AppContext.tsx`):
- **Data**: users, posts, comments arrays
- **UI State**: selected user/post, form visibility, editing mode
- **Actions**: navigation, form handling, data mutations

### User Interface

1. **Users List View** - Main page showing all users
2. **User Detail View** - Shows selected user with their posts
3. **Post Detail View** - Displays post content with associated comments
4. **Forms** - Inline forms for creating/editing users, posts, and comments

### Data Flow

```
User Interaction → Handler Function → GraphQL Mutation/Query → API Response → State Update → UI Re-render
```

## Features in Detail

### User Management

- **View Users**: Click any user card to view their profile and posts
- **Create User**: Click "Add User" button and fill in the form
- **Edit User**: Click "Edit" on user profile to modify details
- **Delete User**: Click "Delete" to permanently remove a user

### Post Management

- **View Posts**: Posts appear when a user is selected
- **Create Post**: Click "+ Add Post" under a user's profile
- **Edit Post**: Click "Edit" on any post
- **Delete Post**: Click "Delete" to remove a post

### Comment System

- **View Comments**: Click on any post to view its comments
- **Add Comment**: Click "+ Add Comment" on post detail view
- **Edit Comment**: Click "Edit" on any comment
- **Delete Comment**: Click "Delete" to remove a comment

### Database Reset

Click the "Reset DB" button on the users list to restore the database to its initial state. This will:
- Clear all changes
- Return to the default dataset
- Clear the UI selection state

## Deployment

### Build and Deploy

```bash
# Build the application once
npm run build

# The build output will be in the dist/ directory
# This single build works for all environments
```

### Production Deployment

The project includes an rsync script for deployment to a remote server:

```bash
# Deploy to production (requires SSH access)
npm run deploy
```

This command will:
1. Build the application
2. Sync the dist/ folder to the remote server via rsync

Configure the remote deployment path in `package.json` if needed.

### CDN Deployment

Simply upload the `dist/` folder to your CDN/hosting platform. The client automatically detects which environment it's running in based on the domain.

## Development Workflow

### Code Quality

The project uses ESLint for code quality. All files are checked before commits (via pre-commit hooks if configured).

```bash
npm run lint
```

### Hot Module Replacement

Vite provides fast HMR (Hot Module Replacement) during development, allowing you to see changes instantly without full page reloads.

### Type Checking

TypeScript provides compile-time type checking. The build will fail if there are type errors:

```bash
npm run build
```

## Troubleshooting

### GraphQL Connection Issues

If the app can't connect to the GraphQL server:
1. Check which environment was detected (look at console output)
2. Verify the server is running on the correct port/domain
3. Ensure CORS is properly configured on the server
4. Check browser console for detailed error messages

### Wrong Environment Detected

If the wrong environment is being detected:
1. Check your hostname or domain
2. Verify it matches the detection patterns above
3. Override with `VITE_DEPLOYMENT_ENV` in `.env.local` for testing

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Ensure TypeScript version matches: `npm install`

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port.

## Contributing

When contributing to this project:
1. Follow the existing code style
2. Run `npm run lint` before committing
3. Ensure all types are properly defined
4. Test all features before pushing
5. Ensure it works with all environment configurations

## License

This project is part of a LaunchSchool Capstone project.
