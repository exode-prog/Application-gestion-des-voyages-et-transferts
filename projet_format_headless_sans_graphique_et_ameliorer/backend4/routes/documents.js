const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Document, Formulaire } = require('../models/Document');
const { auth } = require('../middleware/auth');
const { generateUniqueReference } = require('../utils/referenceGenerator');

//olution tempo
const mongoose = require('mongoose'); // ✅ AJOUTEZ CET IMPORT
//a revoir
// Services de notifications
const { sendNewSubmissionNotification, sendRejectionNotification } = require('../services/emailService');
// NOUVEAU : Import du service WhatsApp
const whatsappService = require('../services/ImprovedWhatsAppService');

// ==========================================
// CONFIGURATION MULTER - STOCKAGE EN MÉMOIRE
// ==========================================

const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 12 * 1024 * 1024 // 12MB max par fichier
  },
  fileFilter: (req, file, cb) => {
    if (file.size > 12 * 1024 * 1024) {
      return cb(new Error('Fichier trop volumineux (max 12MB)'));
    }
    cb(null, true);
  }
});

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

const convertirEnBase64 = (buffer) => {
  return buffer.toString('base64');
};

const convertirEnBuffer = (base64String) => {
  return Buffer.from(base64String, 'base64');
};

// ==========================================
// ROUTE PUBLIQUE - SOUMISSION VOYAGE
// ==========================================

