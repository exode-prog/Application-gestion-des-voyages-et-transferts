const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { nom, prenom } = req.body;
    
    if (!nom || !prenom) {
      return cb(new Error('Nom et prénom requis pour créer le dossier'));
    }
    
    // Créer le nom du dossier client en nettoyant les caractères spéciaux
    const nomDossier = `${nom.trim()}_${prenom.trim()}`
      .replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '_') // Garde les lettres accentuées
      .replace(/_+/g, '_') // Remplace plusieurs underscores par un seul
      .replace(/^_|_$/g, ''); // Supprime les underscores au début et à la fin
    
    // Créer le sous-dossier pour la date (format YYYY-MM-DD)
    const dateAujourdhui = new Date().toISOString().split('T')[0];
    
    const cheminComplet = path.join(uploadDir, nomDossier, dateAujourdhui);
    
    // Créer les dossiers s'ils n'existent pas
    try {
      fs.mkdirSync(cheminComplet, { recursive: true });
      console.log(`Dossier créé: ${cheminComplet}`);
    } catch (error) {
      console.error('Erreur création dossier:', error);
      return cb(error);
    }
    
    // Stocker les infos dans req pour utilisation ultérieure
    req.dossierClient = nomDossier;
    req.sousDossierDate = dateAujourdhui;
    req.cheminUpload = cheminComplet;
    
    cb(null, cheminComplet);
  },
  filename: function (req, file, cb) {
    // Nettoyer le nom de fichier original
    const extension = path.extname(file.originalname);
    const nomSansExt = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    // Ajouter un timestamp pour éviter les conflits
    const timestamp = Date.now();
    const nomFinal = `${nomSansExt}_${timestamp}${extension}`;
    
    console.log(`Nom de fichier généré: ${nomFinal}`);
    cb(null, nomFinal);
  }
});

// Filtre pour accepter tous types de fichiers
const fileFilter = (req, file, cb) => {
  console.log(`Fichier reçu: ${file.originalname}, Type: ${file.mimetype}`);
  // Accepter tous les types de fichiers
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max par fichier
    files: 10 // Maximum 10 fichiers
  },
  onError: function(err, next) {
    console.error('Erreur Multer:', err);
    next(err);
  }
});

module.exports = upload;
