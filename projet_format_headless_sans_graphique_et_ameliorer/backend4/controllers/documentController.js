const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

const whatsappService = require('../services/freeWhatsappService');
// Soumettre un document (côté client)
const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

const whatsappService = require('../services/freeWhatsappService');

// Soumettre un document (côté client)
const soumettreDocument = async (req, res) => {
  console.log('=== SUBMIT DEBUG ===');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  console.log('Dossier client:', req.dossierClient);
  console.log('Sous-dossier date:', req.sousDossierDate);
  console.log('===================');

  try {
    const { nom, prenom, email, telephone, motif, dateDebut, dateFin, typeDocument = 'voyage' } = req.body;

    // ✅ MODIFICATION : Validation conditionnelle selon le type de document
    const champsRequis = ['nom', 'prenom', 'email', 'telephone', 'motif'];
    
    // Pour les voyages, les dates sont obligatoires
    if (typeDocument === 'voyage') {
      if (!dateDebut || !dateFin) {
        champsRequis.push('dateDebut', 'dateFin');
      }
      
      // Validation des dates pour les voyages
      if (dateDebut && dateFin) {
        const dateDebutObj = new Date(dateDebut);
        const dateFinObj = new Date(dateFin);

        if (dateDebutObj > dateFinObj) {
          // Nettoyer les fichiers en cas d'erreur
          if (req.files) {
            req.files.forEach(file => {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            });
          }
          return res.status(400).json({
            success: false,
            message: 'La date de fin doit être postérieure à la date de début'
          });
        }
      }
    }
    // Pour les transferts, les dates sont optionnelles - pas de validation supplémentaire

    // Vérifier les champs requis
    const erreurs = [];
    champsRequis.forEach(champ => {
      if (!req.body[champ]) {
        erreurs.push(`Le champ ${champ} est requis`);
      }
    });

    if (erreurs.length > 0) {
      // Nettoyer les fichiers en cas d'erreur
      if (req.files) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: erreurs.join(', ')
      });
    }

    // Validation des fichiers
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un fichier est requis'
      });
    }

    // Préparer les informations des fichiers
    const fichiers = req.files.map(file => ({
      nomOriginal: file.originalname,
      nomFichier: file.filename,
      chemin: file.path,
      taille: file.size,
      typeFile: file.mimetype,
      extension: path.extname(file.originalname).toLowerCase(),
      dateUpload: new Date()
    }));

    // ✅ MODIFICATION : Créer le document avec dates conditionnelles
    const documentData = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      motif: motif.trim(),
      typeDocument: typeDocument, // Ajouter le type de document
      fichiers,
      dossierClient: req.dossierClient,
      sousDossierDate: req.sousDossierDate
    };

    // Ajouter les dates seulement si elles sont fournies
    if (dateDebut) documentData.dateDebut = new Date(dateDebut);
    if (dateFin) documentData.dateFin = new Date(dateFin);

    const nouveauDocument = new Document(documentData);

    const documentSauve = await nouveauDocument.save();

    console.log('Document créé avec succès:', {
      id: documentSauve._id,
      typeDocument: documentSauve.typeDocument,
      dossierClient: documentSauve.dossierClient,
      sousDossierDate: documentSauve.sousDossierDate,
      nombreFichiers: documentSauve.fichiers.length,
      hasDates: !!(documentSauve.dateDebut && documentSauve.dateFin)
    });

    res.json({
      success: true,
      message: 'Document soumis avec succès',
      documentId: documentSauve._id,
      dossier: documentSauve.dossierClient,
      sousDossier: documentSauve.sousDossierDate,
      typeDocument: documentSauve.typeDocument
    });

  } catch (error) {
    console.error('Erreur soumission document:', error);

    // Nettoyer les fichiers en cas d'erreur
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission du document: ' + error.message
    });
  }
};




// Récupérer tous les documents (superviseur)
const obtenirDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtres
    const filtres = {};
    
    if (req.query.statut && req.query.statut !== '') {
      filtres.statut = req.query.statut;
    }
    
    if (req.query.extension && req.query.extension !== '') {
      filtres['fichiers.extension'] = { $regex: req.query.extension, $options: 'i' };
    }
    
    if (req.query.dateDebut && req.query.dateFin) {
      filtres.createdAt = {
        $gte: new Date(req.query.dateDebut),
        $lte: new Date(req.query.dateFin + 'T23:59:59.999Z')
      };
    }

    if (req.query.email && req.query.email !== '') {
      filtres.email = { $regex: req.query.email, $options: 'i' };
    }

    console.log('Filtres appliqués:', filtres);

    const documents = await Document.find(filtres)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Améliore les performances

    const total = await Document.countDocuments(filtres);

    console.log(`Documents trouvés: ${documents.length}/${total}`);

    res.json({
      success: true,
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération documents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des documents: ' + error.message
    });
  }
};

