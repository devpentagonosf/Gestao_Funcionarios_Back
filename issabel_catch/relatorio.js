import puppeteer from 'puppeteer';
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

const logFilePath = path.resolve(__dirname, 'relatorio_logs.txt');
const log = (message) => {
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
    console.log(`[${timestamp}] ${message}`);
};

// Sobrescreve o log no início da execução
fs.writeFileSync(logFilePath, ''); // Limpa o conteúdo do arquivo de log

// Adicione um log para capturar erros gerais
process.on('uncaughtException', (err) => {
    fs.appendFileSync(logFilePath, `[ERRO] Uncaught Exception: ${err.message}\n`);
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    fs.appendFileSync(logFilePath, `[ERRO] Unhandled Rejection: ${reason}\n`);
    console.error('Unhandled Rejection:', reason);
});

const expectedHeader = `"Data","Origem","Grupo de Chamada","Destino","Canal de Origem","Protocolo","Canal de Destino","Estado","Duração","UniqueID","User Field","DID","CEL"`;

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error('Erro: MONGO_URI não definido no arquivo .env');
    process.exit(1);
}

const saveToDatabase = async (data, date) => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Conexão com MongoDB estabelecida.');

        const existingRecords = await RamalModel.find({ 'registros.data': date });
        console.log(`Registros existentes para a data ${date}: ${existingRecords.length}`);

        if (existingRecords.length > 0) {
            console.log(`Removendo registros existentes para a data ${date}...`);
            await RamalModel.updateMany({}, { $pull: { registros: { data: date } } });
        }

        for (const ramal in data) {
            const { tempo_ligacao, qtd_ligacoes } = data[ramal];
            const existingRamal = await RamalModel.findOne({ ramal });

            if (existingRamal) {
                console.log(`Atualizando ramal ${ramal}...`);
                existingRamal.registros.push({ data: date, qtd_ligacoes, tempo_ligacao });
                await existingRamal.save();
            } else {
                console.log(`Criando novo registro para ramal ${ramal}...`);
                const newRamal = new RamalModel({
                    ramal,
                    registros: [{ data: date, qtd_ligacoes, tempo_ligacao }],
                });
                await newRamal.save();
            }
        }

        console.log('Dados salvos no MongoDB com sucesso.');
    } catch (error) {
        console.error('Erro ao salvar no MongoDB:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Conexão com MongoDB encerrada.');
    }
};

const processCSV = (inputFilePath, outputDir) => {
    console.log('Iniciando processamento do arquivo CSV...');
    const results = {};
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // Ajustado para YYYY-MM-DD
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
            console.log('Processamento do CSV concluído.');
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

(async () => {
    let attempt = 0;
    let success = false;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < 5 && !success) { // Alterado para 5 tentativas
        attempt++;
        log(`Iniciando tentativa ${attempt} para baixar o relatório.`);

        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] // Adicionado --disable-gpu
        });
        const page = await browser.newPage();

        const [width, height] = [1920, 1080];
        await page.setViewport({ width, height }); // Set the viewport to maximize the browser window

        const downloadPath = path.resolve(__dirname, 'Relatorios_CSV');
        fs.mkdirSync(downloadPath, { recursive: true });
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        try {
            log('Acessando página de login...');
            await page.goto('https://pentagonosfserver.myddns.me:4006/index.php', { waitUntil: 'networkidle2' });

            log('Preenchendo credenciais...');
            await page.type('#input_user', 'admin');
            await page.type('input[name="input_pass"]', 'Pentagono@2025');
            await page.click('button[name="submit_login"]');

            // Aguarda 10 segundos antes de atualizar a página
            log('Aguardando 10 segundos antes de atualizar a página...');
            await delay(10000);

            // Atualiza a página
            log('Atualizando a página...');
            await page.reload({ waitUntil: 'networkidle2' });

            // Aguarda 5 segundos antes de acessar a URL dos relatórios
            log('Aguardando 5 segundos antes de acessar a página de relatórios...');
            await delay(5000);

            log('Acessando página de relatórios...');
            await page.goto('https://pentagonosfserver.myddns.me:4006/index.php?menu=cdrreport', { waitUntil: 'networkidle2' });

            log('Iniciando download do relatório CSV...');
            await page.click('button.buttons-csv');
            await delay(10000); // Replaced page.waitForTimeout with delay

            const files = fs.readdirSync(downloadPath);
            const csvFile = files.find(file => file.endsWith('.csv'));
            if (csvFile) {
                const now = new Date();
                const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
                const newFileName = `relatorio_ligacoes_${formattedDate}.csv`;
                const filePath = path.join(downloadPath, csvFile);
                const newFilePath = path.join(downloadPath, newFileName);
                fs.renameSync(filePath, newFilePath);
                log(`Relatório salvo como: ${newFileName}`);

                const fileContent = fs.readFileSync(newFilePath, 'utf8');
                const fileHeader = fileContent.split('\n')[0].trim();
                if (fileHeader === expectedHeader) {
                    log('Cabeçalho do relatório está correto. Processo concluído com sucesso.');
                    success = true;

                    const outputDir = path.resolve(__dirname, 'Tratados_CSV');
                    processCSV(newFilePath, outputDir);
                } else {
                    log('Cabeçalho do relatório está incorreto. Tentando novamente.');
                }
            } else {
                log('Erro: Arquivo CSV não encontrado no diretório de download.');
            }
        } catch (error) {
            log(`Erro durante a tentativa ${attempt}: ${error.message}`);
        } finally {
            await browser.close();
        }
    }

    if (!success) {
        log('Falha após 5 tentativas. O cabeçalho do relatório não corresponde ao esperado.');
    }
})();
