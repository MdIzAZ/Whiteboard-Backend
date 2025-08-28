import { Path } from '../models/Path.js';
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


export const deleteWhiteboardById = async (req, res) => {
    try {
        console.log("Req made")
        const { whiteboardId } = req.params;
        const userId = req.user.userId; 

        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found with ID:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        const whiteboard = await Whiteboard.findOneAndDelete( {whiteboardId} );

        if (!whiteboard) {
            console.log("Whiteboard not found with ID:", whiteboardId);
            return res.status(404).json({ message: "Whiteboard not found" });
        }

        user.roomIds = user.roomIds.filter(id => id !== whiteboardId);
        await user.save();

        res.status(200).json({ message: "Whiteboard deleted successfully" });



    } catch(err) {
        console.error("Error deleting whiteboard:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
}



export const fetchAllPathsOfAWhiteboard = async (req, res) => {

    try {

        const { whiteboardId } = req.params;
        const paths = await Path.find({ whiteboardId });
        res.status(200).json({ paths: paths });
        
    } catch (error) {

        console.error("Error fetching paths:", error);
        res.status(500).json({ message: "Internal server error" });
        
    }

}
