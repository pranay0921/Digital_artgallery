const express = require('express');
const router = express.Router();
const db = require('../config/database');
const upload = require('../config/multer');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Upload artwork
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, description, category, price } = req.body;
        const image_url = `/uploads/${req.file.filename}`;

        const [result] = await db.execute(
            'INSERT INTO artworks (title, description, category, image_url, artist_id, price) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, category, image_url, req.user.id, price]
        );

        res.json({
            success: true,
            artwork_id: result.insertId,
            message: 'Artwork uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading artwork:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading artwork'
        });
    }
});

// Get all artworks with artist name and like count
router.get('/', async (req, res) => {
    try {
        const [artworks] = await db.execute(`
            SELECT a.*, u.username AS artist_name,
                (SELECT COUNT(*) FROM likes l WHERE l.artwork_id = a.id) AS likes_count
            FROM artworks a
            JOIN users u ON a.artist_id = u.id
            ORDER BY a.created_at DESC
        `);
        res.json(artworks);
    } catch (error) {
        console.error('Error fetching artworks:', error);
        res.status(500).json({ error: error.message });
    }
});

// Like an artwork
router.post('/:id/like', auth, async (req, res) => {
    try {
        const artworkId = req.params.id;

        // Check if user already liked the artwork
        const [existing] = await db.execute(
            'SELECT * FROM likes WHERE artwork_id = ? AND user_id = ?',
            [artworkId, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'You already liked this artwork' });
        }

        await db.execute(
            'INSERT INTO likes (artwork_id, user_id) VALUES (?, ?)',
            [artworkId, req.user.id]
        );

        // Return updated like count
        const [likeCountResult] = await db.execute(
            'SELECT COUNT(*) AS likes_count FROM likes WHERE artwork_id = ?',
            [artworkId]
        );

        res.json({
            message: 'Artwork liked successfully',
            likes_count: likeCountResult[0].likes_count
        });
    } catch (error) {
        console.error('Error liking artwork:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete an artwork
router.delete('/:id', auth, async (req, res) => {
    try {
        const artworkId = req.params.id;

        // Check if artwork belongs to the logged-in user
        const [rows] = await db.execute(
            'SELECT * FROM artworks WHERE id = ? AND artist_id = ?',
            [artworkId, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized or artwork not found' });
        }

        const artwork = rows[0];

        // Delete image file if exists
        if (artwork.image_url) {
            const filePath = path.join(__dirname, '..', 'public', artwork.image_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // Delete likes related to this artwork first
        await db.execute('DELETE FROM likes WHERE artwork_id = ?', [artworkId]);

        // Delete artwork
        await db.execute('DELETE FROM artworks WHERE id = ?', [artworkId]);

        res.json({ success: true, message: 'Artwork deleted successfully' });
    } catch (error) {
        console.error('Error deleting artwork:', error);
        res.status(500).json({ error: 'Failed to delete artwork' });
    }
});

module.exports = router;