router.post('/submit', upload.any(), async (req, res) => {
  console.log('=== SUBMIT VOYAGE avec stockage MongoDB ===');
  

  try {
    const { 
      nom, prenom, email, telephone, profession, sexe,
      pays, raison, autreRaison,  // 'pays' est maintenant un tableau
      dateDebut, dateFin 
    } = req.body;
    
    // Validation des champs requis - MODIFIÉ pour pays
    if (!nom || !prenom || !email || !telephone || !profession || !sexe || 
        !pays || pays.length === 0 || !raison || !dateDebut || !dateFin) {  // Vérifier que le tableau n'est pas vide
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un fichier est requis'
      });
    }

    // Vérifier la taille de chaque fichier
    for (const file of req.files) {
      try {
        Document.verifierTailleFichier(file.size);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `${file.originalname}: ${error.message}`
        });
      }
    }

    // Génération de référence unique
    const reference = await generateUniqueReference(Document, 'DOC');
    const today = new Date().toISOString().split('T')[0];

    // Convertir les fichiers en Base64
    console.log('📎 Conversion des fichiers en Base64...');
    const fichiers = req.files.map((file, index) => {
      console.log(`  Fichier ${index + 1}:`, file.originalname, file.size, 'bytes');
      
      const base64Content = convertirEnBase64(file.buffer);
      
      return {
        nom: `${path.parse(file.originalname).name}_${Date.now()}${path.extname(file.originalname)}`,
        nomOriginal: file.originalname,
        taille: file.size,
        extension: path.extname(file.originalname),
        mimeType: file.mimetype,
        contenuBase64: base64Content,
        dateUpload: new Date()
      };
    });

    console.log(`${fichiers.length} fichiers convertis en Base64`);

    // Vérifier si le client existe déjà
    const clientExistant = await Document.findOne({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      typeDocument: 'voyage'
    });

    // Créer le sous-dossier
  
 const sousDossier = {
  nom: today,
  date: new Date(),
  motif: raison === 'autres' ? autreRaison : raison,
  // AJOUT DES NOUVEAUX CHAMPS :
  pays: Array.isArray(pays) ? pays : [pays],
  raison: raison,
  autreRaison: raison === 'autres' ? autreRaison : undefined,
  dateDebut: new Date(dateDebut),
  dateFin: new Date(dateFin),
  fichiers
};
    let documentSauve;
    let isNouveauClient = false;

    if (clientExistant) {
      // Client existe : ajouter un sous-dossier
      console.log(` Client existant trouvé: ${clientExistant.reference}, ajout d'un sous-dossier`);
      
      // Vérifier la taille totale AVANT d'ajouter
      try {
        const tousFichiers = [...clientExistant.sousDossiers.flatMap(sd => sd.fichiers), ...fichiers];
        Document.verifierTailleTotale(tousFichiers);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      clientExistant.sousDossiers.push(sousDossier);
      clientExistant.dateModification = new Date();
      documentSauve = await clientExistant.save();
      
      console.log(`Nouveau sous-dossier ajouté au client existant: ${today}`);
    } else {
      // Nouveau client : créer un nouveau document
      isNouveauClient = true;
      
      // Vérifier la taille totale
      try {
        Document.verifierTailleTotale(fichiers);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

  

     const nouveauDocument = new Document({
        reference,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        telephone: telephone.trim(),
        profession: profession.trim(),
        sexe,
        typeDocument: 'voyage',
        pays: Array.isArray(pays) ? pays : [pays],
        raison,
        autreRaison: raison === 'autres' ? autreRaison : undefined,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        sousDossiers: [sousDossier],
        statut: 'en_attente'
      });


      
      documentSauve = await nouveauDocument.save();
      console.log('Nouveau document VOYAGE créé dans MongoDB:', reference);
    }
    


    //  ENVOYER NOTIFICATIONS (EMAIL + WHATSAPP)
    try {
      // Email admin - ENVOYER LE NOUVEAU SOUS-DOSSIER
      await sendNewSubmissionNotification(documentSauve, 'voyage', sousDossier);
      
      // WhatsApp client (asynchrone, non bloquant)
      whatsappService.sendAutoNotification(
        {
          telephone: telephone.trim(),
          prenom: prenom.trim(),
          nom: nom.trim(),
          email: email.trim(),
          pays: pays
        },
        'voyage'
      ).catch(err => {
        console.warn('Erreur WhatsApp (non bloquant):', err.message);
      });
      
    } catch (notificationError) {
      console.warn('Erreur notifications:', notificationError.message);
      // Ne pas bloquer la réponse si les notifications échouent
    }

    res.status(201).json({
      success: true,
      message: isNouveauClient ? 'Documents de voyage soumis avec succès' : 'Nouveau sous-dossier ajouté avec succès',
      reference: documentSauve.reference,
      document: {
        _id: documentSauve._id,
        reference: documentSauve.reference,
        nom: documentSauve.nom,
        prenom: documentSauve.prenom,
        email: documentSauve.email,
        statut: documentSauve.statut,
        typeDocument: 'voyage',
        nombreFichiers: documentSauve.getNombreFichiers(),
        tailleTotale: documentSauve.getTailleTotale(),
        nombreSousDossiers: documentSauve.sousDossiers.length
      }
    });

  } catch (error) {
    console.error(' Erreur soumission voyage:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission: ' + error.message
    });
  }
});

// ==========================================
// ROUTE PUBLIQUE - SOUMISSION TRANSFERT
// ==========================================


