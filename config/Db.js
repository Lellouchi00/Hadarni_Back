const mongoose = require('mongoose');

const connectionString =
  process.env.MONGO ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DATABASE_URL;

async function connectDB() {
  if (!connectionString) {
    throw new Error(
      'Missing MongoDB connection string. Set MONGO, MONGODB_URI, MONGO_URI, or DATABASE_URL.'
    );
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  console.log('MongoDB Connected');
}

module.exports = connectDB;
    
