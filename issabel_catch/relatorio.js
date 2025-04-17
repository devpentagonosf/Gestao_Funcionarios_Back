import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logFilePath = path.resolve(__dirname, 'relatorio_logs.txt');
const log = (message) => {
    const now = new Date();
    const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
};

const expectedHeader = `"Data","Origem","Grupo de Chamada","Destino","Canal de Origem","Protocolo","Canal de Destino","Estado","Duração","UniqueID","User Field","DID","CEL"`;

(async () => {
    let attempt = 0;
    let success = false;

    while (attempt < 3 && !success) {
        attempt++;
        log(`Iniciando tentativa ${attempt} para baixar o relatório.`);

        const browser = await puppeteer.launch({ headless: false, args: ['--start-maximized'] });
        const page = await browser.newPage();

        const [width, height] = [1920, 1080];
        await page.setViewport({ width, height });

        const downloadPath = path.resolve(__dirname, 'Relatorios_CSV');
        fs.mkdirSync(downloadPath, { recursive: true });
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath,
        });

        try {
            await page.goto('https://pentagonosfserver.myddns.me:4006/index.php', {
                waitUntil: 'networkidle2',
            });
            await wait(5000);

            await page.waitForSelector('#input_user');
            await page.type('#input_user', 'admin');

            await page.waitForSelector('input[name="input_pass"]');
            await page.type('input[name="input_pass"]', 'Pentagono@2025');

            await page.waitForSelector('button[name="submit_login"]');
            await page.click('button[name="submit_login"]');

            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await wait(5000);
            log('Login realizado com sucesso.');

            await page.goto('https://pentagonosfserver.myddns.me:4006/index.php?menu=cdrreport', {
                waitUntil: 'networkidle2',
            });
            await wait(5000);
            log('Acessou o link do relatório com sucesso.');

            await page.waitForSelector('button.buttons-csv');
            await page.click('button.buttons-csv');
            log('Iniciando download do relatório CSV.');

            await wait(10000);

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
        log('Falha após 3 tentativas. O cabeçalho do relatório não corresponde ao esperado.');
    }
})();
