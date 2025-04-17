// middleware/authenticateToken.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Certifique-se de carregar variáveis de ambiente antes de tudo

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader); // Deve ser "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido ou mal formatado' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erro ao verificar JWT:', err);
      return res.status(403).json({ message: 'Token inválido' });
    }

    req.user = user; // Payload do token (pode conter ID, email, etc.)
    next();
  });
};