// Récupérer un document par ID
const obtenirDocumentParId = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    res.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Erreur récupération document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du document: ' + error.message
    });
  }
};

// Mettre à jour un document
const mettreAJourDocument = async (req, res) => {
  try {
    const { statut, motif, dateDebut, dateFin } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Mettre à jour les champs modifiables
    if (statut && ['en_attente', 'traite', 'archive'].includes(statut)) {
      document.statut = statut;
    }
    if (motif) document.motif = motif.trim();
    if (dateDebut) {
      const dateDebutObj = new Date(dateDebut);
      if (!isNaN(dateDebutObj.getTime())) {
        document.dateDebut = dateDebutObj;
      }
    }
    if (dateFin) {
      const dateFinObj = new Date(dateFin);
      if (!isNaN(dateFinObj.getTime())) {
        document.dateFin = dateFinObj;
      }
    }

    // Validation des dates si les deux sont fournies
    if (document.dateDebut && document.dateFin && document.dateDebut > document.dateFin) {
      return res.status(400).json({
        success: false,
        message: 'La date de fin doit être postérieure à la date de début'
      });
    }

    await document.save();

    res.json({
      success: true,
      message: 'Document mis à jour avec succès',
      document
    });

  } catch (error) {
    console.error('Erreur mise à jour document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du document: ' + error.message
    });
  }
};

// Supprimer un document
const supprimerDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Supprimer les fichiers physiques
    document.fichiers.forEach(fichier => {
      if (fs.existsSync(fichier.chemin)) {
        try {
          fs.unlinkSync(fichier.chemin);
          console.log(`Fichier supprimé: ${fichier.chemin}`);
        } catch (error) {
          console.error(`Erreur suppression fichier ${fichier.chemin}:`, error);
        }
      }
    });

    // Supprimer le dossier s'il est vide
    try {
      const dossierPath = path.join('uploads', document.dossierClient, document.sousDossierDate);
      if (fs.existsSync(dossierPath)) {
        const files = fs.readdirSync(dossierPath);
        if (files.length === 0) {
          fs.rmdirSync(dossierPath);
          console.log(`Dossier supprimé: ${dossierPath}`);
          
          // Vérifier si le dossier parent est vide aussi
          const parentPath = path.join('uploads', document.dossierClient);
          if (fs.existsSync(parentPath)) {
            const parentFiles = fs.readdirSync(parentPath);
            if (parentFiles.length === 0) {
              fs.rmdirSync(parentPath);
              console.log(`Dossier parent supprimé: ${parentPath}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur suppression dossier:', error);
    }

    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du document: ' + error.message
    });
  }
};

// Télécharger un fichier
const telechargerFichier = async (req, res) => {
  try {
    const { documentId, fichierId } = req.params;
    
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const fichier = document.fichiers.find(f => f._id.toString() === fichierId);
    if (!fichier) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    if (!fs.existsSync(fichier.chemin)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier physique non trouvé sur le serveur'
      });
    }

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${fichier.nomOriginal}"`);
    res.setHeader('Content-Type', fichier.typeFile || 'application/octet-stream');
    
    // Envoyer le fichier
    res.download(fichier.chemin, fichier.nomOriginal, (error) => {
      if (error) {
        console.error('Erreur téléchargement:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement du fichier'
          });
        }
      }
    });

  } catch (error) {
    console.error('Erreur téléchargement fichier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du fichier: ' + error.message
    });
  }
};

// Obtenir les statistiques
const obtenirStatistiques = async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments();
    const documentsEnAttente = await Document.countDocuments({ statut: 'en_attente' });
    const documentsTraites = await Document.countDocuments({ statut: 'traite' });
    const documentsArchives = await Document.countDocuments({ statut: 'archive' });

    // Statistiques par extension
    const extensionsStats = await Document.aggregate([
      { $unwind: '$fichiers' },
      { 
        $group: { 
          _id: '$fichiers.extension', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 } // Limiter aux 10 extensions les plus populaires
    ]);

    // Documents récents (derniers 5)
    const documentsRecents = await Document.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('nom prenom email createdAt statut fichiers')
      .lean();

    const statistiques = {
      totalDocuments,
      documentsEnAttente,
      documentsTraites,
      documentsArchives,
      extensionsStats,
      documentsRecents
    };

    console.log('Statistiques générées:', statistiques);

    res.json({
      success: true,
      statistiques
    });

  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques: ' + error.message
    });
  }
};

module.exports = {
  soumettreDocument,
  obtenirDocuments,
  obtenirDocumentParId,
  mettreAJourDocument,
  supprimerDocument,
  telechargerFichier,
  obtenirStatistiques
};
