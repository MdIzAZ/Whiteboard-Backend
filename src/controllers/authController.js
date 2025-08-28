import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config.js';



const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }  // Short-lived
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id, username: user.username },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }  // Longer-lived
    );
};



const registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validate input
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({username});
        if(existingUser) {
            return res.status(400).json({message: "User name already taken"});
        }

        // 3. Hash the password 
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS) || 5);


        // 4. Create the user
        const user = await new User({
            username,
            password: hashedPassword
        }).save();

        // 5. Generate tokens and save refresh token 
        const refreshToken = generateRefreshToken(user);
        user.refreshToken = refreshToken;
        await user.save();
        const accessToken = generateAccessToken(user);


        // 6. Return the user data without password
        const createdUser = await User.findById(user._id).select('-password');

        if (!createdUser) {
            return res.status(500).json({ message: 'User creation failed' });
        }


        // 7. Send response with tokens
        return res.status(201).json({
            message: 'User registered successfully',
            token: accessToken,
            user: createdUser
        });

        
    } catch (error) {

        console.error(error);
        res.status(500).json({ message: 'Server error' });
        
    }
}


const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) { 
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        const updatedUser = await User.findById(user._id).select('-password');

        return res.status(200).json({
            message: 'Login successful',
            token: accessToken,
            user: updatedUser
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};


const refreshAccessToken = async (req, res) => {

    console.log("Refresh token request received");

    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.userId);

        // Check if user exists and token matches the stored one
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        // Generate new tokens
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Save new refresh token to DB (invalidate old one)
        user.refreshToken = newRefreshToken;
        await user.save();

        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (err) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
};




export {
    loginUser, 
    registerUser, 
    refreshAccessToken
}