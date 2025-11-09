require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/database');

const startServer = async () => {
  try {
    // Attendre la connexion à la base de données
    await connectDB();
    
    // Créer l'application seulement après la connexion DB
    const app = createApp();
    
    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log(` Serveur démarré sur le port ${PORT}`);
      console.log(` Documentation disponible sur http://172.237.112.125:${PORT}/api-docs`);
      console.log(`  Health check sur http://172.237.112.125:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

