import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true },
        details: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model('Log', logSchema);
