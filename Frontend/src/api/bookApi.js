import client from './client'

export function createBook(data) {
  return client.post('/api/books/create', data)
}

export function createBookWithImages(bookData, highlightImages, coverImageFile, accessToken) {
  const formData = new FormData()
  formData.append('data', JSON.stringify(bookData))
  if (coverImageFile) {
    formData.append('cover_image', coverImageFile)
  }
  highlightImages.forEach((file, i) => {
    if (file) {
      formData.append(`highlight_image_${i}`, file)
    }
  })
  const headers = { 'Content-Type': 'multipart/form-data' }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  return client.post('/api/books/create', formData, { headers })
}

export function uploadCoverImage(bookUid, file) {
  const formData = new FormData()
  formData.append('image', file)
  return client.post(`/api/books/${bookUid}/upload-cover-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
