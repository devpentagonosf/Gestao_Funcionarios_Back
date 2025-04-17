import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cpf: { type: String, required: true },
  cnpj: { type: String, required: false },
  telefone: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  sigla: { type: String, required: false },
  ramal: { type: String, required: false },
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'enterprises', required: true },
  updatedAt: { type: Date, default: Date.now },
});

const EditUser = mongoose.models.users || mongoose.model('users', userSchema);

export default EditUser;
