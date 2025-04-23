import dotenv from 'dotenv';
import { countTabulations } from './controllers/contagemTabulacao.js';
import { contagemRamal } from './controllers/contagemRamal.js';

dotenv.config();

const executeScripts = async () => {
  try {
    console.log('Iniciando execução do script Agenda_Desempenho.');

    // Executa contagemTabulacao.js
    console.log('Executando contagemTabulacao.js...');
    await countTabulations();

    // Executa contagemRamal.js
    console.log('Executando contagemRamal.js...');
    await contagemRamal();

    console.log('Execução do script Agenda_Desempenho concluída.');
  } catch (error) {
    console.error('Erro durante a execução do script Agenda_Desempenho:', error);
  }
};

executeScripts();
