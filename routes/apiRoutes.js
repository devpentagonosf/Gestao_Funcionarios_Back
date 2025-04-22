import express from 'express';
import { loginUser } from '../controllers/userController.js';
import { getEmployees } from '../controllers/performanceController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getUserInfo } from '../controllers/funcionariosController.js';
import { resetPassword } from '../controllers/resetPasswordController.js';
import { createUser } from '../controllers/cadastroUsuario.js';
import { updateUserStatus } from '../controllers/statusUser.js';
import { updateUserInfo } from '../controllers/editUser.js';
import { countTabulations } from '../controllers/contagemTabulacao.js';
import { contagemRamal } from '../controllers/contagemRamal.js';
import { getUnionDesempenho } from '../controllers/UnionDesempenho.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/employees', authenticateToken, getEmployees);
router.get('/user-info', getUserInfo);
router.post('/reset-password', authenticateToken, resetPassword);
router.post('/create-user', createUser);
router.post('/update-user-status', authenticateToken, updateUserStatus);
router.put('/update-user-info', authenticateToken, updateUserInfo);

router.get('/count-tabulations', async (req, res) => {
  await countTabulations();
  res.status(200).send('Tabulações processadas. Verifique o console para os resultados.');
});

router.get('/count-ramal', async (req, res) => {
  await contagemRamal();
  res.status(200).send('Contagem de ramais processada. Verifique o console para os resultados.');
});

router.get('/union-desempenho', async (req, res) => {
  await getUnionDesempenho(req, res);
});

export default router;
