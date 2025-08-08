import User from '../models/User.js';
import { Whiteboard } from '../models/Whiteboard.js';

// ✅ Get all whiteboards for the authenticated user
export const getUserWhiteboards = async (req, res) => {
    try {
        const userId = req.user.userId; // Set by authenticateToken middleware

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get whiteboards whose whiteboardId is in user's roomIds array
        const whiteboards = await Whiteboard.find({
            whiteboardId: { $in: user.roomIds }
        });

        res.status(200).json({ whiteboards });
    } catch (err) {
        console.error("Error fetching user's whiteboards:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ Get a whiteboard by its whiteboardId
export const getWhiteboardById = async (req, res) => {
    try {
        const { whiteboardId } = req.params;

        const whiteboard = await Whiteboard.findOne({ whiteboardId });
        if (!whiteboard) {
            return res.status(404).json({ message: "Whiteboard not found" });
        }

        res.status(200).json(whiteboard);
    } catch (err) {
        console.error("Error fetching whiteboard:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
