const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const whatsappRoutes = require('./routes/whatsapp');

// ✅ Routes Documents
//const documentsRoutes = require('./routes/documents');
//app.use('/api/documents', documentsRoutes);

// ✅ Routes Transferts (NOUVEAU)
//const transfertsRoutes = require('./routes/transferts');
//app.use('/api/transferts', transfertsRoutes);

// Middleware pour la gestion des erreurs
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      details: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Cette donnée existe déjà'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
};

// Middleware pour les routes non trouvées
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`
  });
};

const createApp = () => {
  const app = express();

  // Middlewares
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['http://localhost:3000'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Servir les fichiers statiques (uploads)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Documentation Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "DataCollectApp API Documentation",
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: false
    }
  }));

//Pourla gestion de Whatsapp automatique
app.use('/api/whatsapp', whatsappRoutes);

  // Route de santé
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'DataCollectApp Backend is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Routes API
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/documents', require('./routes/documents'));

  // Servir le frontend React (fichiers statiques)
  app.use(express.static(path.join(__dirname, 'public')));

  // Route catch-all pour React Router (SPA)
  // Utilise app.use() au lieu de app.get('*') pour éviter les problèmes de syntaxe
  app.use((req, res, next) => {
    // Si c'est une route API, passer au middleware suivant
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Si c'est la route health ou api-docs, passer au suivant
    if (req.path === '/health' || req.path.startsWith('/api-docs')) {
      return next();
    }
    
    // Servir index.html pour toutes les autres routes (React Router)
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        // Si le fichier n'existe pas, passer au middleware suivant
        next();
      }
    });
  });

  // Middlewares de gestion d'erreurs (doivent être en dernier)
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
