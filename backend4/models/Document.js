const mongoose = require('mongoose');

// ==========================================
// ✅ SCHÉMA FICHIER avec STOCKAGE BASE64
// ==========================================
const fichierSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true 
  },
  nomOriginal: { 
    type: String, 
    required: true 
  },
  taille: { 
    type: Number, 
    required: true 
  },
  extension: { 
    type: String, 
    required: true 
  },
  mimeType: {
    type: String,
    required: true
  },
  // ✅ NOUVEAU : Contenu du fichier en Base64
  contenuBase64: {
    type: String,
    required: true
  },
  dateUpload: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: true });

// ==========================================
// SCHÉMA SOUS-DOSSIER - MODIFIÉ
// ==========================================
const sousDossierSchema = new mongoose.Schema({
  nom: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  motif: { 
    type: String 
  },
  // ✅ AJOUT DES INFORMATIONS SPÉCIFIQUES AU SOUS-DOSSIER
  pays: { 
    type: [String]  // Pour supporter plusieurs pays
  },
  raison: { 
    type: String 
  },
  autreRaison: { 
    type: String 
  },
  dateDebut: { 
    type: Date 
  },
  dateFin: { 
    type: Date 
  },
  typeTransfert: { 
    type: String 
  },
  fichiers: [fichierSchema]
}, { _id: true });

// ==========================================
// ✅ SCHÉMA DOCUMENT PRINCIPAL - SIMPLIFIÉ
// ==========================================
const documentSchema = new mongoose.Schema({
  // Identifiant unique
  reference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Informations client (restent au niveau document)
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
    required: true 
  },
  profession: { 
    type: String, 
    required: true 
  },
  sexe: { 
    type: String, 
    required: true, 
    enum: ['H', 'F'] 
  },
  
  // Type de document
  typeDocument: {
    type: String,
    required: true,
    enum: ['voyage', 'transfert'],
    index: true
  },
  
  // ❌ SUPPRIMÉ : Les champs spécifiques sont maintenant dans les sous-dossiers
  // pays, raison, autreRaison, typeTransfert, dateDebut, dateFin
  
  // Sous-dossiers avec fichiers
  sousDossiers: [sousDossierSchema],
  
  // Statut et gestion
  statut: {
    type: String,
    required: true,
    enum: ['en_attente', 'partiellement_apuré', 'apuré', 'archivé', 'rejeté'],
    default: 'en_attente',
    index: true
  },
  motifRejet: { 
    type: String 
  },
  
  // Dates système
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
  timestamps: true,
  collection: 'documents'
});

// ==========================================
// INDEX COMPOSÉS
// ==========================================
documentSchema.index({ email: 1, dateCreation: -1 });
documentSchema.index({ statut: 1, typeDocument: 1 });
documentSchema.index({ reference: 1 }, { unique: true });

// ==========================================
// MIDDLEWARE PRE-SAVE
// ==========================================
documentSchema.pre('save', function(next) {
  this.dateModification = new Date();
  next();
});

// ==========================================
// MÉTHODES VIRTUELLES
// ==========================================
documentSchema.virtual('nomComplet').get(function() {
  return `${this.nom} ${this.prenom}`;
});

// ==========================================
// MÉTHODES STATIQUES
// ==========================================

// Vérifier la taille totale des fichiers
documentSchema.statics.verifierTailleTotale = function(fichiers) {
  const tailleTotale = fichiers.reduce((acc, f) => acc + f.taille, 0);
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB max par document
  
  if (tailleTotale > MAX_SIZE) {
    throw new Error(`Taille totale des fichiers (${(tailleTotale / 1024 / 1024).toFixed(2)}MB) dépasse la limite de 50MB`);
  }
  
  return true;
};

// Vérifier qu'un fichier ne dépasse pas 16MB (limite MongoDB)
documentSchema.statics.verifierTailleFichier = function(taille) {
  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB (marge pour Base64)
  
  if (taille > MAX_FILE_SIZE) {
    throw new Error(`Le fichier (${(taille / 1024 / 1024).toFixed(2)}MB) dépasse la limite de 12MB`);
  }
  
  return true;
};

// ==========================================
// MÉTHODES D'INSTANCE
// ==========================================

// Obtenir la taille totale de tous les fichiers
documentSchema.methods.getTailleTotale = function() {
  let total = 0;
  this.sousDossiers.forEach(sd => {
    sd.fichiers.forEach(f => {
      total += f.taille;
    });
  });
  return total;
};

// Obtenir le nombre total de fichiers
documentSchema.methods.getNombreFichiers = function() {
  let total = 0;
  this.sousDossiers.forEach(sd => {
    total += sd.fichiers.length;
  });
  return total;
};

// ==========================================
// ✅ SCHÉMA FORMULAIRE (SÉPARÉ)
// ==========================================
const formulaireSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    default: 'formulaire-limite',
    unique: true
  },
  nomOriginal: {
    type: String,
    required: true
  },
  taille: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  contenuBase64: {
    type: String,
    required: true
  },
  dateUpload: {
    type: Date,
    default: Date.now
  },
  uploader: {
    type: String,
    required: true
  }
});

// ==========================================
// ✅ MODÈLES (DÉFINIS APRÈS LES SCHÉMAS)
// ==========================================
const Document = mongoose.model('Document', documentSchema);
const Formulaire = mongoose.model('Formulaire', formulaireSchema);

// ==========================================
// ✅ MÉTHODES FORMULAIRE
// ==========================================

// Méthodes statiques pour Formulaire
formulaireSchema.statics.getFormulaireClient = async function() {
  return await this.findOne({ nom: 'formulaire-limite' });
};

formulaireSchema.statics.updateFormulaireClient = async function(fileData, uploader) {
  // Supprimer l'ancien formulaire s'il existe
  await this.deleteMany({ nom: 'formulaire-limite' });
  
  // Créer le nouveau
  return await this.create({
    nom: 'formulaire-limite',
    nomOriginal: fileData.originalname,
    taille: fileData.size,
    mimeType: fileData.mimetype,
    contenuBase64: fileData.buffer.toString('base64'),
    uploader: uploader
  });
};

// ==========================================
// ✅ EXPORT
// ==========================================
module.exports = { Document, Formulaire };
