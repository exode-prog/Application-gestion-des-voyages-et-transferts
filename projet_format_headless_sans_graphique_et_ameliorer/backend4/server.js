require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/database');

const startServer = async () => {
  try {
    await connectDB();
    const app = createApp();
    
    const PORT = process.env.PORT || 5000;
    const HOST = '172.237.112.125';  
    
    // MODIFIEZ CETTE LIGNE :
    app.listen(PORT, HOST, () => {
      console.log(` Serveur démarré sur http://${HOST}:${PORT}`);
      console.log(` Documentation: http://172.237.112.125:${PORT}/api-docs`);
      console.log(`  Health check: http://172.237.112.125:${PORT}/health`);
      console.log(` Accessible depuis: http://172.237.112.125:${PORT}`);
    });
    
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
