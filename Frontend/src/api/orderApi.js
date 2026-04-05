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

export function cancelOrder(orderUid, cancelReason) {
  return client.post(`/api/orders/${orderUid}/cancel`, { cancelReason })
}
