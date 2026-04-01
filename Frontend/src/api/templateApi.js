import client from './client'

export function getTemplates(kind) {
  return client.get('/api/templates', { params: { kind } })
}
