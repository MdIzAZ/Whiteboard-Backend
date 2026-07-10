import { Board } from "../models/Board.js";
import { Path } from "../models/Path.js";
import User from "../models/User.js";

const userSocketMap = new Map();

const handleSocketEvents = (io, socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', (userId) => {
        userSocketMap.set(userId, socket.id);
        console.log(`Registered ${userId} → ${socket.id}`);
    });

    // Join the live room for a board. The board must already be registered on
    // the server (via POST /api/boards when it was published) — we no longer
    // auto-create boards from a join. Joining also records membership so the
    // board shows up in GET /api/boards/mine.
    socket.on("join", async (boardId, userId, callback) => {
        try {
            const user = await User.findById(userId);
            if (!user) {
                if (typeof callback === "function") callback("user-not-found");
                return;
            }

            const board = await Board.findOne({ boardId });
            if (!board) {
                if (typeof callback === "function") callback("board-not-found");
                return;
            }

            if (!user.boardIds.includes(boardId)) {
                await User.updateOne({ _id: userId }, { $addToSet: { boardIds: boardId } });
            }

            socket.join(boardId);
            if (typeof callback === "function") callback("joined");
            console.log(`Socket ${socket.id} joined board ${boardId}`);
        } catch (error) {
            console.error(`Error joining board ${boardId}:`, error);
            if (typeof callback === "function") callback("error");
        }
    });

    // Persist a single drawn path (scoped to its board) and mirror it to peers.
    socket.on("draw", async (data) => {
        try {
            const { boardId, pathData } = data;

            await Path.updateOne(
                { boardId, pathId: pathData.pathId },
                {
                    $setOnInsert: {
                        boardId,
                        pathId: pathData.pathId,
                        pathString: pathData.path ?? pathData.pathString,
                        drawingTool: pathData.drawingTool,
                        strokeWidth: pathData.strokeWidth,
                        opacity: pathData.opacity ?? 1,
                        strokeColor: pathData.strokeColor ?? null,
                        fillColor: pathData.fillColor ?? null
                    }
                },
                { upsert: true }
            );

            socket.to(boardId).emit("draw", pathData);
        } catch (err) {
            console.error("Failed to save drawing:", err);
            socket.emit("error", { type: "SAVE_FAILED", message: "Drawing not saved!" });
        }
    });

    // Erase paths — scoped to the board so it can never touch another board's
    // paths that happen to share a pathId.
    socket.on('erase', async (data) => {
        try {
            const { boardId, pathIds } = data;
            await Path.deleteMany({ boardId, pathId: { $in: pathIds } });
            socket.to(boardId).emit("erase", pathIds);
            console.log(`Erased ${pathIds?.length ?? 0} paths on board ${boardId}`);
        } catch (error) {
            console.error("Failed to erase paths:", error);
            socket.emit("error", { type: "ERASE_FAILED", message: "Erase operation failed!" });
        }
    });

    socket.on("leave", (boardId, callback) => {
        try {
            socket.leave(boardId);
            if (typeof callback === "function") callback("left");
            console.log(`Socket ${socket.id} left board ${boardId}`);
        } catch (error) {
            console.error(`Error leaving board ${boardId}:`, error);
            if (typeof callback === "function") callback("error");
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
};
