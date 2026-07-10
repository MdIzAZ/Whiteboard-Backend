import mongoose from 'mongoose';

// A Board is the single shareable entity. Its identity is `boardId` — a
// client-generated UUID that is the same value in the local DB, on the wire,
// and here. Mongo's own _id is not used as the app-level key.
const BoardSchema = new mongoose.Schema({
    boardId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    // Who published this board. Used to distinguish a legitimate re-publish
    // (same owner) from a boardId collision by a different user.
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastEdited: {
        type: Date,
        default: Date.now
    }
});

const Board = mongoose.model("Board", BoardSchema);

export { Board };
