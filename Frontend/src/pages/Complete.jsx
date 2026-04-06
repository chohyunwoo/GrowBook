import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { getOrder, cancelOrder } from '../api/orderApi'
import { supabase } from '../lib/supabase'
import { createShareLink } from '../api/shareApi'

function getDeliveryDate(t) {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return t('deliveryDate', {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  })
}

export default function Complete() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelled, setCancelled] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  const [copied, setCopied] = useState(false)

  const fetchOrder = async () => {
    if (!state.orderUid) return
    try {
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      const res = await getOrder(state.orderUid, accessToken)
      setOrder(res.data?.data || res.data)
      setError(null)
    } catch {
      setError(t('errors.orderLoadFailed'))
    }
  }

  useEffect(() => {
    if (!state.orderUid) {
      setLoading(false)
      return
    }
    const init = async () => {
      await fetchOrder()
      setLoading(false)
    }
    init()
  }, [state.orderUid])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchOrder()
    setRefreshing(false)
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      await cancelOrder(state.orderUid, cancelReason.trim() || t('complete.cancelReasonPlaceholder'), accessToken)
      setCancelModal(false)
      setCancelled(true)
      setTimeout(() => {
        dispatch({ type: 'RESET' })
        navigate('/')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('errors.cancelFailed'))
      setCancelModal(false)
    }
    setCancelling(false)
  }

  const handleShare = async () => {
    setSharing(true)
    setCopied(false)
    try {
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      const story = state.generatedStory || {}
      const res = await createShareLink({
        orderUid: state.orderUid,
        title: story.title,
        subtitle: story.subtitle,
        story: story.story,
        type: state.type,
      }, accessToken)
      const code = res.data?.data?.shareCode || res.data?.shareCode || res.data?.code
      const link = `${window.location.origin}/share/${code}`
      setShareLink(link)
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      setError(t('errors.generic'))
    }
    setSharing(false)
  }

  const handleCopyLink = async () => {
    if (!shareLink) return
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const handleGoHome = () => {
    dispatch({ type: 'RESET' })
    navigate('/')
  }

  const statusCode = order?.status ?? order?.orderStatus ?? 20
  const statusText = t(`orderStatus.${statusCode}`, t('checking'))
  const deliveryDate = getDeliveryDate(t)
  const canCancel = statusCode === 20 || statusCode === 25

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{t('complete.cancelledTitle')}</h1>
          <p className="text-sm text-[#6B6B6B]">{t('complete.cancelledMessage')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-md w-full">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{t('complete.title')}</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">{t('complete.subtitle')}</p>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {/* Order Info */}
        <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-6 text-left">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{t('complete.orderNumber')}</p>
              <p className="text-sm text-[#1A1A1A] font-mono font-semibold">{state.orderUid || '-'}</p>
            </div>
            <div className="border-t border-[#F0F0EE]" />
            <div>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{t('complete.estimatedDelivery')}</p>
              <p className="text-sm text-[#1A1A1A] font-semibold">{deliveryDate}</p>
            </div>
            <div className="border-t border-[#F0F0EE]" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">{t('complete.orderStatusLabel')}</p>
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {statusText}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-200 ${
                  refreshing ? 'text-[#ACACAC] cursor-not-allowed' : 'text-primary hover:text-primary-dark cursor-pointer'
                }`}
              >
                {refreshing ? (
                  <span className="w-3.5 h-3.5 border-2 border-[#ACACAC] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                  </svg>
                )}
                <span>{t('complete.refresh')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full max-w-xs mx-auto bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
          >
            {t('complete.goHome')}
          </button>

          {!shareLink ? (
            <button
              onClick={handleShare}
              disabled={sharing}
              className={`w-full max-w-xs mx-auto border text-sm font-medium py-3 px-8 rounded-xl transition-colors duration-200 ${
                sharing
                  ? 'border-[#D1D1CF] text-[#ACACAC] cursor-not-allowed'
                  : 'border-primary text-primary hover:bg-primary/5 cursor-pointer'
              }`}
            >
              {sharing ? t('order.processing', '처리 중...') : '포토북 공유하기 \uD83D\uDD17'}
            </button>
          ) : (
            <>
              <div className="w-full max-w-xs mx-auto">
                <p className="text-xs text-primary font-medium mb-2">링크가 생성되었어요! (30일간 유효)</p>
                <div className="flex items-center gap-2 bg-[#F7F7F5] rounded-lg p-2.5 border border-[#E5E5E3]">
                  <p className="flex-1 text-xs text-[#6B6B6B] truncate font-mono">{shareLink}</p>
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 text-xs font-medium text-primary hover:text-primary-dark cursor-pointer transition-colors duration-200"
                  >
                    {copied ? '복사됨 \u2705' : '복사'}
                  </button>
                </div>
              </div>
            </>
          )}

          {canCancel && (
            <button
              onClick={() => setCancelModal(true)}
              className="w-full max-w-xs mx-auto border border-red-300 text-red-500 hover:bg-red-50 text-sm font-medium py-3 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              {t('complete.cancelOrder')}
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-2">{t('complete.cancelConfirm')}</h3>
            <p className="text-sm text-[#6B6B6B] mb-4">{t('complete.cancelMessage')}</p>
            <div className="mb-6">
              <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('complete.cancelReason')}</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('complete.cancelReasonPlaceholder')}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModal(false)}
                disabled={cancelling}
                className="flex-1 border border-[#E5E5E3] text-[#6B6B6B] text-sm font-medium py-3 rounded-xl hover:bg-[#F7F7F5] transition-colors duration-200 cursor-pointer"
              >
                {t('buttons.goBack')}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={`flex-1 text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 ${
                  cancelling ? 'bg-[#D1D1CF] cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 cursor-pointer'
                }`}
              >
                {cancelling ? t('complete.cancelling') : t('complete.cancelOrder')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
