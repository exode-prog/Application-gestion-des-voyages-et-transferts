const mongoose = require('mongoose');

/**
 * Génère une référence unique au format JJMMAAAA-XXX
 * @param {mongoose.Model} Model - Le modèle MongoDB (Document ou Transfert)
 * @param {string} type - 'DOC' pour document ou 'TRF' pour transfert
 * @returns {Promise<string>} - La référence générée (ex: 15102025-DOC001)
 */
const generateReference = async (Model, type = 'DOC') => {
  const today = new Date();
  
  // Format de la date : JJMMAAAA
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  
  const datePrefix = `${day}${month}${year}`;
  
  // Rechercher toutes les références du jour pour ce type
  const regex = new RegExp(`^${datePrefix}-${type}`);
  
  const lastDoc = await Model.findOne({
    reference: regex
  }).sort({ reference: -1 }).lean();
  
  let counter = 1;
  
  if (lastDoc && lastDoc.reference) {
    // Extraire le numéro de la dernière référence
    // Ex: "15102025-DOC005" -> extraire "005" -> 5
    const parts = lastDoc.reference.split('-');
    if (parts.length === 2) {
      const lastNumber = parts[1].replace(type, '');
      counter = parseInt(lastNumber) + 1;
    }
  }
  
  // Générer la référence finale : JJMMAAAA-TYPEXXX
  // Ex: 15102025-DOC001 ou 15102025-TRF023
  const reference = `${datePrefix}-${type}${String(counter).padStart(3, '0')}`;
  
  return reference;
};

/**
 * Vérifie si une référence existe déjà
 * @param {mongoose.Model} Model - Le modèle MongoDB
 * @param {string} reference - La référence à vérifier
 * @returns {Promise<boolean>}
 */
const referenceExists = async (Model, reference) => {
  const exists = await Model.findOne({ reference }).lean();
  return !!exists;
};

/**
 * Génère une référence garantie unique (avec retry en cas de collision)
 * @param {mongoose.Model} Model - Le modèle MongoDB
 * @param {string} type - 'DOC' ou 'TRF'
 * @param {number} maxRetries - Nombre maximum de tentatives
 * @returns {Promise<string>}
 */
const generateUniqueReference = async (Model, type = 'DOC', maxRetries = 5) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const reference = await generateReference(Model, type);
    
    const exists = await referenceExists(Model, reference);
    
    if (!exists) {
      return reference;
    }
    
    // Si collision (très rare), attendre un peu avant de réessayer
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Si échec après plusieurs tentatives, ajouter un identifiant unique
  const timestamp = Date.now().toString().slice(-4);
  const reference = await generateReference(Model, type);
  return `${reference}-${timestamp}`;
};

module.exports = {
  generateReference,
  referenceExists,
  generateUniqueReference
};

