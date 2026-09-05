const express = require('express');
const router = express.Router();
const db = require('../config/database');
const isAdmin = require('../middleware/isAdmin');

// Protect all admin routes
router.use(isAdmin);

// Get moderation stats
router.get('/stats', async (req, res) => {
    try {
        // Count users by role
        const [[userStats]] = await db.execute(`
            SELECT 
                COUNT(CASE WHEN role = 'user' OR role = 'artist' THEN 1 END) as active_users,
                COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users
            FROM users
        `);
        
        // Count artworks
        const [[artworks]] = await db.execute('SELECT COUNT(*) as count FROM artworks');
        
        // Count reported content (assuming reports through comments)
        const [[reportedContent]] = await db.execute(`
            SELECT COUNT(DISTINCT artwork_id) as count 
            FROM comments 
            WHERE content LIKE '%report%'
        `);
        
        const stats = {
            activeUsers: userStats.active_users || 0,
            bannedUsers: 0, // Since we don't have banned status, showing 0
            artworks: artworks.count || 0,
            reportedContent: reportedContent.count || 0
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get users list with filter options
router.get('/users', async (req, res) => {
    try {
        const status = req.query.status || 'all';
        let query = `
            SELECT id, username, email, role, is_active, created_at 
            FROM users
            ${status !== 'all' ? 'WHERE is_active = ?' : ''}
            ORDER BY created_at DESC
        `;
        
        const [users] = await db.execute(query, 
            status !== 'all' ? [status === 'active'] : []
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Ban/Unban user
router.put('/users/:id/status', async (req, res) => {
    try {
        const { is_active } = req.body;
        await db.execute(
            'UPDATE users SET is_active = ? WHERE id = ?',
            [is_active, req.params.id]
        );
        
        // Log moderation action
        await db.execute(
            'INSERT INTO audit_log (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, is_active ? 'UNBAN_USER' : 'BAN_USER', 'users', req.params.id]
        );
        
        res.json({ message: `User ${is_active ? 'unbanned' : 'banned'} successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Get artworks list with filter options
router.get('/artworks', async (req, res) => {
    try {
        const status = req.query.status || 'all';
        let query = `
            SELECT a.*, u.username as artist_name, COUNT(r.artwork_id) as reports
            FROM artworks a
            LEFT JOIN users u ON a.artist_id = u.id
            LEFT JOIN reports r ON a.id = r.artwork_id
            ${status === 'reported' ? 'HAVING reports > 0' : ''}
            GROUP BY a.id
            ORDER BY reports DESC, a.created_at DESC
        `;
        
        const [artworks] = await db.execute(query);
        res.json(artworks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch artworks' });
    }
});

// Remove artwork
router.delete('/artworks/:id', async (req, res) => {
    try {
        await db.execute('UPDATE artworks SET is_active = false WHERE id = ?', [req.params.id]);
        
        // Log moderation action
        await db.execute(
            'INSERT INTO audit_log (user_id, action_type, table_name, record_id) VALUES (?, ?, ?, ?)',
            [req.user.id, 'REMOVE_ARTWORK', 'artworks', req.params.id]
        );
        
        res.json({ message: 'Artwork removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove artwork' });
    }
});

// Get moderation log
router.get('/audit-log', async (req, res) => {
    try {
        const [logs] = await db.execute(`
            SELECT al.*, u.username as moderator_name
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

module.exports = router;
