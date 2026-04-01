import { createContext, useContext, useReducer } from 'react'

const initialState = {
  type: 'child',
  name: '',
  birthYear: '',
  albumYear: '',
  highlights: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, content: '' })),
  generatedStory: null,
  bookUid: null,
  coverImageFile: null,
  coverImagePreview: null,
  coverImageFileName: null,
  coverThumbnailUrl: null,
  selectedCoverTemplateUid: null,
  selectedContentTemplateUid: null,
  orderUid: null,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_TYPE':
      return { ...state, type: action.payload }
    case 'SET_NAME':
      return { ...state, name: action.payload }
    case 'SET_BIRTH_YEAR':
      return { ...state, birthYear: action.payload }
    case 'SET_ALBUM_YEAR':
      return { ...state, albumYear: action.payload }
    case 'SET_HIGHLIGHT':
      return {
        ...state,
        highlights: state.highlights.map((h) =>
          h.month === action.payload.month
            ? { ...h, content: action.payload.content }
            : h
        ),
      }
    case 'SET_HIGHLIGHTS':
      return { ...state, highlights: action.payload }
    case 'SET_GENERATED_STORY':
      return { ...state, generatedStory: action.payload }
    case 'SET_BOOK_UID':
      return { ...state, bookUid: action.payload }
    case 'SET_COVER_IMAGE_FILE':
      return { ...state, coverImageFile: action.payload }
    case 'SET_COVER_IMAGE_PREVIEW':
      return { ...state, coverImagePreview: action.payload }
    case 'SET_COVER_IMAGE_FILE_NAME':
      return { ...state, coverImageFileName: action.payload }
    case 'SET_COVER_THUMBNAIL_URL':
      return { ...state, coverThumbnailUrl: action.payload }
    case 'SET_COVER_TEMPLATE_UID':
      return { ...state, selectedCoverTemplateUid: action.payload }
    case 'SET_CONTENT_TEMPLATE_UID':
      return { ...state, selectedContentTemplateUid: action.payload }
    case 'SET_ORDER_UID':
      return { ...state, orderUid: action.payload }
    case 'RESET':
      return { ...initialState, highlights: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, content: '' })) }
    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
