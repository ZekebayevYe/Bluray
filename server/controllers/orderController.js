import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Log from '../models/Log.js';

export const createOrder = async (req, res) => {
    try {
        const { products } = req.body;
        let totalCost = 0;
        const productDetails = [];

        for (const item of products) {
            const dbProduct = await Product.findById(item.productId);
            if (!dbProduct) {
                return res.status(404).json({ message: 'Product not found', productId: item.productId });
            }
            if (dbProduct.stock < item.quantity) {
                return res.status(400).json({ message: 'Not enough stock', product: dbProduct.name });
            }
            dbProduct.stock -= item.quantity;
            await dbProduct.save();

            const cost = dbProduct.price * item.quantity;
            totalCost += cost;
            productDetails.push({ product: dbProduct._id, quantity: item.quantity });
        }

        const newOrder = new Order({
            user: req.user.id,
            products: productDetails,
            totalCost,
            status: 'pending'
        });
        await newOrder.save();

        await Log.create({
            user: req.user.id,
            action: 'purchase',
            details: `Order ID: ${newOrder._id}`
        });

        res.status(201).json(newOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating order' });
    }
};

export const getOrders = async (req, res) => {
    try {
        let orders;
        if (req.user.role === 'admin') {
            orders = await Order.find().populate('user').populate('products.product');
        } else {
            orders = await Order.find({ user: req.user.id }).populate('products.product');
        }
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order' });
    }
};
