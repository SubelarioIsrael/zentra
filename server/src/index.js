import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import './db/supabase.js';
import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'zentra-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api', subjectRoutes);
app.use('/api', quizRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Server error' });
});

app.listen(config.port, () => {
  console.log(`Zentra API running on http://localhost:${config.port}`);
});
