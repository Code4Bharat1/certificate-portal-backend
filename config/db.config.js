import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const URI = process.env.MONGODB_URI;

const connectDb = async () => {
    try {
        await mongoose.connect(URI);
        console.log("Database connection Successfull");
    } catch (error) {
        console.error("Database connection failed", error.message);
        process.exit(1);
    }
}

export default connectDb;