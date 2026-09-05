const jwt = require('jsonwebtoken');
const db = require('../config/database');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        
        const [users] = await db.execute('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.userId]);
        
        if (!users.length) {
            throw new Error();
        }
        
        req.user = users[0];
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication required' });
    }
};
