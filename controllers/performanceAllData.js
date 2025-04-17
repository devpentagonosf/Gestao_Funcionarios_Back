import Performance from '../models/Performance.js';
import dotenv from 'dotenv';

dotenv.config();

export const createPerformance = async (req, res) => {
  const { email, tabulacoes, ligacoes, consultas_pagas, consultas_gratis, tempo_ligacao, valor_vendas, mes_ano } = req.body;

  try {
    const newPerformance = new Performance({
      email,
      tabulacoes,
      ligacoes,
      consultas_pagas,
      consultas_gratis,
      tempo_ligacao,
      valor_vendas,
      mes_ano,
    });

    await newPerformance.save();

    res.status(201).json({ message: 'Performance data created successfully' });
  } catch (error) {
    console.error('Error creating performance data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

