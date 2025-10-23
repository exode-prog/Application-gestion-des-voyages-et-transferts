// routes/transferts.js
const express = require('express');
const router = express.Router();
const { generateReference } = require('../utils/referenceGenerator');
const Transfert = require('../models/Transfert');

// GET - Tous les transferts (admin)
router.get('/admin/dossiers', auth, async (req, res) => {
  try {
    const transferts = await Transfert.find().sort({ dateCreation: -1 });
    res.json({ success: true, transferts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST - Créer un transfert
router.post('/create', upload.array('files'), async (req, res) => {
  try {
    const reference = await generateReference(Transfert);
    
    const transfert = new Transfert({
      reference,
      ...req.body,
      fichiers: req.files.map(file => ({
        nom: file.filename,
        nomOriginal: file.originalname,
        taille: file.size,
        extension: path.extname(file.originalname),
        chemin: file.path
      }))
    });
    
    await transfert.save();
    res.json({ success: true, reference });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH - Changer le statut
router.patch('/admin/statut/:reference', auth, async (req, res) => {
  try {
    const { statut, motifRejet } = req.body;
    const transfert = await Transfert.findOneAndUpdate(
      { reference: req.params.reference },
      { statut, motifRejet },
      { new: true }
    );
    res.json({ success: true, transfert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE - Supprimer un transfert
router.delete('/admin/dossier/:reference', auth, async (req, res) => {
  try {
    await Transfert.findOneAndDelete({ reference: req.params.reference });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
