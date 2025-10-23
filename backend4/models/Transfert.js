const mongoose = require('mongoose');

const transfertSchema = new mongoose.Schema({
  // Référence unique
  reference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Informations personnelles
  nom: {
    type: String,
    required: true,
    trim: true
  },
  prenom: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  telephone: {
    type: String,
    trim: true
  },
  profession: {
    type: String,
    required: true,
    trim: true
  },
  sexe: {
    type: String,
    enum: ['H', 'F'],
    required: true
  },
  
  // Informations spécifiques au transfert
  typeTransfert: {
    type: String,
    required: true,
    trim: true
  },
  
  // Dates
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  
  // Fichiers (pas de sous-dossiers pour les transferts)
  fichiers: [{
    nom: String,
    nomOriginal: String,
    taille: Number,
    extension: String,
    chemin: String,
    dateUpload: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statut
  statut: {
    type: String,
    enum: ['en_attente', 'partiellement_apuré', 'apuré', 'archivé', 'rejeté'],
    default: 'en_attente'
  },
  
  motifRejet: {
    type: String,
    trim: true
  },
  
  dateCreation: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  dateModification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composé pour recherche optimisée
transfertSchema.index({ reference: 1, statut: 1 });
transfertSchema.index({ email: 1, dateCreation: -1 });

// Middleware pour mettre à jour dateModification
transfertSchema.pre('save', function(next) {
  this.dateModification = new Date();
  next();
});

module.exports = mongoose.model('Transfert', transfertSchema);
