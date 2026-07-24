import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import routeRoutes from './routes/routes.js';
import feeRoutes from './routes/fee.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/fee', feeRoutes);

// Serve static client build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`BGS Transport Server running on port ${PORT}`);
});
