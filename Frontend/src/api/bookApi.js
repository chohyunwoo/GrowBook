import client from './client'

export function createBook(data) {
  return client.post('/api/books/create', data)
}

export function uploadCoverImage(bookUid, file) {
  const formData = new FormData()
  formData.append('image', file)
  return client.post(`/api/books/${bookUid}/upload-cover-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
