import {} from "dotenv/config"
import mongoose from "mongoose"

const connectDB = async () => {
    try {
       const conn = await mongoose.connect(process.env.MONGO_URI);
       console.log(`MongoDB connected : ${conn.connection.host}`);
    }catch (error) {
        console.error(`Error connection to MongoDB:`,error.message);
        process.exit(1) // process code 1 means the programme was exited with an error
    }
}

export default connectDB