import client from './client'

export function createShareLink(data) {
  return client.post('/api/share', data)
}

export function getSharedAlbum(shareCode) {
  return client.get(`/api/share/${shareCode}`)
}

export function getCommunityAlbums(params = {}) {
  return client.get('/api/share/community', { params })
}

export function toggleLike(shareCode, accessToken) {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : {}
  return client.post(`/api/share/${shareCode}/like`, {}, config)
}

export function makePublic(shareCode, accessToken) {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : {}
  return client.post(`/api/share/${shareCode}/public`, {}, config)
}
