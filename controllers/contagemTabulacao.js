import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ContagemTab from '../models/ContagemTab.js';

dotenv.config();

export const countTabulations = async () => {
  try {
    console.log('Atualizando Dados - Aguarde.');

    // Conecta ao MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    const db = mongoose.connection.db;

    // Acessa a coleção users
    const usersCollection = db.collection('users');
    const activeUsers = await usersCollection.find({ 
      status: { $regex: /^Ativo$/i }, 
      role: { $ne: 'ADM' } 
    }).toArray();

    if (activeUsers.length === 0) {
      console.log('Nenhum usuário ativo encontrado.');
      mongoose.connection.close();
      return;
    }

    // Acessa a coleção histories
    const historiesCollection = db.collection('histories');
    const startDate = new Date('2025-04-01'); // Filtro para considerar apenas dados a partir de 01-04-2025

    // Processa todos os usuários ativos
    const bulkOperations = [];

    for (const user of activeUsers) {
      const userId = user._id.toString();
      const ramal = user.ramal || 'N/A';

      // Agrega todas as operações relevantes em uma única consulta
      const operations = await historiesCollection.aggregate([
        { 
          $match: { 
            userId: userId, 
            date: { $gte: startDate }, 
            operation: { $in: ['TABULACAO', 'CONSULTA-PG', 'CONSULTA-FREE'] } 
          } 
        },
        {
          $group: {
            _id: { month: { $month: { $toDate: "$date" } }, year: { $year: { $toDate: "$date" } }, operation: "$operation" },
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      // Organiza os resultados por mês/ano
      const groupedResults = {};
      operations.forEach(op => {
        const mes_ano = `${op._id.month.toString().padStart(2, '0')}/${op._id.year}`;
        if (!groupedResults[mes_ano]) {
          groupedResults[mes_ano] = { qtd_tabulacao: 0, qtd_consultas_paga: 0, qtd_consultas_free: 0 };
        }
        if (op._id.operation === 'TABULACAO') groupedResults[mes_ano].qtd_tabulacao = op.count;
        if (op._id.operation === 'CONSULTA-PG') groupedResults[mes_ano].qtd_consultas_paga = op.count;
        if (op._id.operation === 'CONSULTA-FREE') groupedResults[mes_ano].qtd_consultas_free = op.count;
      });

      // Prepara operações em massa para inserir ou atualizar registros
      for (const [mes_ano, counts] of Object.entries(groupedResults)) {
        bulkOperations.push({
          updateOne: {
            filter: { userId, mes_ano },
            update: {
              $set: {
                email: user.email,
                ramal: ramal,
                qtd_tabulacao: counts.qtd_tabulacao,
                qtd_consultas_paga: counts.qtd_consultas_paga,
                qtd_consultas_free: counts.qtd_consultas_free,
              }
            },
            upsert: true
          }
        });
      }
    }

    // Executa as operações em massa
    if (bulkOperations.length > 0) {
      await ContagemTab.bulkWrite(bulkOperations);
    }

    console.log('Registros Atualizados');
    mongoose.connection.close();
  } catch (error) {
    console.error('Erro ao processar tabulações:', error);
    mongoose.connection.close();
  }
};