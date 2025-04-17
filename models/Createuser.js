import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'USER' },
  chamados_admin: { type: Boolean, default: false }, // New field with default value
  status: { type: String, default: 'ativo' },
  name: { type: String, required: true },
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Adjusted to ObjectId
  cnpj: { type: String, unique: true, default: null },
  cpf: { type: String, required: true, unique: true },
  ramal: { type: String, default: null }, // Já configurado corretamente
  sigla: { type: String, default: null },
  telefone: { type: String, required: true },
}, { timestamps: true });

const CreateUser = mongoose.model('users', userSchema);

export default CreateUser;
