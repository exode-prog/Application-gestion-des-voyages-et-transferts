const User = require('../models/User');

// Obtenir tous les utilisateurs
const obtenirUtilisateurs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Exclure l'utilisateur actuel de la liste
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ _id: { $ne: req.user._id } });

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs: ' + error.message
    });
  }
};

// Créer un nouvel utilisateur
const creerUtilisateur = async (req, res) => {
  try {
    const { username, email, password, role = 'admin_bank' } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur, email et mot de passe requis'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier si l'email existe déjà
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà utilisé'
      });
    }

// Seul un super_admin peut créer un autre admin_bank ou super_admin
if ((role === 'admin_bank' || role === 'super_admin') && req.user.role !== 'super_admin') {
  return res.status(403).json({
    success: false,
    message: 'Seul un super administrateur peut créer un administrateur bancaire ou un super administrateur'
  });
}

    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      role
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur: ' + error.message
    });
  }
};

// Obtenir un utilisateur par ID
const obtenirUtilisateurParId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur: ' + error.message
    });
  }
};

// Mettre à jour un utilisateur
const mettreAJourUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive } = req.body;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la modification de son propre compte
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre compte'
      });
    }


// Seul un  super_admin peut modifier le rôle vers admin_bank ou super_admin
if ((role === 'admin_bank' || role === 'super_admin') && req.user.role !== 'super_admin') {
  return res.status(403).json({
    success: false,
    message: 'Seul un super administrateur peut attribuer le rôle administrateur bancaire ou super administrateur'
  });
}


    // Vérifier l'unicité de l'email si changé
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Vérifier l'unicité du nom d'utilisateur si changé
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username, _id: { $ne: id } });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà utilisé'
        });
      }
    }

    // Mettre à jour les champs
    if (username) user.username = username.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role && ['superviseur', 'admin_bank','super_admin','auditeur','agent_saisie','conformité'].includes(role)) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur: ' + error.message
    });
  }
};

// Supprimer un utilisateur
const supprimerUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de son propre compte
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

/*
    // Seul un admin_bank peut supprimer un autre admin_bank
    if (user.role === 'admin_bank' && req.user.role !== 'admin_bank') {
      return res.status(403).json({
        success: false,
        message: 'Seul un super administrateur peut supprimer un autre super administrateur'
      });
    }
*/

// Seul un super_admin peut supprimer un compte admin_bank ou super_admin
if ((user.role === 'admin_bank' || user.role === 'super_admin') && req.user.role !== 'super_admin') {
  return res.status(403).json({
    success: false,
    message: 'Seul un super administrateur peut supprimer un administrateur bancaire ou un super administrateur'
  });
}

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur: ' + error.message
    });
  }
};

// Changer le mot de passe d'un utilisateur
const changerMotDePasse = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe: ' + error.message
    });
  }
};

module.exports = {
  obtenirUtilisateurs,
  creerUtilisateur,
  obtenirUtilisateurParId,
  mettreAJourUtilisateur,
  supprimerUtilisateur,
  changerMotDePasse
};
