import mongoose from 'mongoose';

const contagemRamalModel = async (dbName) => {
  const db = mongoose.connection.useDb(dbName);
  const dadosIssabelCollection = db.collection('dados_issabel');
  const contagemRamalCollection = db.collection('contagemramal'); // Nova coleção

  const registros = await dadosIssabelCollection.find({}).toArray();

  const resultados = registros.map((registro) => {
    const { ramal, registros } = registro;
    const agrupados = {};

    registros.forEach(({ data, qtd_ligacoes, tempo_ligacao }) => {
      const [dia, mes, ano] = data.split('-');
      const mes_ano = `${mes}-${ano}`; // Alterado para mes_ano

      if (!agrupados[mes_ano]) {
        agrupados[mes_ano] = { qtd_ligacoes: 0, tempo_ligacao: 0 };
      }

      agrupados[mes_ano].qtd_ligacoes += qtd_ligacoes;
      agrupados[mes_ano].tempo_ligacao += tempo_ligacao;
    });

    return { ramal, dados: agrupados };
  });

  for (const { ramal, dados } of resultados) {
    for (const [mes_ano, valores] of Object.entries(dados)) {
      const { qtd_ligacoes, tempo_ligacao } = valores;

      // Atualizar ou inserir os valores na nova coleção contagemramal
      await contagemRamalCollection.updateOne(
        { ramal, mes_ano }, // Filtro para encontrar o registro
        {
          $setOnInsert: { ramal, mes_ano }, // Inserir apenas se não existir
          $inc: { qtd_ligacoes, tempo_ligacao }, // Incrementar os valores existentes
        },
        { upsert: true } // Insere se não encontrar
      );
    }
  }

  return resultados;
};

export default contagemRamalModel;
