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
    // Boards this user is a member of, by boardId (the shared UUID).
    boardIds: [{
        type: String,
        ref: 'Board'
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
