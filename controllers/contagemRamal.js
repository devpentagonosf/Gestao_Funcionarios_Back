import connectToMongoDB from '../database/mongoConnection.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import contagemRamalModel from '../models/ContagemRamal.js';

dotenv.config();

const contagemRamal = async () => {
  try {
    console.log('Conectando ao MongoDB...');
    await connectToMongoDB(process.env.MONGO_URI);

    console.log('Executando contagemRamalModel...');
    const resultados = await contagemRamalModel(process.env.DB_NAME);

    console.log('Resultados do processamento:', resultados);
  } catch (error) {
    console.error('Erro ao processar os dados:', error);
  } finally {
    mongoose.connection.close();
    console.log('Conexão com o MongoDB encerrada.');
  }
};

export { contagemRamal };