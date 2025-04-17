import mongoose from 'mongoose';

const performanceSchema = new mongoose.Schema({
  email: { type: String, required: true },
  tabulacoes: { type: Number, default: 0 },
  ligacoes: { type: Number, default: 0 },
  consultas_pagas: { type: Number, default: 0 },
  consultas_gratis: { type: Number, default: 0 },
  tempo_ligacao: { type: Number, default: 0 }, // in seconds
  valor_vendas: { type: Number, default: 0 }, // in currency
  mes_ano: { type: String, required: true }, // format: MM/YYYY
});

const Performance = mongoose.model('Performance', performanceSchema);

export default Performance;
