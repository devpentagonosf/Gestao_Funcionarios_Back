import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import RamalModel from '../models/ramalModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = (message) => {
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    console.log(`[${timestamp}] ${message}`);
};

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error('Erro: MONGO_URI não definido no arquivo .env');
    process.exit(1);
}

const saveToDatabase = async (data, date) => {
    try {
        log('Conectando ao MongoDB...');
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        log('Conexão com MongoDB estabelecida.');

        const existingRecords = await RamalModel.find({ 'registros.data': date });
        log(`Registros existentes para a data ${date}: ${existingRecords.length}`);

        if (existingRecords.length > 0) {
            log(`Removendo registros existentes para a data ${date}...`);
            await RamalModel.updateMany({}, { $pull: { registros: { data: date } } });
        }

        for (const ramal in data) {
            const { tempo_ligacao, qtd_ligacoes } = data[ramal];
            const existingRamal = await RamalModel.findOne({ ramal });

            if (existingRamal) {
                log(`Atualizando ramal ${ramal}...`);
                existingRamal.registros.push({ data: date, qtd_ligacoes, tempo_ligacao });
                await existingRamal.save();
            } else {
                log(`Criando novo registro para ramal ${ramal}...`);
                const newRamal = new RamalModel({
                    ramal,
                    registros: [{ data: date, qtd_ligacoes, tempo_ligacao }],
                });
                await newRamal.save();
            }
        }

        log('Dados salvos no MongoDB com sucesso.');
    } catch (error) {
        console.error('Erro ao salvar no MongoDB:', error.message);
    } finally {
        await mongoose.disconnect();
        log('Conexão com MongoDB encerrada.');
    }
};

const processCSV = (inputFilePath, outputDir, customDate = null) => {
    log('Iniciando processamento do arquivo CSV...');
    const results = {};
    const now = new Date();
    const formattedDate = customDate || `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const outputFilePath = path.join(outputDir, `relatorio_final_${formattedDate}.csv`);

    fs.mkdirSync(outputDir, { recursive: true });

    fs.createReadStream(inputFilePath)
        .pipe(csvParser({ separator: ',' }))
        .on('data', (row) => {
            const ramal = row['Origem'];
            const duracao = row['Duração'];

            if (!results[ramal]) {
                results[ramal] = { tempo_ligacao: 0, qtd_ligacoes: 0 };
            }

            let totalSegundos = 0;

            if (duracao.includes('m')) {
                const [minutos, segundos] = duracao.split('m').map(part => part.trim());
                totalSegundos += parseInt(minutos) * 60;
                if (segundos) {
                    totalSegundos += parseInt(segundos.replace('s', '').trim());
                }
            } else if (duracao.includes('s')) {
                totalSegundos += parseInt(duracao.replace('s', '').trim());
            }

            results[ramal].tempo_ligacao += totalSegundos / 60;
            results[ramal].qtd_ligacoes += 1;
        })
        .on('end', async () => {
            log('Processamento do CSV concluído.');
            const outputData = ['Ramal;Tempo_Chamadas;QTD_Chamadas;Data'];
            for (const ramal in results) {
                const { tempo_ligacao, qtd_ligacoes } = results[ramal];
                outputData.push(`${ramal};${tempo_ligacao.toFixed(2)};${qtd_ligacoes};${formattedDate}`);
            }
            fs.writeFileSync(outputFilePath, outputData.join('\n'), 'utf8');
            log(`Relatório tratado salvo como: ${outputFilePath}`);

            await saveToDatabase(results, formattedDate);
        })
        .on('error', (error) => {
            log(`Erro ao processar o CSV: ${error.message}`);
        });
};

const inputDir = path.resolve(__dirname, 'Relatorio_Mensal'); // Correctly resolve the path to the folder
const outputDir = path.resolve(__dirname, 'Tratados_CSV');

if (fs.existsSync(inputDir)) {
    const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.csv'));
    if (files.length > 0) {
        const inputFilePath = path.join(inputDir, files[0]);
        processCSV(inputFilePath, outputDir, '16-04-2025'); // Pass custom date here if needed
    } else {
        log('Erro: Nenhum arquivo CSV encontrado na pasta Relatorio_Mensal.');
    }
} else {
    log('Erro: A pasta Relatorio_Mensal não foi encontrada.');
}
