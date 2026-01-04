import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Home() {
  const [novels, setNovels] = useState([])
  const [bookmarks, setBookmarks] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [novelsRes, bookmarksRes] = await Promise.all([
        fetch('/api/novels'),
        fetch('/api/bookmarks')
      ])
      
      if (!novelsRes.ok) throw new Error('Failed to fetch novels')
      
      const novelsData = await novelsRes.json()
      const bookmarksData = await bookmarksRes.json()
      
      // Create bookmark lookup
      const bookmarkMap = {}
      bookmarksData.forEach(b => {
        bookmarkMap[b.novel_id] = b
      })
      
      setNovels(novelsData)
      setBookmarks(bookmarkMap)
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

  if (error) {
    return <div className="error">Error: {error}</div>
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
      
      <main className="home-page">
        <h1 className="home-title">📚 Novel Library</h1>
        
        <div className="novels-grid">
          {novels.map((novel) => (
            <Link
              key={novel.novel_id}
              to={`/${novel.novel_id}`}
              className="novel-card"
            >
              <div className="novel-card-content">
                <h2 className="novel-card-title">{novel.title}</h2>
                <p className="novel-card-author">by {novel.author}</p>
                <p className="novel-card-desc">{novel.description}</p>
                <div className="novel-card-meta">
                  <span>{novel.total_chapters} chapters</span>
                  <span>{formatNumber(novel.total_words)} words</span>
                  <span className={`novel-card-status ${novel.status}`}>
                    {novel.status}
                  </span>
                </div>
                {bookmarks[novel.novel_id] && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--accent)' }}>
                    📖 Reading: Ch. {bookmarks[novel.novel_id].chapter_order}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {novels.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No novels found in the library.
          </p>
        )}
      </main>
    </>
  )
}

export default Home
