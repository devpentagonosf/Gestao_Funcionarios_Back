import mongoose from 'mongoose';

const resetPasswordSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetAt: { type: Date, default: Date.now }, // Data e hora do reset
}, { collection: 'users' }); // Aponta para a coleção 'users'

const ResetPassword = mongoose.model('ResetPassword', resetPasswordSchema);

export default ResetPassword;
