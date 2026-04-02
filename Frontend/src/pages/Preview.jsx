import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getTemplates } from '../api/templateApi'
import { generateStory } from '../api/storyApi'

const DEFAULT_COVER_TEMPLATE = '4MY2fokVjkeY'
const DEFAULT_CONTENT_TEMPLATE = 'vHA59XPPKqak'
const DUMMY_COVER_IMAGE = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop'

export default function Preview() {
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

  // Customize panel
  const [showOptions, setShowOptions] = useState(false)

  // Template picker modal
  const [templateModal, setTemplateModal] = useState(null) // 'cover' | 'content' | null
  const [templateList, setTemplateList] = useState([])
  const [templateLoading, setTemplateLoading] = useState(false)

  const story = state.generatedStory || {}
  const coverImage = state.coverImagePreview || DUMMY_COVER_IMAGE
  const coverTitle = state.name && state.albumYear
    ? `${state.name}의 ${state.albumYear}년`
    : '제목 미리보기'
  const dateRange = state.albumYear ? `${state.albumYear}.01 - ${state.albumYear}.12` : ''

  // Set defaults on mount
  useEffect(() => {
    if (!state.selectedCoverTemplateUid) {
      dispatch({ type: 'SET_COVER_TEMPLATE_UID', payload: DEFAULT_COVER_TEMPLATE })
    }
    if (!state.selectedContentTemplateUid) {
      dispatch({ type: 'SET_CONTENT_TEMPLATE_UID', payload: DEFAULT_CONTENT_TEMPLATE })
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

  // Generate story
  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await generateStory(state.name, state.birthYear, state.albumYear, state.highlights)
      const result = res.data?.data || res.data
      dispatch({ type: 'SET_GENERATED_STORY', payload: result })
    } catch (err) {
      setGenerateError(err.response?.data?.message || err.message || '스토리 생성에 실패했습니다')
    }
    setGenerating(false)
  }

  const handleRegenerateStory = async () => {
    setRegeneratingStory(true)
    try {
      const res = await generateStory(state.name, state.birthYear, state.albumYear, state.highlights)
      const result = res.data?.data || res.data
      dispatch({ type: 'SET_GENERATED_STORY', payload: result })
    } catch { /* ignore */ }
    setRegeneratingStory(false)
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

  const hasStory = !!state.generatedStory

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
        <h2 className="text-base font-semibold text-[#1A1A1A]">앨범 미리보기</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-3xl mx-auto">

          {/* Cover Preview Card */}
          <div className="w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl border border-[#E5E5E3] bg-white relative overflow-hidden flex flex-col mb-8">
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#6B6B6B] hover:text-primary transition-colors duration-200 cursor-pointer shadow-sm"
            >
              <PencilIcon />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Story section (after generation) */}
          {hasStory && (
            <div className="space-y-4 mb-8">
              {/* Title */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">제목</span>
                  {!editingTitle && (
                    <button
                      onClick={() => { setEditingTitle(true); setTitleDraft(story.title || '') }}
                      className="flex items-center gap-1 text-xs text-primary font-medium cursor-pointer hover:text-primary-dark transition-colors duration-200"
                    >
                      <PencilIcon />
                      <span>수정</span>
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
                      저장
                    </button>
                    <button
                      onClick={() => setEditingTitle(false)}
                      className="text-xs text-[#6B6B6B] px-2 py-2 cursor-pointer hover:text-[#1A1A1A] transition-colors duration-200"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <p className="text-base text-[#1A1A1A] font-semibold">{story.title || '-'}</p>
                )}
              </div>

              {/* Subtitle */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">부제</span>
                  {!editingSubtitle && (
                    <button
                      onClick={() => { setEditingSubtitle(true); setSubtitleDraft(story.subtitle || '') }}
                      className="flex items-center gap-1 text-xs text-primary font-medium cursor-pointer hover:text-primary-dark transition-colors duration-200"
                    >
                      <PencilIcon />
                      <span>수정</span>
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
                      저장
                    </button>
                    <button
                      onClick={() => setEditingSubtitle(false)}
                      className="text-xs text-[#6B6B6B] px-2 py-2 cursor-pointer hover:text-[#1A1A1A] transition-colors duration-200"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[#6B6B6B]">{story.subtitle || '-'}</p>
                )}
              </div>

              {/* Story */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">AI 성장 스토리</span>
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
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                        </svg>
                        <span>재생성</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                    {story.story || '스토리가 없습니다'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customize toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between px-4 py-3 mb-4 rounded-xl bg-white border border-[#E5E5E3] text-sm text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer transition-colors duration-200"
          >
            <span className="font-medium">고급 설정</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showOptions && (
            <div className="space-y-3 mb-8">
              {/* Cover template */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider block mb-2">표지 템플릿</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#6B6B6B] font-mono">{state.selectedCoverTemplateUid || DEFAULT_COVER_TEMPLATE}</span>
                    {state.selectedCoverTemplateUid === DEFAULT_COVER_TEMPLATE && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">기본값</span>
                    )}
                  </div>
                  <button
                    onClick={() => openTemplatePicker('cover')}
                    className="text-xs text-primary border border-primary hover:bg-primary/5 font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    변경
                  </button>
                </div>
              </div>

              {/* Content template */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider block mb-2">내지 템플릿</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#6B6B6B] font-mono">{state.selectedContentTemplateUid || DEFAULT_CONTENT_TEMPLATE}</span>
                    {state.selectedContentTemplateUid === DEFAULT_CONTENT_TEMPLATE && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">기본값</span>
                    )}
                  </div>
                  <button
                    onClick={() => openTemplatePicker('content')}
                    className="text-xs text-primary border border-primary hover:bg-primary/5 font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    변경
                  </button>
                </div>
              </div>

              {/* Cover image */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider block mb-2">표지 이미지</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary border border-primary hover:bg-primary/5 font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    이미지 변경
                  </button>
                  <span className="text-xs text-[#ACACAC]">
                    {state.coverImagePreview ? '사용자 이미지 적용됨' : '기본 이미지 적용됨'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {generateError && (
            <p className="text-sm text-red-500 mb-4 text-center">{generateError}</p>
          )}

          {/* Action buttons */}
          {!hasStory ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full text-white text-base font-medium py-4 rounded-xl transition-colors duration-200 ${
                generating
                  ? 'bg-[#D1D1CF] cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark cursor-pointer'
              }`}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI 스토리 생성 중...
                </span>
              ) : (
                '앨범 미리보기 생성'
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate('/loading')}
              className="w-full text-white text-base font-medium py-4 rounded-xl bg-primary hover:bg-primary-dark cursor-pointer transition-colors duration-200"
            >
              책 만들기
            </button>
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
                {templateModal === 'cover' ? '표지 템플릿 선택' : '내지 템플릿 선택'}
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
                <p className="text-sm text-[#ACACAC] text-center py-12">템플릿이 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {templateList.map((t) => {
                    const uid = t.templateUid || t.uid || t.id
                    const name = t.templateName || t.name || '템플릿'
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
