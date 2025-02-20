import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String, required: true },
        categories: [{ type: String }],
        stock: { type: Number, required: true },
        images: [{ type: String }],
        rating: { type: Number, default: 0 }
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ stock: 1 });


export default mongoose.model('Product', productSchema);
