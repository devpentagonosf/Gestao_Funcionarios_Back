import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RamalModel from './ramalModel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.resolve(__dirname, 'relatorio_completo_logs.txt');
const log = (message) => {
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
    console.log(`[${timestamp}] ${message}`);
};

const expectedHeader = `"Data","Origem","Grupo de Chamada","Destino","Canal de Origem","Protocolo","Canal de Destino","Estado","Duração"`;

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error('Erro: MONGO_URI não definido no arquivo .env');
    process.exit(1);
}

const saveToDatabase = async (data) => {
    try {
        console.log('Conectando ao MongoDB...');
        mongoose.set('bufferCommands', false); // Desativar buffering para evitar timeouts
        mongoose.set('maxTimeMS', 30000);      // Definir tempo máximo para consultas (30 segundos)
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000, // Aumentar o tempo limite para 30 segundos
            socketTimeoutMS: 45000,         // Aumentar o tempo limite do socket para 45 segundos
        });
        console.log('Conexão com MongoDB estabelecida.');

        for (const ramal in data) {
            const registros = data[ramal];
            const existingRamal = await RamalModel.findOne({ ramal }).lean(); // Usar lean() para melhorar desempenho

            if (existingRamal) {
                console.log(`Atualizando ramal ${ramal}...`);
                registros.forEach(registro => existingRamal.registros.push(registro));
                await RamalModel.updateOne({ ramal }, { $set: { registros: existingRamal.registros } });
            } else {
                console.log(`Criando novo registro para ramal ${ramal}...`);
                const newRamal = new RamalModel({
                    ramal,
                    registros,
                });
                await newRamal.save();
            }
        }

        console.log('Dados salvos no MongoDB com sucesso.');
    } catch (error) {
        console.error('Erro ao salvar no MongoDB:', error.message);
    } finally {
        try {
            await mongoose.disconnect();
            console.log('Conexão com MongoDB encerrada.');
        } catch (disconnectError) {
            console.error('Erro ao encerrar a conexão com MongoDB:', disconnectError.message);
        }
    }
};

const processCSV = (inputFilePath, outputDir) => {
    console.log('Iniciando processamento do arquivo CSV...');
    const results = {};
    const outputFilePath = path.join(outputDir, `relatorio_final_completo.csv`);

    fs.mkdirSync(outputDir, { recursive: true });

    fs.createReadStream(inputFilePath)
        .pipe(csvParser({ separator: ',' }))
        .on('data', (row) => {
            const ramal = row['Origem'];
            const duracao = row['Duração'];
            const dataCompleta = row['Data'];
            const data = dataCompleta.split(' ')[0]; // Extrair apenas a data (YYYY-MM-DD)

            if (!results[ramal]) {
                results[ramal] = [];
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

            const tempoLigacao = totalSegundos / 60;

            const existingRecord = results[ramal].find(record => record.data === data);
            if (existingRecord) {
                existingRecord.qtd_ligacoes += 1;
                existingRecord.tempo_ligacao += tempoLigacao;
            } else {
                results[ramal].push({ data, qtd_ligacoes: 1, tempo_ligacao: tempoLigacao });
            }
        })
        .on('end', async () => {
            console.log('Processamento do CSV concluído.');
            const outputData = ['Ramal;Tempo_Chamadas;QTD_Chamadas;Data'];
            for (const ramal in results) {
                results[ramal].forEach(({ data, qtd_ligacoes, tempo_ligacao }) => {
                    outputData.push(`${ramal};${tempo_ligacao.toFixed(2)};${qtd_ligacoes};${data}`);
                });
            }
            fs.writeFileSync(outputFilePath, outputData.join('\n'), 'utf8');
            log(`Relatório tratado salvo como: ${outputFilePath}`);

            await saveToDatabase(results);
        })
        .on('error', (error) => {
            log(`Erro ao processar o CSV: ${error.message}`);
        });
};

(async () => {
    const downloadPath = path.resolve(__dirname, 'Relatorio_Avulso');
    const outputDir = path.resolve(__dirname, 'Tratados_CSV');

    const files = fs.readdirSync(downloadPath);
    const csvFile = files.find(file => file.endsWith('.csv'));

    if (csvFile) {
        const filePath = path.join(downloadPath, csvFile);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileHeader = fileContent.split('\n')[0].trim();

        if (fileHeader === expectedHeader) {
            log('Cabeçalho do relatório está correto. Iniciando processamento.');
            processCSV(filePath, outputDir);
        } else {
            log('Cabeçalho do relatório está incorreto. Verifique o arquivo.');
        }
    } else {
        log('Erro: Nenhum arquivo CSV encontrado na pasta Relatorio_Avulso.');
    }
})();
