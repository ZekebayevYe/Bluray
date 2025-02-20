import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import {
    createOrder,
    getOrders,
    updateOrderStatus
} from '../controllers/orderController.js';

const router = express.Router();

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrders);
router.patch('/:id', authMiddleware, adminMiddleware, updateOrderStatus);

export default router;
