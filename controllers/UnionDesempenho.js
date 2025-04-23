import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const contagemTabsCollection = 'contagemtabs';
const contagemRamalCollection = 'contagemramal';

export const getUnionDesempenho = async (req, res) => {
  try {
    // Verifica se o cliente MongoDB está conectado
    if (!mongoose.connection.readyState) {
      console.log('MongoDB client is not connected. Attempting to reconnect...');
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Reconnected to MongoDB');
    }

    const db = mongoose.connection.db;

    const contagemTabs = await db.collection(contagemTabsCollection).find().toArray();
    const contagemRamal = await db.collection(contagemRamalCollection).find().toArray();

    const mergedData = contagemTabs.map((tab) => {
      const normalizedMesAnoTab = tab.mes_ano.replace('/', '-');

      const ramalData = contagemRamal.find(
        (ramal) => ramal.mes_ano === normalizedMesAnoTab && ramal.ramal === tab.ramal
      );

      const qtd_ligacoes = ramalData ? ramalData.qtd_ligacoes : 0;
      const tempo_ligacao = ramalData ? parseFloat(ramalData.tempo_ligacao.toFixed(2)) : 0;
      const media_tempo_ligacao = qtd_ligacoes > 0 ? parseFloat((tempo_ligacao / qtd_ligacoes).toFixed(2)) : 0;

      const email = tab.email;
      const [firstName, lastName] = email.split('@')[0].split('.').map((name) => name.charAt(0).toUpperCase() + name.slice(1));
      const nome = `${firstName} ${lastName}`;

      return {
        mes_ano: tab.mes_ano,
        email,
        nome,
        qtd_consultas_free: tab.qtd_consultas_free,
        qtd_consultas_paga: tab.qtd_consultas_paga,
        qtd_tabulacao: tab.qtd_tabulacao,
        qtd_ligacoes,
        tempo_ligacao,
        media_tempo_ligacao,
      };
    });

    res.status(200).json(mergedData);
  } catch (error) {
    console.error('Error fetching union desempenho:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};