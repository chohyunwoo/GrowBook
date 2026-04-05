import client from './client'

export function getAdminStats(accessToken) {
  return client.get('/api/admin/stats', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getAdminDashboard(accessToken) {
  return client.get('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getAdminOrders(accessToken, params = {}) {
  return client.get('/api/admin/orders', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  })
}

export function getAdminOrderDetail(accessToken, orderUid) {
  return client.get(`/api/admin/orders/${orderUid}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getAdminUsers(accessToken) {
  return client.get('/api/admin/users', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getAdminCommunityPosts(accessToken, params = {}) {
  return client.get('/api/admin/community', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  })
}

export function deleteAdminPost(accessToken, postId) {
  return client.delete(`/api/admin/community/${postId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getAdminReviews(accessToken, params = {}) {
  return client.get('/api/admin/reviews', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  })
}

export function deleteAdminReview(accessToken, reviewId) {
  return client.delete(`/api/admin/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
