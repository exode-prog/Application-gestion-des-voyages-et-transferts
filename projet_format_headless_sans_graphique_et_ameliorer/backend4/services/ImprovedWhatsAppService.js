// =====================================================
// SERVICE WHATSAPP - VERSION STABLE + CHANGEMENT MANUEL
// =====================================================

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class ImprovedWhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCodeGenerated = false;
    
    // Session FIXE pour mémoriser l'authentification
    this.sessionPath = path.join(__dirname, '../.whatsapp_session_permanent');
    this.clientId = "whatsapp-permanent-session";
    
    console.log('Service WhatsApp - Mode Session Persistante');
    
    this.initializeClient();
  }

  initializeClient() {
    console.log('Initialisation WhatsApp...');
    
    // Vérifier si une session existe déjà
    const sessionExists = fs.existsSync(this.sessionPath);
    if (sessionExists) {
      console.log('Session existante détectée - Reconnexion automatique');
    } else {
      console.log('Aucune session - Scan QR requis');
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.sessionPath,
        clientId: this.clientId
      }),
      puppeteer: {
        executablePath: '/usr/bin/chromium-browser',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=Translate,BackForwardCache',
          '--disable-ipc-flooding-protection',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-sync',
          '--no-experiments',
          '--disable-translate',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-component-update',
          '--disable-breakpad',
          '--disable-crash-reporter',
          '--disable-back-forward-cache',
          '--disable-domain-reliability',
          '--disable-print-preview',
          '--remote-debugging-port=0'
        ],
        env: {
          ...process.env,
          DISPLAY: ':99'
        }
      }
    });

    // QR Code
    this.client.on('qr', (qr) => {
      console.log('\nSCAN QR CODE REQUIS');
      console.log('WhatsApp > Appareils connectés > Connecter un appareil');
      qrcode.generate(qr, { small: true });
      console.log('Ce scan ne sera demandé qu\'une seule fois');
      
      this.qrCodeGenerated = true;
    });

    // Authentification réussie
    this.client.on('authenticated', () => {
      console.log('Authentification réussie - Session mémorisée');
    });

    // Client prêt
    this.client.on('ready', () => {
      console.log('WhatsApp prêt');
      this.isReady = true;
    });

    // Échec authentification
    this.client.on('auth_failure', (msg) => {
      console.error('Échec authentification:', msg);
      this.isReady = false;
    });

    // Déconnexion
    this.client.on('disconnected', (reason) => {
      console.log('Déconnecté:', reason);
      this.isReady = false;
      console.log('Reconnexion dans 10s...');
      setTimeout(() => {
        this.client.initialize();
      }, 10000);
    });

    // Initialiser
    this.client.initialize().catch(err => {
      console.error('Erreur initialisation:', err);
    });
  }

  // =====================================================
  // FONCTION POUR CHANGER DE NUMÉRO (MANUELLE)
  // =====================================================
  async changeWhatsAppNumber() {
    console.log('\nCHANGEMENT DE NUMÉRO WHATSAPP');
    console.log('INSTRUCTIONS:');
    console.log('1. Déconnectez sur l\'ancien téléphone: WhatsApp > Appareils connectés > Déconnecter');
    console.log('2. Scannez le nouveau QR avec le nouveau téléphone');
    
    // Arrêter l'ancien client
    if (this.client) {
      await this.client.destroy();
      console.log('Ancienne session arrêtée');
    }
    
    // Supprimer la session existante
    if (fs.existsSync(this.sessionPath)) {
      fs.rmSync(this.sessionPath, { recursive: true, force: true });
      console.log('Ancienne session supprimée');
    }
    
    // Attendre
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Réinitialiser les flags
    this.isReady = false;
    this.qrCodeGenerated = false;
    
    console.log('Génération du nouveau QR code...');
    
    // Redémarrer le client
    this.initializeClient();
    
    return {
      success: true,
      message: 'Changement de numéro initié - Scannez le nouveau QR code',
      instruction: 'Déconnectez l\'ancienne session sur le téléphone avant de scanner'
    };
  }

  // =====================================================
  // FONCTIONS EXISTANTES
  // =====================================================
  
  // Formater le numéro de téléphone
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    return `${cleaned}@c.us`;
  }

  // Vérifier si le client est prêt
  async waitForReady(timeout = 60000) {
    const startTime = Date.now();
    while (!this.isReady) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout: Client WhatsApp non prêt');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return true;
  }

  // Envoyer un message
  async sendMessage(phoneNumber, message) {
    try {
      await this.waitForReady();

      const chatId = this.formatPhoneNumber(phoneNumber);

      const isRegistered = await this.client.isRegisteredUser(chatId);
      if (!isRegistered) {
        return {
          success: false,
          error: 'Numéro non enregistré sur WhatsApp'
        };
      }

      const sentMessage = await this.client.sendMessage(chatId, message);
      console.log('Message envoyé à', phoneNumber);

      return {
        success: true,
        messageId: sentMessage.id._serialized,
        timestamp: sentMessage.timestamp
      };

    } catch (error) {
      console.error('Erreur envoi:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Envoyer un message de confirmation de voyage
  async sendTravelConfirmation(clientData) {
    const paysFormatted = Array.isArray(clientData.pays) 
      ? clientData.pays.join(', ') 
      : clientData.pays;

    const message = `Bonjour *${clientData.prenom} ${clientData.nom}*,

Nous avons bien reçu vos *documents de voyage* pour *${paysFormatted}*.

Notre équipe examine actuellement votre dossier.

Vous serez recontacté(e) sous *48h maximum*.

Merci de votre confiance ! 

_DataCollectApp - Soumission de documents en ligne_`;

    return await this.sendMessage(clientData.telephone, message);
  }

  // Envoyer un message de confirmation de transfert
  async sendTransferConfirmation(clientData) {
    const entrepriseLine = clientData.entreprise && clientData.entreprise.trim() !== '' 
      ? `*Entreprise:* _${clientData.entreprise}_\n` 
      : '';

    const message = `Bonjour *${clientData.prenom} ${clientData.nom}*,

Nous avons bien reçu votre *dossier de transfert* :
_${clientData.typeTransfert}_
${entrepriseLine}
Notre équipe examine actuellement votre demande.

Vous serez recontacté(e) sous *48h maximum*.

Merci de votre confiance ! 

_DataCollectApp - Soumission de documents en ligne_`;

    return await this.sendMessage(clientData.telephone, message);
  }

  // Fonction automatique
  async sendAutoNotification(formData, type) {
    console.log('Envoi auto WhatsApp:', type);
    try {
      let result;
      if (type === 'voyage') {
        result = await this.sendTravelConfirmation(formData);
      } else {
        result = await this.sendTransferConfirmation(formData);
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtenir le statut
  getStatus() {
    const sessionExists = fs.existsSync(this.sessionPath);
    return {
      isReady: this.isReady,
      hasSession: sessionExists,
      qrCodeGenerated: this.qrCodeGenerated,
      status: this.isReady ? 'connected' : (sessionExists ? 'reconnecting' : 'needs_qr')
    };
  }
}

module.exports = new ImprovedWhatsAppService();
