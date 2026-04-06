import client from './client'

export function estimateOrder(bookUid, quantity = 1) {
  return client.post('/api/orders/estimate', { bookUid, quantity })
}

export function createOrder(bookUid, shipping, accessToken, title, type, quantity = 1) {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : {}
  return client.post('/api/orders', { bookUid, shipping, title, type, quantity }, config)
}

export function getOrder(orderUid, accessToken) {
  const headers = {}
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  return client.get(`/api/orders/${orderUid}`, { headers })
}

export function getMyOrders(accessToken, params = {}) {
  return client.get('/api/orders/my', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  })
}

export function cancelOrder(orderUid, cancelReason, accessToken) {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : {}
  return client.post(`/api/orders/${orderUid}/cancel`, { cancelReason }, config)
}

export function updateShipping(orderUid, shipping) {
  return client.patch(`/api/orders/${orderUid}/shipping`, shipping)
}
