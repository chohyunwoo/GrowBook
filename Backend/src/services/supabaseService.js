const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * 주문 정보를 orders 테이블에 저장합니다.
 * @param {string} userId
 * @param {object} orderData
 * @param {string} orderData.orderUid
 * @param {string} orderData.albumTitle
 * @param {string} orderData.albumType
 * @param {string} orderData.status
 * @returns {Promise<object>}
 */
async function saveOrder(userId, orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_uid: orderData.orderUid,
      album_title: orderData.albumTitle,
      album_type: orderData.albumType,
      status: orderData.status,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 해당 유저의 주문 목록을 최신순으로 조회합니다.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
async function getOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('ordered_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * 주문 상태를 업데이트합니다.
 * @param {string} orderUid
 * @param {number} status
 * @returns {Promise<object>}
 */
async function updateOrderStatus(orderUid, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_uid', orderUid)
    .select()
    .single()

  if (error) throw error
  return data
}

module.exports = { supabase, saveOrder, getOrders, updateOrderStatus }
