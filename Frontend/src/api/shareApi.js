import client from './client'

export function createShareLink(data) {
  return client.post('/api/share', data)
}

export function getSharedAlbum(shareCode) {
  return client.get(`/api/share/${shareCode}`)
}
