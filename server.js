import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import apiRoutes from './routes/apiRoutes.js';
import connectToMongoDB from './database/mongoConnection.js';

console.log('Environment Variables:', {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
});

const app = express();

const allowedOrigins = ['http://localhost:5173', 'https://funcionarios.pentagonosf.com.br'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

const mongoUri = process.env.MONGO_URI;

connectToMongoDB(mongoUri);

app.use('/', apiRoutes);

app.post('/', (req, res) => {
  res.status(200).send('API READY');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});