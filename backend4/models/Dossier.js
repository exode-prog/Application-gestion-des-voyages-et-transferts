const mongoose = require('mongoose');

const FichierSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true // nom généré par le serveur
  },
  nomOriginal: {
    type: String,
    required: true // nom original du fichier uploadé
  },
  chemin: {
    type: String,
    required: true // chemin relatif du fichier
  },
  taille: {
    type: Number,
    required: true
  },
  extension: {
    type: String,
    required: true
  },
  dateUpload: {
    type: Date,
    default: Date.now
  }
});

const SousDossierSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true // ex: "2025-09-27"
  },
  motif: {
    type: String,
    required: true
  },
  dateDebut: {
    type: Date,
    required: true
  },
  dateFin: {
    type: Date,
    required: true
  },
  fichiers: [FichierSchema],
  dateCreation: {
    type: Date,
    default: Date.now
  }
});

const DossierSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true // ex: "BABOU_toutou"
  },
  prenom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  telephone: {
    type: String,
    required: true
  },
 statut: {
    type: String,
    enum: ['en_attente', 'partiellement_apuré ','apuré ','archivé','rejeté'],
    default: 'en_attente'
  },
  motifRejet: String,
  sousDossiers: [SousDossierSchema],
  dateCreation: {
    type: Date,
    default: Date.now
  },
  derniereMiseAJour: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour derniereMiseAJour
DossierSchema.pre('save', function(next) {
  this.derniereMiseAJour = new Date();
  next();
});

// Méthode pour calculer les statistiques
DossierSchema.methods.getStats = function() {
  return {
    totalSousDossiers: this.sousDossiers.length,
    totalFichiers: this.sousDossiers.reduce((total, sd) => total + sd.fichiers.length, 0),
    tailleTotale: this.sousDossiers.reduce((total, sd) => 
      total + sd.fichiers.reduce((subTotal, f) => subTotal + f.taille, 0), 0
    )
  };
};

module.exports = mongoose.model('Dossier', DossierSchema);
