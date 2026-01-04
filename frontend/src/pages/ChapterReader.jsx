import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

function ChapterReader() {
  const { novelId, chapterOrder } = useParams()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState(null)
  const [novel, setNovel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Swipe state
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const [swipeDirection, setSwipeDirection] = useState(null)
  
  const currentOrder = parseInt(chapterOrder)

  useEffect(() => {
    fetchChapterData()
    window.scrollTo(0, 0)
  }, [novelId, chapterOrder])

  async function fetchChapterData() {
    setLoading(true)
    setError(null)
    
    try {
      const [chapterRes, novelRes] = await Promise.all([
        fetch(`/api/novels/${novelId}/chapters/${chapterOrder}`),
        fetch(`/api/novels/${novelId}`)
      ])
      
      if (!chapterRes.ok) throw new Error('Chapter not found')
      if (!novelRes.ok) throw new Error('Novel not found')
      
      const chapterData = await chapterRes.json()
      const novelData = await novelRes.json()
      
      setChapter(chapterData)
      setNovel(novelData)
      
      // Auto-save bookmark
      saveBookmark(novelData.title, chapterData.title, currentOrder)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveBookmark(novelTitle, chapterTitle, order) {
    try {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novel_id: novelId,
          chapter_order: order,
          chapter_title: chapterTitle,
          novel_title: novelTitle
        })
      })
    } catch (err) {
      console.error('Failed to save bookmark:', err)
    }
  }

  const goToChapter = useCallback((order) => {
    // Full page navigation for refresh
    window.location.href = `/${novelId}/${order}`
  }, [novelId])

  const goToPrevious = useCallback(() => {
    if (currentOrder > 1) {
      goToChapter(currentOrder - 1)
    }
  }, [currentOrder, goToChapter])

  const goToNext = useCallback(() => {
    if (chapter && currentOrder < chapter.totalChapters) {
      goToChapter(currentOrder + 1)
    }
  }, [currentOrder, chapter, goToChapter])

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX
    const diff = touchEndX.current - touchStartX.current
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentOrder > 1) {
        setSwipeDirection('left')
      } else if (diff < 0 && chapter && currentOrder < chapter.totalChapters) {
        setSwipeDirection('right')
      } else {
        setSwipeDirection(null)
      }
    } else {
      setSwipeDirection(null)
    }
  }, [currentOrder, chapter])

  const handleTouchEnd = useCallback(() => {
    const diff = touchEndX.current - touchStartX.current
    const minSwipeDistance = 100
    
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && currentOrder > 1) {
        // Swipe right -> Previous chapter
        goToPrevious()
      } else if (diff < 0 && chapter && currentOrder < chapter.totalChapters) {
        // Swipe left -> Next chapter
        goToNext()
      }
    }
    
    setSwipeDirection(null)
  }, [currentOrder, chapter, goToPrevious, goToNext])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft' && currentOrder > 1) {
        goToPrevious()
      } else if (e.key === 'ArrowRight' && chapter && currentOrder < chapter.totalChapters) {
        goToNext()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentOrder, chapter, goToPrevious, goToNext])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !chapter) {
    return (
      <div className="error">
        <p>Error: {error || 'Chapter not found'}</p>
        <Link to={`/${novelId}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          ← Back to Novel
        </Link>
      </div>
    )
  }

  const hasPrevious = currentOrder > 1
  const hasNext = currentOrder < chapter.totalChapters

  return (
    <div 
      className="chapter-reader"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe indicators */}
      <div className={`swipe-indicator left ${swipeDirection === 'left' ? 'show' : ''}`}>
        ←
      </div>
      <div className={`swipe-indicator right ${swipeDirection === 'right' ? 'show' : ''}`}>
        →
      </div>
      
      {/* Header */}
      <header className="reader-header">
        <div className="reader-header-content">
          <Link to={`/${novelId}`} className="reader-back">
            ←
          </Link>
          <div className="reader-info">
            <p className="reader-novel-title">{novel?.title}</p>
            <p className="reader-chapter-title">{chapter.title}</p>
          </div>
          <span className="chapter-progress">
            {currentOrder}/{chapter.totalChapters}
          </span>
        </div>
      </header>
      
      {/* Content */}
      <article className="reader-content fade-in">
        <h1 className="chapter-heading">{chapter.title}</h1>
        <div className="chapter-text">
          {chapter.content.split('\n').map((paragraph, index) => (
            paragraph.trim() ? <p key={index}>{paragraph}</p> : null
          ))}
        </div>
      </article>
      
      {/* Navigation */}
      <nav className="chapter-nav">
        <button 
          className="nav-btn" 
          onClick={goToPrevious}
          disabled={!hasPrevious}
        >
          ← Previous
        </button>
        
        <Link to={`/${novelId}`} className="nav-btn toc-btn">
          📑 TOC
        </Link>
        
        <button 
          className="nav-btn"
          onClick={goToNext}
          disabled={!hasNext}
        >
          Next →
        </button>
      </nav>
    </div>
  )
}

export default ChapterReader
