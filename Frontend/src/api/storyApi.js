import client from './client'

export function generateStory(data) {
  return client.post('/api/story/generate', data)
}

export function generateCaption(highlight, type) {
  return client.post('/api/story/caption', { highlight, type })
}
