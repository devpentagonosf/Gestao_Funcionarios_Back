import mongoose from 'mongoose';

const userInfoSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, required: true },
  cpf: { type: String, required: true },
  cnpj: { type: String, required: true },
  ramal: { type: String },
  telefone: { type: String },
  sigla: { type: String },
}, { collection: 'users' });

const UserInfo = mongoose.model('UserInfo', userInfoSchema);

export default UserInfo;
