import client from './client'

export function generateVideo(imageFiles, { title, subtitle, captions, memos, story, bgmFile } = {}, accessToken) {
  const formData = new FormData()
  imageFiles.forEach((file) => {
    if (file) {
      formData.append('images', file)
    }
  })
  if (title) formData.append('title', title)
  if (subtitle) formData.append('subtitle', subtitle)
  if (captions) formData.append('captions', JSON.stringify(captions))
  if (memos) formData.append('memos', JSON.stringify(memos))
  if (story) formData.append('story', story)
  if (bgmFile) formData.append('bgm', bgmFile)
  const headers = { 'Content-Type': 'multipart/form-data' }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  return client.post('/api/video/generate', formData, {
    headers,
    responseType: 'blob',
  })
}
