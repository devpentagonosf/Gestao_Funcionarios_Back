import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import CreateUser from '../models/Createuser.js';
import dotenv from 'dotenv';

dotenv.config();

export const createUser = async (req, res) => {
  const { name, cpf, cnpj, telefone, email, sigla, empresa, ramal } = req.body; // Incluído ramal

  try {
    // Determine the enterpriseId based on the empresa value
    let enterpriseId;
    if (empresa === 'Zona Norte') {
      enterpriseId = new mongoose.Types.ObjectId('67ec6992b82404ce9552f323');
    } else if (empresa === 'São Bernardo') {
      enterpriseId = new mongoose.Types.ObjectId('66d60fc24ae304368096f8fd');
    } else {
      return res.status(400).json({ message: 'Empresa inválida' });
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash('Pentagono@2025', 10);

    // Create the new user object using the CreateUser model
    const newUser = new CreateUser({
      email,
      password: hashedPassword,
      role: 'USER',
      chamados_admin: false, // Default value
      status: 'ativo',
      name,
      enterpriseId,
      cnpj,
      cpf,
      ramal, // Usando o valor recebido no req.body
      sigla,
      telefone,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

