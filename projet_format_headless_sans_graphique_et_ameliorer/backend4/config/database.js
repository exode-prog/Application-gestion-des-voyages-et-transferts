const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Options de connexion sans les options deprecated
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(' Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
