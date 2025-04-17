import StatusUser from '../models/StatusUser.js';
import dotenv from 'dotenv';

dotenv.config();

export const updateUserStatus = async (req, res) => {
  const { email, status } = req.body;

  try {
    if (!['ativo', 'inativo'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use "ativo" ou "inativo".' });
    }

    // Find user by email and update status in the 'users' collection
    const updatedUser = await StatusUser.findOneAndUpdate(
      { email },
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Status atualizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

