import mongoose from 'mongoose';
import UserInfo from '../models/UserInfo.js';

export const getEmployees = async (req, res) => {
  try {
    const employees = await mongoose.connection.collection('employees').find().toArray();
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const usersInfo = await UserInfo.aggregate([
      {
        $lookup: {
          from: 'enterprises',
          localField: 'enterpriseId',
          foreignField: '_id',
          as: 'enterpriseDetails',
        },
      },
      {
        $unwind: {
          path: '$enterpriseDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: { role: { $ne: 'ADM' } },
      },
      {
        $project: {
          email: 1,
          name: 1,
          status: 1,
          cpf: 1,
          cnpj: 1,
          ramal: 1,
          telefone: 1,
          sigla: 1,
          enterpriseName: {
            $cond: {
              if: { $not: ['$enterpriseDetails'] }, // Verifica se enterpriseDetails é nulo
              then: 'N/D',
              else: '$enterpriseDetails.name',
            },
          },
        },
      },
    ]);

    // Substituir valores de enterpriseName conforme solicitado
    const updatedUsersInfo = usersInfo.map(user => {
      if (user.enterpriseName === 'Pentagono Kennedy') {
        user.enterpriseName = 'São Bernardo';
      } else if (user.enterpriseName === 'Pentagono ZN') {
        user.enterpriseName = 'Zona Norte';
      }
      return user;
    });

    res.json(updatedUsersInfo);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
