import mongoose from 'mongoose';
const { Schema } = mongoose;


const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    roomIds: [{
        type: String, // referencing Whiteboard.id (custom)
        ref: 'Whiteboard'
    }],
    refreshToken: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
