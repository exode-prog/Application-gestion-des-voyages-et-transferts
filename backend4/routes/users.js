const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  obtenirUtilisateurs,
  creerUtilisateur,
  obtenirUtilisateurParId,
  mettreAJourUtilisateur,
  supprimerUtilisateur,
  changerMotDePasse
} = require('../controllers/userController');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [superviseur, admin_bank, super_admin]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtenir tous les utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
router.get('/', adminAuth, obtenirUtilisateurs);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 */
router.post('/', adminAuth, creerUtilisateur);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtenir un utilisateur par ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 */
router.get('/:id', adminAuth, obtenirUtilisateurParId);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 */
router.put('/:id', adminAuth, mettreAJourUtilisateur);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 */
router.delete('/:id', adminAuth, supprimerUtilisateur);

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   post:
 *     summary: Changer le mot de passe d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour
 */
router.post('/:id/change-password', adminAuth, changerMotDePasse);

module.exports = router;
