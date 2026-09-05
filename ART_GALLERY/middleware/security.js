const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.'
});

// Security middleware configuration
const securityMiddleware = [
    // Basic security headers
    helmet(),
    
    // Rate limiting
    limiter,
    
    // XSS prevention
    xss(),
    
    // Parameter pollution prevention
    hpp(),
    
    // Custom security headers
    (req, res, next) => {
        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        next();
    }
];

module.exports = securityMiddleware;
