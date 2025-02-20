import express from 'express';
import {
    createProduct,
    getAllProducts,
    getProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProduct);

router.post('/', authMiddleware, adminMiddleware, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default router;
