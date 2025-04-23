import mongoose from 'mongoose';

const contagemRamalModel = async (dbName) => {
  const db = mongoose.connection.useDb(dbName);
  const dadosIssabelCollection = db.collection('dados_issabel');
  const contagemRamalCollection = db.collection('contagemramal'); // Nova coleção

  const registros = await dadosIssabelCollection.find({}).toArray();

  if (registros.length === 0) {
    console.log('Nenhum registro encontrado na coleção dados_issabel.');
    return;
  }

  console.log(`Processando ${registros.length} registros da coleção dados_issabel.`);

  const resultados = registros.map((registro) => {
    const { ramal, registros } = registro;
    const agrupados = {};

    registros.forEach(({ data, qtd_ligacoes, tempo_ligacao }) => {
      const [ano, mes, dia] = data.split('-'); // Corrigido para ano, mes, dia
      const mes_ano = `${mes}-${ano}`; // Correto agrupamento por mes-ano

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

      console.log(`Atualizando ramal: ${ramal}, mês/ano: ${mes_ano}, ligações: ${qtd_ligacoes}, tempo: ${tempo_ligacao}`);

      // Atualizar ou inserir os valores na nova coleção contagemramal
      const result = await contagemRamalCollection.updateOne(
        { ramal, mes_ano }, // Filtro para encontrar o registro
        {
          $set: { // Substituir os valores diretamente
            ramal,
            mes_ano,
            qtd_ligacoes,
            tempo_ligacao,
          },
        },
        { upsert: true } // Insere se não encontrar
      );

      console.log(`Resultado da atualização: ${JSON.stringify(result)}`);
    }
  }

  console.log('Processamento concluído.');
  return resultados;
};

export default contagemRamalModel;
