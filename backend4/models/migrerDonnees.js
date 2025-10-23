require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const Dossier = require('../models/Dossier');
const connectDB = require('../config/database');

const migrateDossiers = async () => {
  await connectDB();
  
  const uploadsPath = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsPath)) {
    console.log('Pas de dossier uploads à migrer');
    return;
  }

  const dossierNames = fs.readdirSync(uploadsPath);
  console.log(`Trouvé ${dossierNames.length} dossiers à migrer`);

  for (const dossierName of dossierNames) {
    const dossierPath = path.join(uploadsPath, dossierName);
    if (!fs.statSync(dossierPath).isDirectory()) continue;

    // Extraire nom et prénom du nom du dossier (ex: BABOU_toutou)
    const [nom, prenom] = dossierName.split('_');
    
    const sousDossiers = [];
    const sousDossierNames = fs.readdirSync(dossierPath);

    for (const sousDossierName of sousDossierNames) {
      const sousDossierPath = path.join(dossierPath, sousDossierName);
      if (!fs.statSync(sousDossierPath).isDirectory()) continue;

      const fichiers = [];
      const fichierNames = fs.readdirSync(sousDossierPath);

      for (const fichierName of fichierNames) {
        const fichierPath = path.join(sousDossierPath, fichierName);
        const stats = fs.statSync(fichierPath);
        
        fichiers.push({
          nom: fichierName,
          nomOriginal: fichierName, // À ajuster si vous avez les vrais noms
          chemin: `uploads/${dossierName}/${sousDossierName}/`,
          taille: stats.size,
          extension: path.extname(fichierName),
          dateUpload: stats.birthtime
        });
      }

      sousDossiers.push({
        nom: sousDossierName,
        motif: 'Migré depuis filesystem',
        dateDebut: new Date(sousDossierName),
        dateFin: new Date(sousDossierName),
        fichiers,
        dateCreation: fs.statSync(sousDossierPath).birthtime
      });
    }

    // Vérifier si le dossier existe déjà
    const existant = await Dossier.findOne({ nom: nom, prenom: prenom });
    if (existant) {
      console.log(`Dossier ${dossierName} existe déjà, on le met à jour`);
      existant.sousDossiers.push(...sousDossiers);
      await existant.save();
    } else {
      await Dossier.create({
        nom,
        prenom,
        email: `${nom.toLowerCase()}.${prenom.toLowerCase()}@migrated.com`,
        telephone: '+221000000000', // À mettre à jour manuellement
        statut: 'en_attente',
        sousDossiers,
        dateCreation: fs.statSync(dossierPath).birthtime
      });
      console.log(`✅ Migré: ${dossierName}`);
    }
  }
  
  console.log('Migration terminée!');
  process.exit(0);
};

migrateDossiers();
