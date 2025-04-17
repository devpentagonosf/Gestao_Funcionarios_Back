import mongoose from 'mongoose';

const connectToMongoDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB:', mongoose.connection.name);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectToMongoDB;
