import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

function NovelDetail() {
  const { novelId } = useParams()
  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [bookmark, setBookmark] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchNovelData()
  }, [novelId])

  async function fetchNovelData() {
    setLoading(true)
    try {
      const [novelRes, chaptersRes, bookmarkRes] = await Promise.all([
        fetch(`/api/novels/${novelId}`),
        fetch(`/api/novels/${novelId}/chapters`),
        fetch(`/api/bookmarks/${novelId}`)
      ])
      
      if (!novelRes.ok) throw new Error('Novel not found')
      
      const novelData = await novelRes.json()
      const chaptersData = await chaptersRes.json()
      const bookmarkData = await bookmarkRes.json()
      
      setNovel(novelData)
      setChapters(chaptersData)
      setBookmark(bookmarkData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !novel) {
    return (
      <div className="error">
        <p>Error: {error || 'Novel not found'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          ← Back to Home
        </Link>
      </div>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            📖 AiNovel
          </Link>
        </div>
      </header>
      
      <main className="novel-detail fade-in">
        <Link to="/" className="back-btn">
          ← Back to Library
        </Link>
        
        <div className="novel-header">
          <h1 className="novel-title">{novel.title}</h1>
          <p className="novel-author">by {novel.author}</p>
          
          <div className="novel-stats">
            <div className="stat">
              <span className="stat-label">Status</span>
              <span className="stat-value" style={{ textTransform: 'capitalize' }}>
                {novel.status}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Chapters</span>
              <span className="stat-value">{novel.total_chapters}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Words</span>
              <span className="stat-value">{formatNumber(novel.total_words)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Language</span>
              <span className="stat-value">{novel.language}</span>
            </div>
          </div>
          
          <p className="novel-description">{novel.description}</p>
          
          <div className="reading-actions">
            {bookmark ? (
              <Link 
                to={`/${novelId}/${bookmark.chapter_order}`} 
                className="btn btn-primary"
              >
                📖 Continue Reading (Ch. {bookmark.chapter_order})
              </Link>
            ) : (
              <Link to={`/${novelId}/1`} className="btn btn-primary">
                📖 Start Reading
              </Link>
            )}
            <Link to={`/${novelId}/1`} className="btn btn-secondary">
              Ch. 1
            </Link>
          </div>
        </div>
        
        <div className="toc-section">
          <h2 className="toc-title">📑 Table of Contents ({chapters.length} chapters)</h2>
          <ul className="toc-list">
            {chapters.map((chapter) => (
              <li key={chapter.chapter_id} className="toc-item">
                <Link 
                  to={`/${novelId}/${chapter.order}`}
                  className={`toc-link ${bookmark?.chapter_order === chapter.order ? 'bookmarked' : ''}`}
                >
                  {bookmark?.chapter_order === chapter.order && '📖 '}
                  {chapter.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}

export default NovelDetail
