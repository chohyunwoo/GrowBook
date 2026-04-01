import client from './client'

export function generateStory(name, birthYear, albumYear, highlights) {
  return client.post('/api/story/generate', { name, birthYear, albumYear, highlights })
}
