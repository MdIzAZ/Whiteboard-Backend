import mongoose from 'mongoose';


const WhiteboardSchema = new mongoose.Schema({
    whiteboardId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    lastEdited: {
        type: Date,
        default: Date.now
    }
});

const Whiteboard = mongoose.model("Whiteboard", WhiteboardSchema);

export{Whiteboard}
