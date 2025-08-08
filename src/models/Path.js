import mongoose from 'mongoose';

const PathSchema = new mongoose.Schema({
    whiteboardId: { // actually roomId in the frontend
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

// Composite uniqueness: (whiteboardId + pathId)
// PathSchema.index({ whiteboardId: 1, pathId: 1 }, { unique: true });

const Path = mongoose.model("Path", PathSchema);
export { Path };
