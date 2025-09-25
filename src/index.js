require('dotenv').config();
const express = require('express');
const corsMiddleware = require('./middleware/cors.middleware');
const cors = require('cors');
const authRoutes = require('./routes/auth.router');
const contractRoutes = require('./routes/router.contract');
const notesRoutes = require('./routes/notes.router');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(corsMiddleware);
app.use(
    cors({
        origin: 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
        ],
    })
);

app.use('/uploads', express.static('uploads'));

app.use('/api', authRoutes);
app.use('/api/contracts/', contractRoutes);
app.use('/api/notes', notesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
