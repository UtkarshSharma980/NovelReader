const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// MongoDB connection
let db;
const mongoUri = process.env.MONGODB_URI || 'mongodb://192.168.29.224:27017/translated_novels';

async function connectDB() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Get all novels
app.get('/api/novels', async (req, res) => {
  try {
    const novels = await db.collection('novels').find({}).toArray();
    res.json(novels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single novel by novel_id
app.get('/api/novels/:novelId', async (req, res) => {
  try {
    const novel = await db.collection('novels').findOne({ novel_id: req.params.novelId });
    if (!novel) {
      return res.status(404).json({ error: 'Novel not found' });
    }
    res.json(novel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get chapters list for a novel (without content for TOC)
app.get('/api/novels/:novelId/chapters', async (req, res) => {
  try {
    const chapters = await db.collection('chapters')
      .find({ novel_id: req.params.novelId })
      .project({ content: 0 })
      .sort({ order: 1 })
      .toArray();
    res.json(chapters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single chapter by novel_id and chapter order
app.get('/api/novels/:novelId/chapters/:chapterOrder', async (req, res) => {
  try {
    const chapterOrder = parseInt(req.params.chapterOrder);
    const chapter = await db.collection('chapters').findOne({
      novel_id: req.params.novelId,
      order: chapterOrder
    });
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    // Get total chapters count for navigation
    const totalChapters = await db.collection('chapters').countDocuments({ novel_id: req.params.novelId });
    
    res.json({ ...chapter, totalChapters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookmarks endpoints
// Get bookmark for a novel
app.get('/api/bookmarks/:novelId', async (req, res) => {
  try {
    const bookmark = await db.collection('bookmarks').findOne({ novel_id: req.params.novelId });
    res.json(bookmark || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bookmarks
app.get('/api/bookmarks', async (req, res) => {
  try {
    const bookmarks = await db.collection('bookmarks').find({}).toArray();
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update bookmark
app.post('/api/bookmarks', async (req, res) => {
  try {
    const { novel_id, chapter_order, chapter_title, novel_title } = req.body;
    
    const bookmark = {
      novel_id,
      chapter_order,
      chapter_title,
      novel_title,
      updated_at: new Date()
    };
    
    await db.collection('bookmarks').updateOne(
      { novel_id },
      { $set: bookmark, $setOnInsert: { created_at: new Date() } },
      { upsert: true }
    );
    
    res.json({ success: true, bookmark });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bookmark
app.delete('/api/bookmarks/:novelId', async (req, res) => {
  try {
    await db.collection('bookmarks').deleteOne({ novel_id: req.params.novelId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend for all other routes in production (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Start server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
