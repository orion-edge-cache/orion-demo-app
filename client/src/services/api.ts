import axios from 'axios'

const LOCALHOST = `${import.meta.env.VITE_LOCALHOST_URL}:${import.meta.env.VITE_AWS_PORT}`
const CACHE_URL = window.location || import.meta.env.VITE_AWS_ORIGIN_URL || LOCALHOST

console.log('api.ts: API BASE URL:', CACHE_URL)

// GraphQL helper
const graphqlRequest = async (query: string) => {
  console.log('GRAPHQL REQUEST')
  try {
    const response = await axios.post(`${CACHE_URL}/graphql`, { query })
    console.log(response.data)

    return response.data
  } catch (error) {
    console.error('GraphQL request failed:', error)
    throw error
  }
}

// User operations
export const fetchUsers = () =>
  graphqlRequest('query { users { id name email } }')

export const createUser = (name: string, email: string) =>
  graphqlRequest(`mutation { createUser(name: "${name}", email: "${email}") { id name email } }`)

export const updateUser = (id: string, name: string, email: string) =>
  graphqlRequest(`mutation { updateUser(id: "${id}", name: "${name}", email: "${email}") { id name email } }`)

export const deleteUser = (id: string) =>
  graphqlRequest(`mutation { deleteUser(id: "${id}") { id } }`)

// Post operations
export const fetchPosts = () =>
  graphqlRequest('query { posts { id title body user_id } }')

export const createPost = (title: string, body: string, user_id: string) =>
  graphqlRequest(`mutation { createPost(title: "${title}", user_id: "${user_id}", body: "${body}") { id title body user_id } }`)

export const updatePost = (id: string, title: string, body: string, user_id: string) =>
  graphqlRequest(`mutation { updatePost(id: "${id}", title: "${title}", user_id: "${user_id}", body: "${body}") { id title body user_id } }`)

export const deletePost = (id: string) =>
  graphqlRequest(`mutation { deletePost(id: "${id}") { id } }`)

// Comment operations
export const fetchComments = () =>
  graphqlRequest('query { comments { id body user_id post_id } }')

export const createComment = (post_id: string, user_id: string, body: string) =>
  graphqlRequest(`mutation { createComment(post_id: "${post_id}", user_id: "${user_id}", body: "${body}") { id body user_id post_id } }`)

export const updateComment = (id: string, post_id: string, user_id: string, body: string) =>
  graphqlRequest(`mutation { updateComment(id: "${id}", post_id: "${post_id}", user_id: "${user_id}", body: "${body}") { id body user_id post_id } }`)

export const deleteComment = (id: string) =>
  graphqlRequest(`mutation { deleteComment(id: "${id}") { id } }`)

// Reset database
export const resetDatabase = () =>
  graphqlRequest(`mutation { reset { users {id name email} posts {id title body} comments {id body }}}`)
