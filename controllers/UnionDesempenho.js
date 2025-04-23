import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';

dotenv.config();

const contagemTabsCollection = 'contagemtabs';
const contagemRamalCollection = 'contagemramal';

export const getUnionDesempenho = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      console.log('MongoDB client is not connected. Attempting to reconnect...');
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Reconnected to MongoDB');
    }

    const db = mongoose.connection.db;
    const Proposal = db.collection('proposals');

    const contagemTabs = await db.collection(contagemTabsCollection).find().toArray();
    const contagemRamal = await db.collection(contagemRamalCollection).find().toArray();

    const mergedData = await Promise.all(
      contagemTabs.map(async (tab) => {
        const normalizedMesAnoTab = tab.mes_ano.replace('/', '-');

        const ramalData = contagemRamal.find(
          (ramal) => ramal.mes_ano === normalizedMesAnoTab && ramal.ramal === tab.ramal
        );

        const qtd_ligacoes = ramalData ? ramalData.qtd_ligacoes : 0;
        const tempo_ligacao = ramalData ? parseFloat(ramalData.tempo_ligacao.toFixed(2)) : 0;
        const media_tempo_ligacao = qtd_ligacoes > 0 ? parseFloat((tempo_ligacao / qtd_ligacoes).toFixed(2)) : 0;

        const email = tab.email;
        const [firstName, lastName] = email.split('@')[0].split('.').map(
          (name) => name.charAt(0).toUpperCase() + name.slice(1)
        );
        const nome = `${firstName} ${lastName}`;

        const [mes, ano] = tab.mes_ano.split('/');
        const startDate = new Date(`${ano}-${mes}-01T00:00:00.000Z`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // ✅ Correto agora: usa o ID armazenado em tab.userId para cruzar com proposals
        const userIdObjectId = new ObjectId(tab.userId);

        const proposals = await Proposal.aggregate([
          {
            $match: {
              idUsuario: userIdObjectId,
              emissionDate: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalNetWorth: { $sum: { $toDouble: "$netWorth" } }
            }
          }
        ]).toArray();

        const valor_vendas = proposals.length > 0 ? proposals[0].totalNetWorth : 0;

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
          valor_vendas
        };
      })
    );

    res.status(200).json(mergedData);
  } catch (error) {
    console.error('Error fetching union desempenho:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
