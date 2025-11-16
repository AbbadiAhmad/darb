import { Router } from 'express';
import { authController, registerValidation, loginValidation } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerValidation, authController.register.bind(authController));
router.post('/login', loginValidation, authController.login.bind(authController));

export default router;
