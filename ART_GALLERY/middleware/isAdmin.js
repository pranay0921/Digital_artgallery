const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function isAdmin(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const [rows] = await db.execute(
            'SELECT id, username, role FROM users WHERE id = ? AND role = "admin"',
            [decoded.userId]
        );

        if (!rows[0]) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Add user info to request for use in routes
        req.user = {
            ...decoded,
            username: rows[0].username,
            role: rows[0].role
        };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = isAdmin;
