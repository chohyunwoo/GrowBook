import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { getSample } from '../data/sampleStories'

const CURRENT_YEAR = String(new Date().getFullYear())

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200'

export default function InputForm() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()

  // Travel/Memory: dynamic moments
  const [moments, setMoments] = useState(() => {
    if (state.type === 'travel' || state.type === 'memory') {
      const filled = state.highlights.filter((h) => h.content)
      return filled.length > 0 ? filled : [{ month: 1, content: '' }]
    }
    return []
  })

  const albumType = state.type || 'child'

  // Initialize albumYear default
  useEffect(() => {
    if (!state.albumYear) {
      dispatch({ type: 'SET_ALBUM_YEAR', payload: CURRENT_YEAR })
    }
  }, [])

  const fillSample = () => {
    const sample = getSample(albumType, i18n.language)
    if (albumType === 'travel' || albumType === 'memory') {
      setMoments(sample.highlights.filter((h) => h.content).map((h, i) => ({ month: i + 1, content: h.content })))
    }
    dispatch({ type: 'SET_NAME', payload: sample.name })
    dispatch({ type: 'SET_BIRTH_YEAR', payload: sample.birthYear })
    dispatch({ type: 'SET_ALBUM_YEAR', payload: sample.albumYear })
    dispatch({ type: 'SET_HIGHLIGHTS', payload: sample.highlights })
  }

  const resetForm = () => {
    dispatch({ type: 'SET_NAME', payload: '' })
    dispatch({ type: 'SET_BIRTH_YEAR', payload: '' })
    dispatch({ type: 'SET_ALBUM_YEAR', payload: CURRENT_YEAR })
    dispatch({ type: 'SET_HIGHLIGHTS', payload: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, content: '' })) })
    if (albumType === 'travel' || albumType === 'memory') {
      setMoments([{ month: 1, content: '' }])
    }
  }

  // Sync moments → highlights for travel/memory
  const syncMoments = (updated) => {
    setMoments(updated)
    const highlights = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      content: updated[i]?.content || '',
    }))
    dispatch({ type: 'SET_HIGHLIGHTS', payload: highlights })
  }

  const addMoment = () => {
    if (moments.length >= 10) return
    syncMoments([...moments, { month: moments.length + 1, content: '' }])
  }

  const removeMoment = (index) => {
    if (moments.length <= 1) return
    const updated = moments.filter((_, i) => i !== index).map((m, i) => ({ ...m, month: i + 1 }))
    syncMoments(updated)
  }

  const updateMoment = (index, field, value) => {
    const updated = moments.map((m, i) => i === index ? { ...m, [field]: value } : m)
    syncMoments(updated)
  }

  const handleNext = () => {
    if (!isValid) return
    // Sync moments one final time for travel/memory
    if (albumType === 'travel' || albumType === 'memory') {
      syncMoments(moments)
    }
    navigate('/preview')
  }

  // Validation
  let isValid = false
  if (albumType === 'child' || albumType === 'pet') {
    isValid = !!(state.name && state.birthYear && state.albumYear)
  } else if (albumType === 'travel') {
    isValid = !!(state.name && state.birthYear && moments.some((m) => m.content.trim()))
  } else if (albumType === 'memory') {
    isValid = !!(state.name && moments.some((m) => m.content.trim()))
  }

  const typeLabels = {
    child: { title: t('inputForm.childTitle'), nameLabel: t('inputForm.childNameLabel'), namePlaceholder: t('inputForm.childNamePlaceholder'), subtitle: t('inputForm.childSubtitle') },
    pet: { title: t('inputForm.petTitle'), nameLabel: t('inputForm.petNameLabel'), namePlaceholder: t('inputForm.petNamePlaceholder'), subtitle: t('inputForm.petSubtitle') },
    travel: { title: t('inputForm.travelTitle'), nameLabel: t('inputForm.travelNameLabel'), namePlaceholder: t('inputForm.travelNamePlaceholder'), subtitle: t('inputForm.travelSubtitle') },
    memory: { title: t('inputForm.memoryTitle'), nameLabel: t('inputForm.memoryNameLabel'), namePlaceholder: t('inputForm.memoryNamePlaceholder'), subtitle: t('inputForm.memorySubtitle') },
  }

  const labels = typeLabels[albumType] || typeLabels.child

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/type-select')}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={fillSample}
            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 cursor-pointer"
          >
            {t('inputForm.sampleButton')}
          </button>
          <button
            onClick={resetForm}
            className="text-sm text-primary border border-primary hover:bg-primary/5 font-medium px-3 py-1 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            {t('inputForm.resetButton')}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1 mt-4">{labels.title}</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">{labels.subtitle}</p>

          {/* Common: Name */}
          <div className="space-y-4 mb-10">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{labels.nameLabel}</label>
              <input
                type="text"
                value={state.name}
                onChange={(e) => dispatch({ type: 'SET_NAME', payload: e.target.value })}
                placeholder={labels.namePlaceholder}
                className={INPUT_CLASS}
              />
            </div>

            {/* child / pet: birthYear + albumYear */}
            {(albumType === 'child' || albumType === 'pet') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.birthYear')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={state.birthYear}
                    onChange={(e) => dispatch({ type: 'SET_BIRTH_YEAR', payload: e.target.value })}
                    placeholder={t('inputForm.birthYearPlaceholder')}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.albumYear')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={state.albumYear}
                    onChange={(e) => dispatch({ type: 'SET_ALBUM_YEAR', payload: e.target.value })}
                    placeholder={t('inputForm.albumYearPlaceholder', { year: CURRENT_YEAR })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            {/* travel: period */}
            {albumType === 'travel' && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.travelPeriod')}</label>
                <input
                  type="text"
                  value={state.birthYear}
                  onChange={(e) => dispatch({ type: 'SET_BIRTH_YEAR', payload: e.target.value })}
                  placeholder={t('inputForm.travelPeriodPlaceholder')}
                  className={INPUT_CLASS}
                />
              </div>
            )}

            {/* memory: period */}
            {albumType === 'memory' && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.memoryPeriod')}</label>
                <input
                  type="text"
                  value={state.birthYear}
                  onChange={(e) => dispatch({ type: 'SET_BIRTH_YEAR', payload: e.target.value })}
                  placeholder={t('inputForm.memoryPeriodPlaceholder')}
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>

          {/* child / pet: Monthly highlights */}
          {(albumType === 'child' || albumType === 'pet') && (
            <>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">{t('inputForm.monthlyTitle')}</h2>
              <p className="text-sm text-[#6B6B6B] mb-3">{t('inputForm.monthlySubtitle')}</p>
              <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 mb-6 leading-relaxed">
                {t('inputForm.monthlyHint')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {state.highlights.map((h) => (
                  <div key={h.month}>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('inputForm.monthLabel', { month: h.month })}</label>
                    <textarea
                      value={h.content}
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_HIGHLIGHT',
                          payload: { month: h.month, content: e.target.value },
                        })
                      }
                      placeholder={t('inputForm.monthPlaceholder')}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] resize-none focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* travel: Dynamic moments */}
          {albumType === 'travel' && (
            <>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">{t('inputForm.travelMomentsTitle')}</h2>
              <p className="text-sm text-[#6B6B6B] mb-3">{t('inputForm.travelMomentsSubtitle')}</p>
              <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 mb-6 leading-relaxed">
                {t('inputForm.travelMomentsHint')}
              </p>
              <div className="space-y-3">
                {moments.map((m, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#1A1A1A]">{t('inputForm.momentLabel', { index: i + 1 })}</span>
                      {moments.length > 1 && (
                        <button
                          onClick={() => removeMoment(i)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200"
                        >
                          {t('buttons.delete')}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={m.content}
                      onChange={(e) => updateMoment(i, 'content', e.target.value)}
                      placeholder={t('inputForm.travelMomentPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                ))}
                {moments.length < 10 && (
                  <button
                    onClick={addMoment}
                    className="w-full border-2 border-dashed border-[#E5E5E3] hover:border-primary text-[#6B6B6B] hover:text-primary text-sm font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer"
                  >
                    {t('inputForm.addMoment')}
                  </button>
                )}
              </div>
            </>
          )}

          {/* memory: Dynamic moments */}
          {albumType === 'memory' && (
            <>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">{t('inputForm.memoryMomentsTitle')}</h2>
              <p className="text-sm text-[#6B6B6B] mb-3">{t('inputForm.memoryMomentsSubtitle')}</p>
              <p className="text-xs text-primary bg-primary/5 rounded-lg px-3 py-2 mb-6 leading-relaxed">
                {t('inputForm.memoryMomentsHint')}
              </p>
              <div className="space-y-3">
                {moments.map((m, i) => (
                  <div key={i} className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-[#1A1A1A]">{t('inputForm.momentLabel', { index: i + 1 })}</span>
                      {moments.length > 1 && (
                        <button
                          onClick={() => removeMoment(i)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200"
                        >
                          {t('buttons.delete')}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={m.content}
                      onChange={(e) => updateMoment(i, 'content', e.target.value)}
                      placeholder={t('inputForm.memoryMomentPlaceholder')}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] resize-none focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                ))}
                {moments.length < 10 && (
                  <button
                    onClick={addMoment}
                    className="w-full border-2 border-dashed border-[#E5E5E3] hover:border-primary text-[#6B6B6B] hover:text-primary text-sm font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer"
                  >
                    {t('inputForm.addMoment')}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!isValid}
            className={`mt-10 w-full text-white text-base font-medium py-4 rounded-xl transition-colors duration-200 ${
              isValid
                ? 'bg-primary hover:bg-primary-dark cursor-pointer'
                : 'bg-[#D1D1CF] cursor-not-allowed'
            }`}
          >
            {t('buttons.next')}
          </button>
        </div>
      </main>
    </div>
  )
}
