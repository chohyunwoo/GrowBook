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

  const albumType = state.type || 'child'

  // Parse existing period for travel/memory split fields
  const parsePeriod = (value) => {
    if (!value) return ['', '']
    const parts = value.split('~').map((s) => s.trim())
    if (parts.length === 2) return parts
    const parts2 = value.split('-').map((s) => s.trim())
    if (parts2.length >= 2) return [parts2[0], parts2[parts2.length - 1]]
    return [value, '']
  }
  const [periodParts] = useState(() => parsePeriod(state.birthYear))
  const [travelStart, setTravelStart] = useState(periodParts[0] || '')
  const [travelEnd, setTravelEnd] = useState(periodParts[1] || '')
  const [memoryStart, setMemoryStart] = useState(periodParts[0] || '')
  const [memoryEnd, setMemoryEnd] = useState(periodParts[1] || '')

  // Initialize albumYear default
  useEffect(() => {
    if (!state.albumYear) {
      dispatch({ type: 'SET_ALBUM_YEAR', payload: CURRENT_YEAR })
    }
  }, [])

  const fillSample = () => {
    const sample = getSample(albumType, i18n.language)
    dispatch({ type: 'SET_NAME', payload: sample.name })
    if (sample.startPeriod !== undefined) {
      dispatch({ type: 'SET_BIRTH_YEAR', payload: `${sample.startPeriod} ~ ${sample.endPeriod}` })
      if (albumType === 'travel') {
        setTravelStart(sample.startPeriod)
        setTravelEnd(sample.endPeriod)
      } else if (albumType === 'memory') {
        setMemoryStart(sample.startPeriod)
        setMemoryEnd(sample.endPeriod)
      }
    } else {
      dispatch({ type: 'SET_BIRTH_YEAR', payload: sample.birthYear })
    }
    dispatch({ type: 'SET_ALBUM_YEAR', payload: sample.albumYear })
  }

  const resetForm = () => {
    dispatch({ type: 'SET_NAME', payload: '' })
    dispatch({ type: 'SET_BIRTH_YEAR', payload: '' })
    dispatch({ type: 'SET_ALBUM_YEAR', payload: CURRENT_YEAR })
    Array.from({ length: 12 }, (_, i) => i + 1).forEach((month) => {
      dispatch({ type: 'SET_HIGHLIGHT', payload: { month, content: '' } })
    })
  }

  const [periodError, setPeriodError] = useState('')
  const [yearError, setYearError] = useState('')

  const isValidYear = (v) => /^\d{4}$/.test(v) && Number(v) >= 1900 && Number(v) <= Number(CURRENT_YEAR)

  const handleYearKeyDown = (e) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (allowed.includes(e.key) || (e.key >= '0' && e.key <= '9')) return
    e.preventDefault()
  }

  const handleNext = () => {
    if (!isValid) return
    if (albumType === 'child' || albumType === 'pet') {
      if (!isValidYear(state.birthYear) || !isValidYear(state.albumYear)) {
        setYearError(t('inputForm.yearError'))
        return
      }
      setYearError('')
    }
    if (albumType === 'travel' && travelStart && travelEnd && travelStart > travelEnd) {
      setPeriodError(t('inputForm.travelPeriodError'))
      return
    }
    if (albumType === 'memory' && memoryStart && memoryEnd && Number(memoryStart) > Number(memoryEnd)) {
      setPeriodError(t('inputForm.memoryPeriodError'))
      return
    }
    setPeriodError('')
    navigate('/preview')
  }

  // Validation
  let isValid = false
  if (albumType === 'child' || albumType === 'pet') {
    isValid = !!(state.name && state.birthYear && state.albumYear)
  } else if (albumType === 'travel') {
    isValid = !!(state.name && state.birthYear)
  } else if (albumType === 'memory') {
    isValid = !!state.name
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
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.birthYear')}</label>
                    <input
                      type="number"
                      min={1900}
                      max={Number(CURRENT_YEAR)}
                      value={state.birthYear}
                      onKeyDown={handleYearKeyDown}
                      onChange={(e) => {
                        if (yearError) setYearError('')
                        dispatch({ type: 'SET_BIRTH_YEAR', payload: e.target.value })
                      }}
                      placeholder={t('inputForm.birthYearPlaceholder')}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.albumYear')}</label>
                    <input
                      type="number"
                      min={1900}
                      max={Number(CURRENT_YEAR)}
                      value={state.albumYear}
                      onKeyDown={handleYearKeyDown}
                      onChange={(e) => {
                        if (yearError) setYearError('')
                        dispatch({ type: 'SET_ALBUM_YEAR', payload: e.target.value })
                      }}
                      placeholder={t('inputForm.albumYearPlaceholder', { year: CURRENT_YEAR })}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                {yearError && (
                  <p className="text-xs text-red-500 mt-1.5">{yearError}</p>
                )}
              </>
            )}

            {/* travel: period */}
            {albumType === 'travel' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.travelStart')}</label>
                    <input
                      type="month"
                      value={travelStart}
                      onChange={(e) => {
                        setTravelStart(e.target.value)
                        if (periodError) setPeriodError('')
                        dispatch({ type: 'SET_BIRTH_YEAR', payload: `${e.target.value} ~ ${travelEnd}` })
                      }}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.travelEnd')}</label>
                    <input
                      type="month"
                      min={travelStart || undefined}
                      value={travelEnd}
                      onChange={(e) => {
                        setTravelEnd(e.target.value)
                        if (periodError) setPeriodError('')
                        dispatch({ type: 'SET_BIRTH_YEAR', payload: `${travelStart} ~ ${e.target.value}` })
                      }}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                {periodError && (
                  <p className="text-xs text-red-500 mt-1.5">{periodError}</p>
                )}
              </>
            )}

            {/* memory: period */}
            {albumType === 'memory' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.memoryStart')}</label>
                    <input
                      type="number"
                      min={1900}
                      max={Number(CURRENT_YEAR)}
                      value={memoryStart}
                      onChange={(e) => {
                        setMemoryStart(e.target.value)
                        if (periodError) setPeriodError('')
                        dispatch({ type: 'SET_BIRTH_YEAR', payload: `${e.target.value} ~ ${memoryEnd}` })
                      }}
                      placeholder="1990"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">{t('inputForm.memoryEnd')}</label>
                    <input
                      type="number"
                      min={memoryStart ? Number(memoryStart) : 1900}
                      max={Number(CURRENT_YEAR)}
                      value={memoryEnd}
                      onChange={(e) => {
                        setMemoryEnd(e.target.value)
                        if (periodError) setPeriodError('')
                        dispatch({ type: 'SET_BIRTH_YEAR', payload: `${memoryStart} ~ ${e.target.value}` })
                      }}
                      placeholder="2025"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
                {periodError && (
                  <p className="text-xs text-red-500 mt-1.5">{periodError}</p>
                )}
              </>
            )}
          </div>

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