router.post('/submit-transfert', upload.any(), async (req, res) => {
  console.log('=== SOLUTION URGENCE - INSERTION DIRECTE MONGODB ===');
  
  try {
    const { 
      nom, prenom, email, telephone, profession, sexe,entreprise,
      typeTransfert,
      dateDebut, dateFin 
    } = req.body;

    // Validation
    if (!nom || !prenom || !email || !telephone || !profession || !sexe || !typeTransfert) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un fichier est requis'
      });
    }

    // Vérifier taille des fichiers
    for (const file of req.files) {
      try {
        Document.verifierTailleFichier(file.size);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `${file.originalname}: ${error.message}`
        });
      }
    }

    const reference = await generateUniqueReference(Document, 'TRF');
    const today = new Date().toISOString().split('T')[0];

    // Convertir les fichiers
    const fichiers = req.files.map(file => {
      const base64Content = convertirEnBase64(file.buffer);
      return {
        nom: `${path.parse(file.originalname).name}_${Date.now()}${path.extname(file.originalname)}`,
        nomOriginal: file.originalname,
        taille: file.size,
        extension: path.extname(file.originalname),
        mimeType: file.mimetype,
        contenuBase64: base64Content,
        dateUpload: new Date()
      };
    });

    const sousDossier = {
      nom: today,
      date: new Date(),
      motif: typeTransfert,
      typeTransfert: typeTransfert,
      entreprise: entreprise,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
      fichiers
    };

    // CRÉATION DES DONNÉES POUR INSERTION DIRECTE
    const documentData = {
      reference,
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone.trim(),
      profession: profession.trim(),
      sexe,
      typeDocument: 'transfert',
      // AJOUTEZ CES CHAMPS MANQUANTS
      typeTransfert: typeTransfert,
      raison: typeTransfert, // Double sauvegarde
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
      sousDossiers: [sousDossier],
      statut: 'en_attente',
      dateCreation: new Date(),
      dateModification: new Date()
    };

    console.log('📋 Données pour insertion directe - typeTransfert:', documentData.typeTransfert);

    // INSERTION DIRECTE DANS MONGODB (contourne Mongoose)
    const result = await mongoose.connection.collection('documents').insertOne(documentData);
    console.log('✅ Insertion directe MongoDB réussie, id:', result.insertedId);

    // VÉRIFICATION
    const documentVerifie = await mongoose.connection.collection('documents').findOne({ reference });
    console.log('🔍 Vérification directe - typeTransfert:', documentVerifie.typeTransfert);
    console.log('🔍 Vérification directe - raison:', documentVerifie.raison);

    // NOTIFICATIONS
    try {
      // Pour l'email, créez un objet temporaire avec les données
      const docTemp = {
        ...documentData,
        _id: result.insertedId,
	entreprise: entreprise,
        getNombreFichiers: () => fichiers.length,
        getTailleTotale: () => fichiers.reduce((acc, f) => acc + f.taille, 0)
      };
      
      await sendNewSubmissionNotification(docTemp, 'transfert', sousDossier);
      
      whatsappService.sendAutoNotification(
        {
          telephone: telephone.trim(),
          prenom: prenom.trim(),
          nom: nom.trim(),
          email: email.trim(),
          typeTransfert: typeTransfert,
	  entreprise: entreprise
        },
        'transfert'
      ).catch(err => {
        console.warn('Erreur WhatsApp:', err.message);
      });
      
    } catch (notificationError) {
      console.warn('Erreur notifications:', notificationError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Dossier de transfert soumis avec succès',
      reference,
      document: {
        _id: result.insertedId,
        reference: reference,
        nom: nom,
        prenom: prenom,
        email: email,
        statut: 'en_attente',
        typeDocument: 'transfert',
        typeTransfert: typeTransfert,
        nombreFichiers: fichiers.length,
        tailleTotale: fichiers.reduce((acc, f) => acc + f.taille, 0)
      }
    });

  } catch (error) {
    console.error('❌ Erreur insertion directe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la soumission: ' + error.message
    });
  }
});



router.get('/formulaire-limite.pdf', async (req, res) => {
  
  try {
    const formulaire = await Formulaire.findOne({ nom: 'formulaire-limite' });
    

    if (!formulaire) {
      
      return res.status(404).json({
        success: false,
        message: 'Formulaire non disponible'
      });
    }

    const buffer = Buffer.from(formulaire.contenuBase64, 'base64');
    console.log('Buffer créé, taille:', buffer.length);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="formulaire-limite.pdf"');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
    console.log('Formulaire envoyé avec succès');

  } catch (error) {
    console.error(' Erreur téléchargement formulaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du formulaire'
    });
  }
});

// ==========================================
//  NOUVELLE ROUTE : WHATSAPP STATUS
// ==========================================

