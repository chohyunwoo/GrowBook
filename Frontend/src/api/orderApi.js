import client from './client'

export function estimateOrder(bookUid) {
  return client.post('/api/orders/estimate', { bookUid })
}

export function createOrder(bookUid, shipping, accessToken, title, type) {
  const config = accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : {}
  return client.post('/api/orders', { bookUid, shipping, title, type }, config)
}

export function getOrder(orderUid) {
  return client.get(`/api/orders/${orderUid}`)
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
