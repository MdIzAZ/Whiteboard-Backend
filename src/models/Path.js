import mongoose from 'mongoose';

const PathSchema = new mongoose.Schema({
    boardId: {
        type: String,
        required: true,
        index: true
    },
    pathId: {
        type: String,
        required: true
    },
    pathString: {
        type: String,
        required: true
    },
    drawingTool: {
        type: String,
        required: true
    },
    strokeWidth: {
        type: Number,
        required: true
    },
    opacity: {
        type: Number,
        default: 1
    },
    strokeColor: {
        type: Number
    },
    fillColor: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// A pathId is unique *within* a board. This makes erase safe (it can never
// cross boards) and makes re-sync idempotent (the same path can't be inserted
// twice), which is what the offline outbox flush relies on.
PathSchema.index({ boardId: 1, pathId: 1 }, { unique: true });

const Path = mongoose.model("Path", PathSchema);
export { Path };
