import client from './client'

export function getReviews(params = {}) {
  return client.get('/api/reviews', { params })
}

export function getReview(orderUid, accessToken) {
  return client.get(`/api/reviews/${orderUid}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function getReviewDetail(reviewId) {
  return client.get(`/api/reviews/detail/${reviewId}`)
}

export function deleteReview(reviewId, accessToken) {
  return client.delete(`/api/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createReview(data, images = [], accessToken) {
  const formData = new FormData()
  formData.append('orderUid', data.orderUid || '')
  formData.append('rating', data.rating || 0)
  formData.append('content', data.content || '')
  images.forEach((file, i) => {
    formData.append(`image_${i}`, file)
  })
  return client.post('/api/reviews', formData, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' },
  })
}
