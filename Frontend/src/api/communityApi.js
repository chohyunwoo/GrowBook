import client from './client'

function authConfig(accessToken) {
  return accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}
}

// Posts
export function getPosts(params = {}) {
  return client.get('/api/community', { params })
}

export function getPost(postId) {
  return client.get(`/api/community/${postId}`)
}

export function createPost(data, images = [], accessToken) {
  const formData = new FormData()
  formData.append('title', data.title || '')
  formData.append('content', data.content || '')
  formData.append('type', data.type || '')
  if (data.rating) formData.append('rating', data.rating)
  images.forEach((file, i) => {
    formData.append(`image_${i}`, file)
  })
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' } }
    : { headers: { 'Content-Type': 'multipart/form-data' } }
  return client.post('/api/community', formData, config)
}

export function deletePost(postId, accessToken) {
  return client.delete(`/api/community/${postId}`, authConfig(accessToken))
}

// Likes
export function togglePostLike(postId, accessToken) {
  return client.post(`/api/community/${postId}/like`, {}, authConfig(accessToken))
}

// Comments
export function getComments(postId) {
  return client.get(`/api/community/${postId}/comments`)
}

export function createComment(postId, data, accessToken) {
  return client.post(`/api/community/${postId}/comments`, data, authConfig(accessToken))
}

export function deleteComment(postId, commentId, accessToken) {
  return client.delete(`/api/community/${postId}/comments/${commentId}`, authConfig(accessToken))
}
