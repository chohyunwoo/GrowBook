import client from './client'

export function getCredits(accessToken) {
  const headers = {}
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  return client.get('/api/credits', { headers })
}
