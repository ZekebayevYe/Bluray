import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import { getAllLogs } from '../controllers/logController.js';

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, getAllLogs);

export default router;
