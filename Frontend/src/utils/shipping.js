const LEGACY_KEYS = ['shipping_addresses', 'shippingAddresses']

export function migrateShippingAddresses(userId) {
  if (!userId) return
  try {
    const newKey = `shippingAddresses_${userId}`
    if (localStorage.getItem(newKey)) return
    for (const oldKey of LEGACY_KEYS) {
      const oldData = localStorage.getItem(oldKey)
      if (oldData) {
        localStorage.setItem(newKey, oldData)
        return
      }
    }
  } catch { /* ignore */ }
}

export function openPostcodeSearch(onComplete) {
  new window.daum.Postcode({
    oncomplete: (data) => {
      onComplete({
        postalCode: data.zonecode,
        address1: data.roadAddress || data.jibunAddress,
      })
    },
  }).open()
}

export function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

const PHONE_REGEX = /^010-\d{4}-\d{4}$/
const POSTAL_REGEX = /^\d{5}$/

export function validateShippingField(field, value) {
  switch (field) {
    case 'recipient_name':
    case 'recipientName':
      if (!value.trim()) return '수령인 이름을 입력해주세요'
      if (value.length > 100) return '수령인 이름은 100자 이하로 입력해주세요'
      return ''
    case 'recipient_phone':
    case 'recipientPhone':
      if (!value.trim()) return '연락처를 입력해주세요'
      if (!PHONE_REGEX.test(value)) return '010-0000-0000 형식으로 입력해주세요'
      return ''
    case 'postal_code':
    case 'postalCode':
      if (!value.trim()) return ''
      if (!POSTAL_REGEX.test(value)) return '우편번호는 5자리 숫자만 입력해주세요'
      return ''
    case 'address1':
      if (!value.trim()) return '주소를 입력해주세요'
      if (value.length > 200) return '주소는 200자 이하로 입력해주세요'
      return ''
    default:
      return ''
  }
}

export function validateShippingForm(form, fieldMap) {
  const errors = {}
  const nameKey = fieldMap?.name || 'recipient_name'
  const phoneKey = fieldMap?.phone || 'recipient_phone'
  const postalKey = fieldMap?.postal || 'postal_code'
  const addressKey = fieldMap?.address || 'address1'

  errors[nameKey] = validateShippingField(nameKey, form[nameKey] || '')
  errors[phoneKey] = validateShippingField(phoneKey, form[phoneKey] || '')
  errors[postalKey] = validateShippingField(postalKey, form[postalKey] || '')
  errors[addressKey] = validateShippingField(addressKey, form[addressKey] || '')

  const isValid = !errors[nameKey] && !errors[phoneKey] && !errors[postalKey] && !errors[addressKey]
  return { errors, isValid }
}
