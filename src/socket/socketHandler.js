import { Whiteboard } from "../models/Whiteboard.js";
import { Path } from "../models/Path.js";
import User from "../models/User.js";


const userSocketMap = new Map();

const handleSocketEvents = (io, socket) => {
    console.log('User connected:', socket.id);
    socket.broadcast.emit('message', `${socket.id} has joined the chat`);

    socket.on('register', (userId) => {
        userSocketMap.set(userId, socket.id);
        console.log(`Registered ${userId} → ${socket.id}`);
    });

    socket.on('sendMessage', (message) => {
        console.log('Message received:', message);
        socket.broadcast.emit('received-message', message);
    });



    socket.on("join-room", async(roomId, userId, callback) => {
        try {
            console.log(`User ${userId} `);
            const existingUser = await User.findOne({ _id: userId });

            if (!existingUser) {
                if (typeof callback === "function") {
                    callback("User Not Found");
                }
                return;
            }

            const existing = await Whiteboard.findOne({ whiteboardId: roomId });
            if (!existing) {
                const whiteboard = new Whiteboard({
                    whiteboardId: roomId,
                    name: 'Whiteboard-' + Math.random().toString(36).substring(2, 8)
                });
                await whiteboard.save();
            } 

            if (!existingUser.roomIds.includes(roomId)) {
                existingUser.roomIds.push(roomId);
                await existingUser.save();
            }

            socket.join(roomId);
            if (typeof callback === "function") {
                callback("joined")
            }

            

            console.log(`Socket ${socket.id} joined ${roomId}`);
        } catch (error) {
            if (typeof callback === "function") {
                callback("error");
            }
            console.error(`Error joining room ${roomId}:`, error);
        }
    });


    socket.on("draw", async (data) => {
        try {
            const { roomId, pathData } = data;

            const path = new Path(
                {
                    whiteboardId: roomId,
                    pathId: pathData.pathId,
                    pathString: pathData.path,
                    drawingTool: pathData.drawingTool,
                    strokeWidth: pathData.strokeWidth,
                    opacity: pathData.opacity || 1,
                    strokeColor: pathData.strokeColor || null,
                    fillColor: pathData.fillColor || null
                }
            )

            console.log(`Drawing data received for room ${roomId}:`, pathData);
            const savedPath = await path.save();

            socket.to(roomId).emit("draw", pathData);
        } catch (err) {
            console.error("Failed to save drawing:", err);
            socket.emit("error", { type: "SAVE_FAILED", message: "Drawing not saved!" });
        }
    });

    socket.on('erase', async(data)=>{

        try {
            const pathsIds = data.pathsIds
            await Path.deleteMany({ pathId: { $in: pathsIds } });
            console.log(`Erased paths:`, pathsIds);
            socket.to(data.roomId).emit("erase", pathsIds);

        } catch (error) {
            console.error("Failed to erase paths:", error);
            socket.emit("error", { type: "ERASE_FAILED", message: "Erase operation failed!" });
        }

    })


    socket.on("leave-room", (roomId, callback) => {
        try {
            socket.leave(roomId);
            if (typeof callback === "function") {
                callback("left");
            }
            console.log(`Socket ${socket.id} left room ${roomId}`);
        } catch (error) {
            if (typeof callback === "function") {
                callback("error");
            }
            console.error(`Error leaving room ${roomId}:`, error);
        }
    });


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [userId, id] of userSocketMap.entries()) {
            if (id === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
    });
};





export {
    handleSocketEvents,
    userSocketMap
}