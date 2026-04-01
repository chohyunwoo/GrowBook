import client from './client'

export function getCredits() {
  return client.get('/api/credits')
}
