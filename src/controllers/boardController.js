import { Path } from '../models/Path.js';
import User from '../models/User.js';
import { Board } from '../models/Board.js';

// Normalise an incoming path payload (from bulk upload or draw) into a Path doc.
// The live `draw` event sends the geometry under `path`; REST bulk upload sends
// it under `pathString`. Accept either.
const toPathDoc = (boardId, p) => ({
    boardId,
    pathId: p.pathId,
    pathString: p.pathString ?? p.path,
    drawingTool: p.drawingTool,
    strokeWidth: p.strokeWidth,
    opacity: p.opacity ?? 1,
    strokeColor: p.strokeColor ?? null,
    fillColor: p.fillColor ?? null
});

// POST /api/boards
// Register a board on publish. The client owns the boardId; the server owns the
// uniqueness guarantee:
//   - not registered yet          -> create, owner = me            (201)
//   - registered by me            -> no-op re-publish              (200)
//   - registered by someone else  -> boardId collision, reject     (409)
export const createBoard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { boardId, name } = req.body;

        if (!boardId) {
            return res.status(400).json({ message: "boardId is required" });
        }

        const existing = await Board.findOne({ boardId });

        if (existing) {
            if (String(existing.owner) === String(userId)) {
                // Legitimate re-publish / retry — idempotent.
                return res.status(200).json({ board: existing, created: false });
            }
            // Astronomically unlikely UUID collision across users — reject so the
            // client can regenerate a fresh boardId and retry.
            return res.status(409).json({
                message: "boardId already in use",
                code: "BOARD_ID_CONFLICT"
            });
        }

        const board = await Board.create({
            boardId,
            name: name || ('Board-' + boardId.slice(0, 6)),
            owner: userId
        });

        await User.updateOne({ _id: userId }, { $addToSet: { boardIds: boardId } });

        return res.status(201).json({ board, created: true });
    } catch (err) {
        console.error("Error creating board:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// GET /api/boards/mine — boards the authenticated user is a member of.
export const getUserBoards = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const boards = await Board.find({ boardId: { $in: user.boardIds } });
        return res.status(200).json({ boards });
    } catch (err) {
        console.error("Error fetching user's boards:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// GET /api/boards/:boardId
export const getBoardById = async (req, res) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findOne({ boardId });
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }
        return res.status(200).json({ board });
    } catch (err) {
        console.error("Error fetching board:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// GET /api/boards/:boardId/paths
export const fetchAllPathsOfBoard = async (req, res) => {
    try {
        const { boardId } = req.params;
        const paths = await Path.find({ boardId });
        return res.status(200).json({ paths });
    } catch (err) {
        console.error("Error fetching paths:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// POST /api/boards/:boardId/paths
// Bulk upload — used when publishing a local board and when flushing the
// offline outbox. Idempotent by (boardId, pathId): re-sending a path is a no-op
// rather than a duplicate, thanks to the compound unique index.
export const bulkUploadPaths = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { paths } = req.body;

        if (!Array.isArray(paths) || paths.length === 0) {
            return res.status(200).json({ upserted: 0 });
        }

        const board = await Board.findOne({ boardId });
        if (!board) {
            return res.status(404).json({ message: "Board not found" });
        }

        const ops = paths
            .filter(p => p && p.pathId)
            .map(p => ({
                updateOne: {
                    filter: { boardId, pathId: p.pathId },
                    update: { $setOnInsert: toPathDoc(boardId, p) },
                    upsert: true
                }
            }));

        const result = await Path.bulkWrite(ops, { ordered: false });
        const upserted = result.upsertedCount ?? 0;
        return res.status(200).json({ upserted });
    } catch (err) {
        console.error("Error bulk uploading paths:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// DELETE /api/boards/:boardId
// Removes the caller's membership. If nobody is left on the board, the board
// and its paths are deleted too.
export const deleteBoardById = async (req, res) => {
    try {
        const { boardId } = req.params;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Drop this user's membership first.
        await User.updateOne({ _id: userId }, { $pull: { boardIds: boardId } });

        // If no members remain, tear the board down entirely.
        const remaining = await User.countDocuments({ boardIds: boardId });
        if (remaining === 0) {
            await Path.deleteMany({ boardId });
            await Board.deleteOne({ boardId });
        }

        return res.status(200).json({ message: "Board deleted successfully" });
    } catch (err) {
        console.error("Error deleting board:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};
