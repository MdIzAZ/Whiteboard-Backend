import mongoose from 'mongoose';

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then((conn) => {
            console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        })
        .catch((error) => {
            console.error(`❌ DB Connection Error: ${error.message}`);
            process.exit(1);
        });
};

export default connectDB;