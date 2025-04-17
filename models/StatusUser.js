import mongoose from 'mongoose';

const StatusUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['ativo', 'inativo'],
    required: true,
  },
}, { collection: 'users', timestamps: true }); // Use the existing 'users' collection

const StatusUser = mongoose.model('StatusUser', StatusUserSchema);

export default StatusUser;
