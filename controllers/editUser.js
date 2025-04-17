import EditUser from '../models/EditUser.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const updateUserInfo = async (req, res) => {
  const { email, name, cpf, cnpj, telefone, sigla, ramal, enterpriseId } = req.body;

  try {
    const updatedUser = await EditUser.findOneAndUpdate(
      { email },
      {
        name,
        cpf,
        cnpj,
        telefone,
        sigla,
        ramal,
        enterpriseId: new mongoose.Types.ObjectId(enterpriseId),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error); // Log the error
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

