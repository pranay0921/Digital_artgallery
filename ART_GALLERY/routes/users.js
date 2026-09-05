const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const auth = require('../middleware/auth');

// Configure multer for profile pictures
const storage = multer.diskStorage({
    destination: 'public/uploads/profiles',
    filename: (req, file, cb) => {
        cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const [userRows] = await db.execute(
            'SELECT id, username, email, role, profile_pic, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!userRows.length) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRows[0];
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            profilePic: user.profile_pic
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});


// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { username, email } = req.body;
        await db.execute(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload profile picture
router.post('/profile-picture', auth, upload.single('profilePic'), async (req, res) => {
    try {
        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        await db.execute(
            'UPDATE users SET profile_pic = ? WHERE id = ?',
            [imageUrl, req.user.id]
        );

        res.json({ imageUrl });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ error: error.message });
    }
});

// Remove profile picture
router.delete('/profile-picture', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT profile_pic FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentPic = rows[0].profile_pic;

        // Delete old file if exists
        if (currentPic) {
            const filePath = path.join(__dirname, '..', 'public', currentPic.replace(/^\//, ''));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Set profile_pic = NULL in DB
        await db.execute(
            'UPDATE users SET profile_pic = NULL WHERE id = ?',
            [req.user.id]
        );

        res.json({ success: true, message: 'Profile picture removed' });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({ error: 'Failed to remove profile picture' });
    }
});

// Get user's artworks
router.get('/my-artworks', auth, async (req, res) => {
    try {
        const [artworks] = await db.execute(`
            SELECT a.*, u.username as artist_name 
            FROM artworks a 
            JOIN users u ON a.artist_id = u.id 
            WHERE a.artist_id = ? 
            ORDER BY a.created_at DESC`,
            [req.user.id]
        );
        res.json(artworks);
    } catch (error) {
        console.error('Error fetching user artworks:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
