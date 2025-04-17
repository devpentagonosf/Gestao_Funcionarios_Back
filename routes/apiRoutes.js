import express from 'express';
import { loginUser } from '../controllers/userController.js';
import { getEmployees } from '../controllers/performanceController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { getUserInfo } from '../controllers/funcionariosController.js';
import { resetPassword } from '../controllers/resetPasswordController.js';
import { createUser } from '../controllers/cadastroUsuario.js';
import { updateUserStatus } from '../controllers/statusUser.js';
import { updateUserInfo } from '../controllers/editUser.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/employees', authenticateToken, getEmployees);
router.get('/user-info', getUserInfo);
router.post('/reset-password', authenticateToken, resetPassword);
router.post('/create-user', createUser);
router.post('/update-user-status', authenticateToken, updateUserStatus);
router.put('/update-user-info', authenticateToken, updateUserInfo);

export default router;
