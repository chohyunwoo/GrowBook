import client from './client'

export function generateVideo(imageFiles, { title, subtitle, captions, story, bgmFile } = {}) {
  const formData = new FormData()
  imageFiles.forEach((file) => {
    if (file) {
      formData.append('images', file)
    }
  })
  if (title) formData.append('title', title)
  if (subtitle) formData.append('subtitle', subtitle)
  if (captions) formData.append('captions', JSON.stringify(captions))
  if (story) formData.append('story', story)
  if (bgmFile) formData.append('bgm', bgmFile)
  return client.post('/api/video/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  })
}
