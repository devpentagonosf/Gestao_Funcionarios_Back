import connectToMongoDB from '../database/mongoConnection.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import contagemRamalModel from '../models/ContagemRamal.js';

dotenv.config();

const contagemRamal = async () => {
  try {
    await connectToMongoDB(process.env.MONGO_URI);

    await contagemRamalModel(process.env.DB_NAME);
  } catch (error) {
    console.error('Erro ao processar os dados:', error);
  } finally {
    mongoose.connection.close();
  }
};

export { contagemRamal };