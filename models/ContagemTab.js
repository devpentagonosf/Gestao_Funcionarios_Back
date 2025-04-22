import mongoose from 'mongoose';

const ContagemTabSchema = new mongoose.Schema({
  email: { type: String, required: true },
  userId: { type: String, required: true },
  ramal: { type: String, required: true }, // Novo campo para ramal
  mes_ano: { type: String, required: true }, // Formato: MM/YYYY
  qtd_tabulacao: { type: Number, required: true },
  qtd_consultas_paga: { type: Number, default: 0 }, // Novo campo para consultas pagas
  qtd_consultas_free: { type: Number, default: 0 }, // Novo campo para consultas gratuitas
});

const ContagemTab = mongoose.model('ContagemTab', ContagemTabSchema);

export default ContagemTab;
