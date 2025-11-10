const express = require('express');
const cors = require('cors');
const app = express();

// Simple CORS setup
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://127.0.0.1:5502', 'http://localhost:5000'],
    credentials: true
}));

app.use(express.json());

// Basic health endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Test server is running!',
        timestamp: new Date().toISOString()
    });
});

// Basic login endpoint for testing
app.post('/api/auth/login', (req, res) => {
    console.log('Login attempt:', req.body);
    
    // Simple test credentials
    if (req.body.email === 'admin@dfm.com' && req.body.password === 'password') {
        res.json({
            token: 'test-jwt-token-12345',
            user: {
                id: 1,
                name: 'Admin User',
                email: 'admin@dfm.com',
                role: 'admin'
            }
        });
    } else {
        res.status(401).json({
            message: 'Invalid credentials'
        });
    }
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Test server running on http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});