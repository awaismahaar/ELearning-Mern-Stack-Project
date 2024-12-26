import mongoose from 'mongoose'

// Connect to MongoDB

const connectDb = () => {
    mongoose.connect(process.env.MONGO_URL as string)
        .then(() => console.log('Connected to MongoDB successfully'))
        .catch((error) => console.error('Error connecting to MongoDB:', error))
}
export default connectDb;


