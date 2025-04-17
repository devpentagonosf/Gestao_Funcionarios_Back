import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Para compatibilidade com __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const csvFilePath = path.join(__dirname, 'Pentágono Soluções Financeiras - Colaboradores (respostas) - Respostas ao formulário 1.csv');
const notFoundLogPath = path.join(__dirname, 'emails_nao_encontrados.txt');

const sanitize = (value) => {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'não tem') {
    return null;
  }
  return value.trim();
};

async function updateDatabase() {
  const client = new MongoClient(uri);
  const notFoundEmails = [];

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const updates = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const email = row['E-mail COORPORATIVO / E-mail CRM']?.trim().toLowerCase();
        if (email) {
          updates.push({
            email,
            update: {
              ramal: sanitize(row['Ramal']),
              cpf: sanitize(row['CPF']),
              cnpj: sanitize(row['CNPJ - Caso Possua']),
              telefone: sanitize(row['Telefone de Contato']),
              sigla: sanitize(row['SIGLA Utilizada - Preencha com a SIGLA que você utiliza no dia a dia.']),
            },
          });
        }
      })
      .on('end', async () => {
        for (const { email, update } of updates) {
          const result = await usersCollection.updateOne(
            { email },
            { $set: update }
          );

          if (result.modifiedCount > 0) {
            console.log(`✅ Atualizado: ${email}`);
          } else {
            console.log(`❌ Não encontrado: ${email}`);
            notFoundEmails.push(email);
          }
        }

        if (notFoundEmails.length > 0) {
          fs.writeFileSync(notFoundLogPath, notFoundEmails.join('\n'), 'utf8');
          console.log(`⚠️ Log criado com ${notFoundEmails.length} e-mails não encontrados: ${notFoundLogPath}`);
        } else {
          console.log('🎉 Todos os e-mails foram encontrados e atualizados.');
        }

        await client.close();
      });

  } catch (error) {
    console.error('Erro ao atualizar o banco de dados:', error);
    await client.close();
  }
}

updateDatabase();