router.get('/whatsapp/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
//  NOUVELLE ROUTE : WHATSAPP TEST
// ==========================================

router.post('/whatsapp/test', async (req, res) => {
  try {
    const { telephone, message } = req.body;
    
    if (!telephone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Téléphone et message requis'
      });
    }

    const result = await whatsappService.sendMessage(telephone, message);
    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// ROUTES ADMIN - CONSULTATION
// ==========================================

router.get('/admin/dossiers', auth, async (req, res) => {
  try {
    const { typeDocument, statut } = req.query;
    
    const filtres = {};
    if (typeDocument) filtres.typeDocument = typeDocument;
    if (statut) filtres.statut = statut;

    const documents = await Document.find(filtres)
      .select('-sousDossiers.fichiers.contenuBase64')
      .sort({ dateCreation: -1 })
      .lean();

        const dossiersFormates = documents.map(doc => ({
      _id: doc._id,
      reference: doc.reference,
      nom: doc.nom,
      prenom: doc.prenom,
      email: doc.email,
      telephone: doc.telephone,
      profession: doc.profession,
      sexe: doc.sexe,
      typeDocument: doc.typeDocument,
      pays: doc.pays,
      raison: doc.raison,
      autreRaison: doc.autreRaison,
      typeTransfert: doc.typeTransfert,
      entreprise: doc.entreprise,
      dateDebut: doc.dateDebut,
      dateFin: doc.dateFin,
      statut: doc.statut,
      motifRejet: doc.motifRejet,
      dateCreation: doc.dateCreation,
      sousDossiers: doc.sousDossiers.map(sd => ({
        _id: sd._id,
        nom: sd.nom,
        date: sd.date,
        motif: sd.motif,
        // AJOUTER TOUS LES CHAMPS SPÉCIFIQUES :
        pays: sd.pays,
        raison: sd.raison,
        autreRaison: sd.autreRaison,
        dateDebut: sd.dateDebut,
        dateFin: sd.dateFin,
        typeTransfert: sd.typeTransfert,
	entreprise: sd.entreprise,
        fichiers: sd.fichiers.map(f => ({
          _id: f._id,
          nom: f.nom,
          nomOriginal: f.nomOriginal,
          taille: f.taille,
          extension: f.extension,
          mimeType: f.mimeType,
          dateUpload: f.dateUpload
        }))
      }))
    }));

    res.json({
      success: true,
      dossiers: dossiersFormates
    });
  } catch (error) {
    console.error('Erreur récupération dossiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur: ' + error.message
    });
  }
});

// ==========================================
// ROUTES ADMIN - MODIFICATION
// ==========================================

router.patch('/admin/statut/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;
    const { statut, motifRejet } = req.body;

    const validStatuts = ['en_attente', 'partiellement_apuré', 'apuré', 'archivé', 'rejeté'];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide`
      });
    }

    const updateData = {
      statut: statut,
      dateModification: new Date()
    };

    if (motifRejet) {
      updateData.motifRejet = motifRejet;
    }

    const document = await Document.findOneAndUpdate(
      { reference },
      updateData,
      { new: true }
    ).select('-sousDossiers.fichiers.contenuBase64');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // ENVOI EMAIL SI REJET
    if (statut === 'rejeté' && motifRejet) {
      try {
        console.log('📧 Déclenchement envoi notifications rejet...');
        const emailResult = await sendRejectionNotification(
          document, 
          motifRejet, 
          document.typeDocument
        );
        
        
        
        if (!emailResult.success) {
          console.warn('Problème lors de l\'envoi des emails de rejet');
        }
      } catch (emailError) {
        console.error(' Erreur envoi emails rejet:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      document: {
        reference: document.reference,
        statut: document.statut,
        motifRejet: document.motifRejet || null
      }
    });

  } catch (error) {
    console.error(' Erreur changement statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur: ' + error.message
    });
  }
});

// ==========================================
// ROUTES ADMIN - SUPPRESSION
// ==========================================

router.delete('/admin/dossier/:reference', auth, async (req, res) => {
  try {
    const { reference } = req.params;
    const document = await Document.findOne({ reference });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    await Document.findOneAndDelete({ reference });
    
    console.log(` Document supprimé de MongoDB: ${reference}`);

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur: ' + error.message
    });
  }
});

router.delete('/admin/sousdossier/:reference/:sousDossierId', auth, async (req, res) => {
  try {
    const { reference, sousDossierId } = req.params;
    
    const document = await Document.findOne({ reference });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const sousDossier = document.sousDossiers.id(sousDossierId);
    
    if (!sousDossier) {
      return res.status(404).json({
        success: false,
        message: 'Sous-dossier non trouvé'
      });
    }

    document.sousDossiers.pull(sousDossierId);
    await document.save();

    console.log(`Sous-dossier supprimé: ${sousDossierId}`);

    res.json({
      success: true,
      message: 'Sous-dossier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression sous-dossier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur: ' + error.message
    });
  }
});

router.delete('/admin/file/:reference/:sousDossierId/:fileId', auth, async (req, res) => {
  try {
    const { reference, sousDossierId, fileId } = req.params;
    
    const document = await Document.findOne({ reference });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const sousDossier = document.sousDossiers.id(sousDossierId);
    const fichier = sousDossier?.fichiers.id(fileId);
    
    if (!fichier) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    sousDossier.fichiers.pull(fileId);
    await document.save();

    console.log(`✅ Fichier supprimé: ${fichier.nomOriginal}`);

    res.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression fichier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur: ' + error.message
    });
  }
});

// ==========================================
// FORMULAIRE CLIENT
// ==========================================

const uploadFormulaire = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
    }
  }
});

router.post('/admin/formulaire-client', auth, uploadFormulaire.single('formulaire'), async (req, res) => {
  try {
    console.log('=== DÉBUT UPLOAD FORMULAIRE CLIENT ===');

    if (req.user.role !== 'superviseur') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seuls les superviseurs peuvent uploader des formulaires.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB)'
      });
    }

    const formulaire = await Formulaire.schema.statics.updateFormulaireClient.call(
      Formulaire,
      req.file, 
      req.user.username
    );

    
    
    res.json({
      success: true,
      message: 'Formulaire client mis à jour avec succès',
      file: {
        nomOriginal: formulaire.nomOriginal,
        taille: formulaire.taille,
        dateUpload: formulaire.dateUpload,
        uploader: formulaire.uploader
      }
    });

  } catch (error) {
    console.error('Erreur upload formulaire client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du formulaire: ' + error.message
    });
  }
});


router.get('/admin/formulaire-info', auth, async (req, res) => {
  try {
    const formulaire = await Formulaire.findOne({ nom: 'formulaire-limite' });
    
    if (!formulaire) {
      return res.status(404).json({
        success: false,
        message: 'Aucun formulaire disponible'
      });
    }

    res.json({
      success: true,
      formulaire: {
        nomOriginal: formulaire.nomOriginal,
        taille: formulaire.taille,
        dateUpload: formulaire.dateUpload,
        uploader: formulaire.uploader
      }
    });

  } catch (error) {
    console.error(' Erreur récupération info formulaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations'
    });
  }
});

// ==========================================
// TÉLÉCHARGEMENT FICHIERS
// ==========================================

router.get('/admin/download/:reference/:sousDossierId/:fileId', auth, async (req, res) => {
  try {
    const { reference, sousDossierId, fileId } = req.params;

    const document = await Document.findOne({ reference });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    const sousDossier = document.sousDossiers.id(sousDossierId);
    const fichier = sousDossier?.fichiers.id(fileId);
    
    if (!fichier) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    const buffer = convertirEnBuffer(fichier.contenuBase64);

    res.set({
      'Content-Type': fichier.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fichier.nomOriginal)}"`,
      'Content-Length': buffer.length
    });

    res.send(buffer);

    

  } catch (error) {
    console.error('Erreur téléchargement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur: ' + error.message
    });
  }
});

module.exports = router;
