import mongoose from 'mongoose';

const ramalSchema = new mongoose.Schema({
    ramal: { type: String, required: true },
    registros: [
        {
            data: { type: String, required: true },
            qtd_ligacoes: { type: Number, required: true },
            tempo_ligacao: { type: Number, required: true },
        },
    ],
}, { collection: 'dados_issabel' });

export default mongoose.model('Ramal', ramalSchema);
