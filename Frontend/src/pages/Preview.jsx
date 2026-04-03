import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { getTemplates } from '../api/templateApi'
import { generateStory } from '../api/storyApi'
import { generateVideo } from '../api/videoApi'

const DEFAULT_COVER_TEMPLATE = '4MY2fokVjkeY'
const DEFAULT_CONTENT_TEMPLATE = 'vHA59XPPKqak'
const DUMMY_COVER_IMAGE = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop'

export default function Preview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const fileInputRef = useRef(null)

  // Generation
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)

  // Editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingSubtitle, setEditingSubtitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [subtitleDraft, setSubtitleDraft] = useState('')
  const [regeneratingStory, setRegeneratingStory] = useState(false)

  // Page slider
  const [currentPage, setCurrentPage] = useState(0)

  // Customize panel
  const [showOptions, setShowOptions] = useState(false)

  // Template picker modal
  const [templateModal, setTemplateModal] = useState(null) // 'cover' | 'content' | null
  const [templateList, setTemplateList] = useState([])
  const [templateLoading, setTemplateLoading] = useState(false)

  const story = state.generatedStory || {}
  const coverImage = state.coverImagePreview || DUMMY_COVER_IMAGE
  const coverTitle = state.name && state.albumYear
    ? t('preview.coverTitle', { name: state.name, year: state.albumYear })
    : t('preview.titlePreview')
  const dateRange = state.albumYear ? `${state.albumYear}.01 - ${state.albumYear}.12` : ''

  // Set defaults on mount & ensure minimum 22 inner pages (+ cover + story = 24 total)
  useEffect(() => {
    if (!state.selectedCoverTemplateUid) {
      dispatch({ type: 'SET_COVER_TEMPLATE_UID', payload: DEFAULT_COVER_TEMPLATE })
    }
    if (!state.selectedContentTemplateUid) {
      dispatch({ type: 'SET_CONTENT_TEMPLATE_UID', payload: DEFAULT_CONTENT_TEMPLATE })
    }
    if (state.highlights.length < 22) {
      const expanded = [...state.highlights]
      for (let i = state.highlights.length + 1; i <= 22; i++) {
        expanded.push({ month: i, content: '', memo: '', caption: '', imageFile: null, imagePreview: null })
      }
      dispatch({ type: 'SET_HIGHLIGHTS', payload: expanded })
    }
  }, [])

  // File handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    dispatch({ type: 'SET_COVER_IMAGE_FILE', payload: file })
    const reader = new FileReader()
    reader.onload = (ev) => {
      dispatch({ type: 'SET_COVER_IMAGE_PREVIEW', payload: ev.target.result })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveCoverImage = () => {
    dispatch({ type: 'SET_COVER_IMAGE_FILE', payload: null })
    dispatch({ type: 'SET_COVER_IMAGE_PREVIEW', payload: null })
  }

  // Highlight photo handlers
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  const MAX_FILE_SIZE = 20 * 1024 * 1024
  const highlightInputRefs = useRef({})

  const handleHighlightPhoto = (month, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) return
    if (generateError) setGenerateError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      dispatch({ type: 'SET_HIGHLIGHT', payload: { month, imageFile: file, imagePreview: ev.target.result } })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeHighlightPhoto = (month) => {
    dispatch({ type: 'SET_HIGHLIGHT', payload: { month, imageFile: null, imagePreview: null } })
  }

  // Video generation
  const [videoGenerating, setVideoGenerating] = useState(false)
  const [videoError, setVideoError] = useState(null)
  const [bgmFile, setBgmFile] = useState(null)
  const bgmInputRef = useRef(null)

  const hasStory = !!state.generatedStory

  // Inner page count (at least 22)
  const [innerPageCount, setInnerPageCount] = useState(() => {
    return Math.max(state.highlights.length, 22)
  })

  // Build pages for slider
  const buildPages = () => {
    const pages = []
    // Page 0: Cover (1p)
    pages.push({ type: 'cover' })
    // Page 1: Story (1p)
    if (hasStory) {
      pages.push({ type: 'story' })
    }
    // Inner pages
    const visibleCount = Math.min(innerPageCount, state.highlights.length)
    state.highlights.slice(0, visibleCount).forEach((h, i) => {
      pages.push({ type: 'inner', index: i, month: h.month, content: h.content, caption: h.caption, imagePreview: h.imagePreview })
    })
    return pages
  }

  // Add new page
  const handleAddPage = () => {
    const next = innerPageCount + 1
    if (next > state.highlights.length) {
      const expanded = [...state.highlights, { month: next, content: '', memo: '', caption: '', imageFile: null, imagePreview: null }]
      dispatch({ type: 'SET_HIGHLIGHTS', payload: expanded })
    }
    setInnerPageCount(next)
    setCurrentPage(pages.length)
  }

  const pages = buildPages()
  const totalPages = pages.length
  const safePage = Math.min(currentPage, totalPages - 1)
  const page = pages[safePage] || pages[0]

  // Build story payload by type
  const buildStoryPayload = () => {
    const type = state.type || 'child'
    const visible = state.highlights.slice(0, innerPageCount)
    if (type === 'travel') {
      return {
        type,
        name: state.name,
        period: state.birthYear,
        highlights: visible.map((h, i) => ({ date: `Day ${i + 1}`, content: h.content || '' })),
      }
    }
    if (type === 'memory') {
      return {
        type,
        name: state.name,
        period: state.birthYear,
        highlights: visible.map((h, i) => ({ title: `${t('preview.momentLabel', { index: i + 1 })}`, content: h.content || '' })),
      }
    }
    return {
      type,
      name: state.name,
      birthYear: state.birthYear,
      albumYear: state.albumYear,
      highlights: visible.map((h) => ({ month: h.month, content: h.content || '' })),
    }
  }

  // Generate story
  const handleGenerate = async (skipValidation = false) => {
    if (!skipValidation) {
      const type = state.type || 'child'
      // Validation
      if (!state.name) {
        setGenerateError(t('errors.nameRequired'))
        return
      }
      if (type === 'child' || type === 'pet') {
        if (!state.birthYear) {
          setGenerateError(t('errors.birthYearRequired'))
          return
        }
        if (!state.albumYear) {
          setGenerateError(t('errors.albumYearRequired'))
          return
        }
        const birth = Number(state.birthYear)
        const album = Number(state.albumYear)
        if (birth && album && album < birth) {
          setGenerateError(t('errors.albumYearError'))
          return
        }
      }
      if (type === 'travel' || type === 'memory') {
        if (!state.birthYear) {
          setGenerateError(t('errors.periodRequired'))
          return
        }
      }
    }
    setGenerating(true)
    setGenerateError(null)
    try {
      const payload = buildStoryPayload()
      console.log('POST /api/story/generate payload:', payload)
      const res = await generateStory(payload)
      const result = res.data?.data || res.data
      dispatch({ type: 'SET_GENERATED_STORY', payload: result })
    } catch (err) {
      setGenerateError(err.response?.data?.message || err.message || t('errors.storyFailed'))
    }
    setGenerating(false)
  }

  const handleRegenerateStory = async () => {
    setRegeneratingStory(true)
    try {
      const res = await generateStory(buildStoryPayload())
      const result = res.data?.data || res.data
      dispatch({ type: 'SET_GENERATED_STORY', payload: result })
    } catch { /* ignore */ }
    setRegeneratingStory(false)
  }

  // Video slideshow
  const handleGenerateVideo = async () => {
    const highlightImages = state.highlights
      .map((h) => h.imageFile)
      .filter(Boolean)
    let coverFile = state.coverImageFile
    if (!coverFile) {
      try {
        const response = await fetch(DUMMY_COVER_IMAGE)
        const blob = await response.blob()
        coverFile = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
      } catch {
        coverFile = null
      }
    }
    const imageFiles = [
      ...(coverFile ? [coverFile] : []),
      ...highlightImages,
    ]
    if (imageFiles.length === 0) {
      setVideoError(t('preview.videoNoImages'))
      return
    }
    setVideoError(null)
    setVideoGenerating(true)
    try {
      const captions = [
        ...(coverFile ? [''] : []),
        ...state.highlights
          .filter((h) => h.imageFile)
          .map((h) => h.content || ''),
      ]
      console.log('[커버]', !!state.coverImageFile)
      console.log('[내지 사진 수]', state.highlights.filter((h) => h.imageFile).length)
      console.log('[최종 images 수]', imageFiles.length)
      console.log('[최종 captions 수]', captions.length)
      console.log('POST /api/video/generate payload:', {
        images: imageFiles.map((f) => f.name),
        title: story.title,
        subtitle: story.subtitle,
        captions,
        story: story.story?.slice(0, 50) + '...',
        bgm: bgmFile?.name || null,
      })
      const res = await generateVideo(imageFiles, {
        title: story.title,
        subtitle: story.subtitle,
        captions,
        story: story.story,
        bgmFile,
      })
      const url = window.URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${state.name || 'slideshow'}.mp4`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setVideoError(err.response?.data?.message || err.message || t('errors.generic'))
    }
    setVideoGenerating(false)
  }

  // Template modal
  const openTemplatePicker = async (kind) => {
    setTemplateModal(kind)
    setTemplateLoading(true)
    setTemplateList([])
    try {
      const res = await getTemplates(kind)
      const d = res.data?.data
      let list = []
      if (Array.isArray(d)) list = d
      else if (d && Array.isArray(d.templates)) list = d.templates
      else if (Array.isArray(res.data)) list = res.data
      setTemplateList(list)
    } catch {
      setTemplateList([])
    }
    setTemplateLoading(false)
  }

  const selectTemplate = (uid) => {
    if (templateModal === 'cover') {
      dispatch({ type: 'SET_COVER_TEMPLATE_UID', payload: uid })
      console.log('표지 템플릿 변경:', uid)
    } else {
      dispatch({ type: 'SET_CONTENT_TEMPLATE_UID', payload: uid })
      console.log('내지 템플릿 변경:', uid)
    }
    setTemplateModal(null)
  }

  // Pencil icon SVG
  const PencilIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
    </svg>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/input-form')}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('preview.header')}</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-3xl mx-auto">

          {/* Page Slider with Side Arrows */}
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Left Arrow */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={safePage <= 0}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary disabled:text-[#D1D1CF] cursor-pointer disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Card */}
            <div className="w-full max-w-sm">
              <div className="aspect-[3/4] rounded-2xl border border-[#E5E5E3] bg-white shadow-sm relative overflow-hidden flex flex-col">

                {/* Cover page */}
                {page.type === 'cover' && (
                  <>
                    <div className="absolute inset-0">
                      <img src={coverImage} alt="" className="w-full h-full object-cover opacity-20" />
                    </div>
                    <div className="relative flex-1 flex flex-col items-center justify-center px-6">
                      <img src={coverImage} alt="" className="w-2/5 aspect-square object-cover rounded-xl shadow-lg mb-6" />
                      <h3 className="text-2xl font-bold text-[#1A1A1A] text-center mb-1">
                        {story.title || coverTitle}
                      </h3>
                      <p className="text-sm text-[#6B6B6B] text-center">{story.subtitle || ''}</p>
                    </div>
                    {dateRange && (
                      <div className="relative px-4 pb-4 text-center">
                        <p className="text-xs text-[#ACACAC] font-mono">{dateRange}</p>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 px-2.5 rounded-full bg-white/80 hover:bg-white flex items-center gap-1 text-[#6B6B6B] hover:text-primary text-[10px] font-medium transition-colors duration-200 cursor-pointer shadow-sm"
                      >
                        <PencilIcon />
                        <span>{t('preview.changePhoto')}</span>
                      </button>
                      {state.coverImagePreview && (
                        <button
                          onClick={handleRemoveCoverImage}
                          className="w-7 h-7 rounded-full bg-[#1A1A1A]/60 hover:bg-[#1A1A1A] text-white flex items-center justify-center cursor-pointer transition-colors duration-200 shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </>
                )}

                {/* Story page */}
                {page.type === 'story' && (
                  <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">{t('preview.storyLabel')}</p>
                    <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap flex-1">
                      {story.story || ''}
                    </p>
                  </div>
                )}

                {/* Inner page */}
                {page.type === 'inner' && (
                  <div className="flex-1 flex flex-col">
                    {/* Photo area */}
                    {page.imagePreview ? (
                      <div className="relative h-48 flex-shrink-0">
                        <img src={page.imagePreview} alt="" className="w-full h-full object-cover object-center" />
                        <button
                          onClick={() => removeHighlightPhoto(page.month)}
                          className="absolute top-2 right-2 h-6 px-2 rounded-full bg-[#1A1A1A]/60 hover:bg-[#1A1A1A] text-white flex items-center gap-1 text-[10px] font-medium cursor-pointer transition-colors duration-200"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          <span>{t('preview.deletePhoto')}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => highlightInputRefs.current[page.month]?.click()}
                        className="h-48 flex-shrink-0 border-b border-dashed border-[#E5E5E3] bg-[#FAFAF9] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-primary/5 transition-colors duration-200"
                      >
                        <svg className="w-7 h-7 text-[#D1D1CF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                        <span className="text-xs text-[#ACACAC]">{t('preview.addPhoto')}</span>
                      </button>
                    )}
                    <input
                      ref={(el) => (highlightInputRefs.current[page.month] = el)}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      onChange={(e) => handleHighlightPhoto(page.month, e)}
                      className="hidden"
                    />
                    {/* Text content */}
                    <div className="flex-1 p-5 flex flex-col justify-center">
                      <p className="text-lg font-bold text-primary mb-2">
                        {t('preview.pageLabel', { index: page.index + 1 })}
                      </p>
                      <textarea
                        value={page.content}
                        onChange={(e) => dispatch({ type: 'SET_HIGHLIGHT', payload: { month: page.month, content: e.target.value } })}
                        placeholder={t('preview.contentPlaceholder')}
                        rows={2}
                        className="text-sm text-[#4A4A4A] leading-relaxed w-full px-3 py-2 rounded-lg border border-[#E5E5E3] resize-none focus:outline-none focus:border-primary transition-colors duration-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary disabled:text-[#D1D1CF] cursor-pointer disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Page Number */}
          <p className="text-center text-xs text-[#6B6B6B] font-medium mb-4">
            {safePage + 1} / {totalPages}
          </p>

          {/* Add Page Button */}
          <button
            onClick={handleAddPage}
            className="w-full mb-8 border-2 border-dashed border-[#E5E5E3] hover:border-primary text-[#6B6B6B] hover:text-primary text-sm font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t('preview.addPage')}
          </button>

          {/* Story section (always visible) */}
          <div className="space-y-4 mb-8">
            {/* Title */}
            <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">{t('preview.titleLabel')}</span>
                {hasStory && !editingTitle && (
                  <button
                    onClick={() => { setEditingTitle(true); setTitleDraft(story.title || '') }}
                    className="flex items-center gap-1 text-xs text-primary font-medium cursor-pointer hover:text-primary-dark transition-colors duration-200"
                  >
                    <PencilIcon />
                    <span>{t('buttons.edit')}</span>
                  </button>
                )}
              </div>
              {editingTitle ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] focus:outline-none focus:border-primary transition-colors duration-200"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_GENERATED_STORY', payload: { ...story, title: titleDraft } })
                      setEditingTitle(false)
                    }}
                    className="text-xs bg-primary text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-primary-dark transition-colors duration-200"
                  >
                    {t('buttons.save')}
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="text-xs text-[#6B6B6B] px-2 py-2 cursor-pointer hover:text-[#1A1A1A] transition-colors duration-200"
                  >
                    {t('buttons.cancel')}
                  </button>
                </div>
              ) : (
                <p className={`text-base font-semibold ${hasStory ? 'text-[#1A1A1A]' : 'text-[#ACACAC]'}`}>{story.title || '-'}</p>
              )}
            </div>

            {/* Subtitle */}
            <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">{t('preview.subtitleLabel')}</span>
                {hasStory && !editingSubtitle && (
                  <button
                    onClick={() => { setEditingSubtitle(true); setSubtitleDraft(story.subtitle || '') }}
                    className="flex items-center gap-1 text-xs text-primary font-medium cursor-pointer hover:text-primary-dark transition-colors duration-200"
                  >
                    <PencilIcon />
                    <span>{t('buttons.edit')}</span>
                  </button>
                )}
              </div>
              {editingSubtitle ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subtitleDraft}
                    onChange={(e) => setSubtitleDraft(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] focus:outline-none focus:border-primary transition-colors duration-200"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_GENERATED_STORY', payload: { ...story, subtitle: subtitleDraft } })
                      setEditingSubtitle(false)
                    }}
                    className="text-xs bg-primary text-white px-3 py-2 rounded-lg cursor-pointer hover:bg-primary-dark transition-colors duration-200"
                  >
                    {t('buttons.save')}
                  </button>
                  <button
                    onClick={() => setEditingSubtitle(false)}
                    className="text-xs text-[#6B6B6B] px-2 py-2 cursor-pointer hover:text-[#1A1A1A] transition-colors duration-200"
                  >
                    {t('buttons.cancel')}
                  </button>
                </div>
              ) : (
                <p className={`text-sm ${hasStory ? 'text-[#6B6B6B]' : 'text-[#ACACAC]'}`}>{story.subtitle || '-'}</p>
              )}
            </div>

            {/* Story */}
            <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">{t('preview.storyLabel')}</span>
                {hasStory && (
                  <button
                    onClick={handleRegenerateStory}
                    disabled={regeneratingStory}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors duration-200 ${
                      regeneratingStory ? 'text-[#ACACAC] cursor-not-allowed' : 'text-primary hover:text-primary-dark cursor-pointer'
                    }`}
                  >
                    {regeneratingStory ? (
                      <>
                        <span className="w-3 h-3 border-2 border-[#ACACAC] border-t-transparent rounded-full animate-spin" />
                        <span>{t('preview.generating')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                        </svg>
                        <span>{t('preview.regenerate')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto">
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${hasStory ? 'text-[#4A4A4A]' : 'text-[#ACACAC]'}`}>
                  {hasStory ? (story.story || t('preview.noStory')) : t('preview.storyPlaceholder')}
                </p>
              </div>
            </div>
          </div>

          {/* Video hint */}
          <p className="text-sm text-blue-500 text-center mb-3">{t('preview.videoSettingsHint')}</p>

          {/* Customize toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between px-4 py-3 mb-4 rounded-xl bg-white border border-[#E5E5E3] text-sm text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer transition-colors duration-200"
          >
            <span className="font-medium">{t('preview.advancedSettings')}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showOptions && (
            <div className="space-y-3 mb-8">
              {/* BGM Upload */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">{t('preview.bgmLabel')}</span>
                </div>
                {bgmFile ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                      </svg>
                      <span className="text-sm text-[#4A4A4A] truncate">{bgmFile.name}</span>
                    </div>
                    <button
                      onClick={() => { setBgmFile(null); if (bgmInputRef.current) bgmInputRef.current.value = '' }}
                      className="w-6 h-6 rounded-full bg-[#F0F0EE] hover:bg-[#E5E5E3] flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors duration-200"
                    >
                      <svg className="w-3.5 h-3.5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => bgmInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#D1D1CF] text-sm text-[#6B6B6B] hover:border-primary hover:text-primary cursor-pointer transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {t('preview.bgmAdd')}
                  </button>
                )}
                <input
                  ref={bgmInputRef}
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setBgmFile(file)
                  }}
                  className="hidden"
                />
                <p className="text-base text-orange-500 mt-2 py-2"><span className="mr-1">⚠️</span>{t('preview.bgmCopyright')}</p>
              </div>

              {/* Slideshow Video */}
              {state.highlights.filter((h) => h.imageFile).length < 3 && (
                <p className="text-sm text-orange-500 bg-orange-50 rounded-lg px-3 py-2 text-center">
                  {t('preview.videoMinPhotos')}
                </p>
              )}
              {videoError && (
                <p className="text-sm text-red-500 mb-2 text-center">{videoError}</p>
              )}
              <button
                onClick={handleGenerateVideo}
                disabled={videoGenerating}
                className={`w-full text-base font-medium py-4 rounded-xl border-2 transition-colors duration-200 ${
                  videoGenerating
                    ? 'border-[#D1D1CF] text-[#ACACAC] bg-white cursor-not-allowed'
                    : 'border-primary text-primary bg-white hover:bg-primary/5 cursor-pointer'
                }`}
              >
                {videoGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#ACACAC] border-t-transparent rounded-full animate-spin" />
                    {t('preview.videoGenerating')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    {t('preview.videoGenerate')}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {generateError && (
            <p className="text-sm text-red-500 mb-4 text-center">{generateError}</p>
          )}

          {/* Action buttons */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`w-full text-base font-medium py-4 rounded-xl border-2 transition-colors duration-200 mb-3 ${
              generating
                ? 'border-[#D1D1CF] text-[#ACACAC] bg-white cursor-not-allowed'
                : 'border-primary text-primary bg-white hover:bg-primary/5 cursor-pointer'
            }`}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-[#ACACAC] border-t-transparent rounded-full animate-spin" />
                {t('preview.generatingStory')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                {t('preview.generateStoryBtn')}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/loading')}
            disabled={!hasStory}
            className={`w-full text-white text-base font-medium py-4 rounded-xl transition-colors duration-200 ${
              hasStory
                ? 'bg-primary hover:bg-primary-dark cursor-pointer'
                : 'bg-[#D1D1CF] cursor-not-allowed'
            }`}
          >
            {t('preview.makeBook')}
          </button>
          {!hasStory && (
            <p className="text-xs text-[#ACACAC] text-center mt-2">{t('preview.storyRequiredHint')}</p>
          )}
        </div>
      </main>

      {/* Template Picker Modal */}
      {templateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E3]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                {templateModal === 'cover' ? t('preview.coverTemplateSelect') : t('preview.contentTemplateSelect')}
              </h3>
              <button
                onClick={() => setTemplateModal(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F0F0EE] flex items-center justify-center text-[#6B6B6B] cursor-pointer transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-4">
              {templateLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : templateList.length === 0 ? (
                <p className="text-sm text-[#ACACAC] text-center py-12">{t('preview.noTemplates')}</p>
              ) : (
                <div className="space-y-2">
                  {templateList.map((tmpl) => {
                    const uid = tmpl.templateUid || tmpl.uid || tmpl.id
                    const name = tmpl.templateName || tmpl.name || 'Template'
                    const currentUid = templateModal === 'cover'
                      ? state.selectedCoverTemplateUid
                      : state.selectedContentTemplateUid
                    const selected = currentUid === uid
                    return (
                      <button
                        key={uid}
                        onClick={() => selectTemplate(uid)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-[#E5E5E3] bg-white hover:border-[#D1D1CF]'
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-[#1A1A1A]'}`}>
                            {name}
                          </p>
                          <p className="text-[10px] text-[#ACACAC] font-mono mt-0.5">{uid}</p>
                        </div>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
