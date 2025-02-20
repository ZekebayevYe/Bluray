import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        products: [
            {
                product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                quantity: { type: Number, default: 1 }
            }
        ],
        totalCost: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'shipped', 'delivered'],
            default: 'pending'
        },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
