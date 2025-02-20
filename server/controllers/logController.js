import Log from '../models/Log.js';

export const getAllLogs = async (req, res) => {
    try {
        const logs = await Log.find().populate('user');
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching logs' });
    }
};
