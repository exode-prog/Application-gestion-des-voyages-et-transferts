require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/datacollectapp'
    );
    
    console.log('Connexion à MongoDB établie');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username: 'exode' });
    if (existingUser) {
      console.log('L\'utilisateur exode existe déjà:', existingUser.email);
      return;
    }
    
    // Créer l'utilisateur exode
    const admin = new User({
      username: 'exode',
      email: 'exode@example.com',
      password: 'passer123',
      role: 'super_admin'
    });
    
    await admin.save();
    console.log('Utilisateur créé avec succès!');
    console.log('Username: exode');
    console.log('Email: exode@example.com');
    console.log('Mot de passe: passer123');
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
