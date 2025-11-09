const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Token manquant.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou utilisateur inactif.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token invalide.' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  auth(req, res, () => {
    if (req.user && (req.user.role === 'superviseur' || req.user.role === 'admin_bank' || req.user.role === 'super_admin')) {
      next();
    } else {
      res.status(403).json({ 
        success: false, 
        message: 'Accès refusé. Privilèges administrateur requis.' 
      });
    }
  });
};

const superAdminAuth = async (req, res, next) => {
  auth(req, res, () => {
    
    if (req.user && (req.user.role === 'admin_bank' || req.user.role === 'super_admin')) {

      next();
    } else {
      res.status(403).json({ 
        success: false, 
        message: 'Accès refusé. Privilèges super administrateur requis.' 
      });
    }
  });
};

module.exports = { auth, adminAuth, superAdminAuth };
