const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DataCollectApp API',
      version: '1.0.0',
      description: 'API pour l\'application de collecte de documents DataCollectApp',
      contact: {
        name: 'Support DataCollectApp',
        email: 'support@datacollectapp.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token d\'accès manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Token invalide'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Accès refusé - privilèges insuffisants',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Accès refusé'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Ressource non trouvée'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Données invalides'
                  }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Erreur interne du serveur',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Erreur serveur'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Opérations d\'authentification'
      },
      {
        name: 'Documents',
        description: 'Gestion des documents'
      },
      {
        name: 'Users',
        description: 'Gestion des utilisateurs'
      }
    ]
  },
  apis: ['./routes/*.js'], // Chemin vers les fichiers contenant les annotations Swagger
};

const specs = swaggerJsdoc(options);

module.exports = specs;
