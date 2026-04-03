import client from './client'

export function generateStory(data) {
  return client.post('/api/story/generate', data)
}
