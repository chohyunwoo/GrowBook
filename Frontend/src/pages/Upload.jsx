import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const DUMMY_PHOTOS = [
  { id: 1, url: 'https://picsum.photos/seed/baby1/400/400', name: '첫 미소' },
  { id: 2, url: 'https://picsum.photos/seed/baby2/400/400', name: '목욕 시간' },
  { id: 3, url: 'https://picsum.photos/seed/baby3/400/400', name: '첫 걸음마' },
  { id: 4, url: 'https://picsum.photos/seed/baby4/400/400', name: '이유식' },
  { id: 5, url: 'https://picsum.photos/seed/baby5/400/400', name: '낮잠' },
  { id: 6, url: 'https://picsum.photos/seed/baby6/400/400', name: '놀이 시간' },
]

export default function Upload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [photos, setPhotos] = useState([])
  const [useDummy, setUseDummy] = useState(false)

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const newPhotos = files.map((file, i) => ({
      id: Date.now() + i,
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const loadDummy = () => {
    setPhotos(DUMMY_PHOTOS)
    setUseDummy(true)
  }

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">사진 업로드</h1>
        <p className="text-sm text-[#6B6B6B]">앨범에 넣을 사진을 선택해주세요</p>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-[#2D6A4F]/40 rounded-xl p-10 text-center cursor-pointer hover:bg-[#2D6A4F]/5 transition-colors mb-4"
      >
        <svg className="w-8 h-8 text-[#2D6A4F] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-[#1A1A1A] font-medium text-sm">클릭하여 사진 추가</p>
        <p className="text-xs text-[#6B6B6B] mt-1">JPG, PNG 파일 지원</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Dummy Button */}
      {!useDummy && photos.length === 0 && (
        <button
          onClick={loadDummy}
          className="w-full text-xs text-[#6B6B6B] hover:text-[#2D6A4F] py-2 transition-colors cursor-pointer underline underline-offset-2"
        >
          샘플 사진으로 체험하기
        </button>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <>
          <p className="text-xs text-[#6B6B6B] mb-3 mt-6">
            선택된 사진 <span className="font-semibold text-[#2D6A4F]">{photos.length}장</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mb-8">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 rounded-xl border border-[#D1D1CF] text-[#6B6B6B] font-medium text-sm hover:bg-[#EEEEEC] transition-colors cursor-pointer"
        >
          이전
        </button>
        <button
          onClick={() => navigate('/preview')}
          disabled={photos.length === 0}
          className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white font-medium text-sm hover:bg-[#245A42] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          다음: 미리보기
        </button>
      </div>
    </div>
  )
}
