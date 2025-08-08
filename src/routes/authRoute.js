import express from 'express';
import { loginUser, registerUser, refreshAccessToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser)
router.post('/register', registerUser);
router.post('/refresh-token', refreshAccessToken);


export default router;