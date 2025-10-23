// =====================================================
// SERVICE WHATSAPP GRATUIT avec whatsapp-web.js
// =====================================================

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class ImprovedWhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.sessionPath = path.join(__dirname, '../.wwebjs_auth');
    this.initializeClient();
  }

  initializeClient() {
    console.log('🚀 Initialisation du client WhatsApp...');

    // Configuration du client avec authentification locale
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.sessionPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    // Event: QR Code généré
    this.client.on('qr', (qr) => {
      console.log('\n📱 SCANNEZ CE QR CODE AVEC WHATSAPP');
      console.log('=====================================');
      qrcode.generate(qr, { small: true });
      console.log('=====================================');
      console.log('👆 Ouvrez WhatsApp > Menu > Appareils connectés > Connecter un appareil');
    });

    // Event: Authentification réussie
    this.client.on('authenticated', () => {
      console.log('✅ Authentification réussie !');
    });

    // Event: Client prêt
    this.client.on('ready', () => {
      console.log('✅ Client WhatsApp prêt ! 🎉');
      console.log('📱 Vous pouvez maintenant envoyer des messages automatiques');
      this.isReady = true;
    });

    // Event: Erreur d'authentification
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Échec d\'authentification:', msg);
      this.isReady = false;
    });

    // Event: Déconnexion
    this.client.on('disconnected', (reason) => {
      console.log('⚠️ Client déconnecté:', reason);
      this.isReady = false;
      console.log('🔄 Tentative de reconnexion dans 10 secondes...');
      setTimeout(() => {
        this.client.initialize();
      }, 10000);
    });

    

    // Initialiser le client
    this.client.initialize().catch(err => {
      console.error('❌ Erreur initialisation:', err);
    });
  }

  // Fonction pour formater le numéro de téléphone
  formatPhoneNumber(phone) {
    // Nettoyer le numéro
    let cleaned = phone.replace(/[^0-9+]/g, '');
    
    // Si commence par +, enlever le +
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    // Ajouter @c.us pour WhatsApp
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
      console.log('\n📤 Préparation envoi message...');
      console.log('📞 Destinataire:', phoneNumber);
      console.log('💬 Message:', message);

      // Attendre que le client soit prêt
      await this.waitForReady();

      // Formater le numéro
      const chatId = this.formatPhoneNumber(phoneNumber);
      console.log('🔢 Chat ID formaté:', chatId);

      // Vérifier si le numéro est valide sur WhatsApp
      const isRegistered = await this.client.isRegisteredUser(chatId);
      
      if (!isRegistered) {
        console.warn('⚠️ Numéro non enregistré sur WhatsApp:', phoneNumber);
        return {
          success: false,
          error: 'Numéro non enregistré sur WhatsApp'
        };
      }

      // Envoyer le message
      const sentMessage = await this.client.sendMessage(chatId, message);
      
      console.log('✅ Message envoyé avec succès !');
      console.log('📨 ID Message:', sentMessage.id._serialized);

      return {
        success: true,
        messageId: sentMessage.id._serialized,
        timestamp: sentMessage.timestamp
      };

    } catch (error) {
      console.error('❌ Erreur envoi message:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Envoyer un message de confirmation de voyage
  // Envoyer un message de confirmation de voyage
async sendTravelConfirmation(clientData) {
  // Formater la liste des pays
  const paysFormatted = Array.isArray(clientData.pays) 
    ? clientData.pays.join(', ') 
    : clientData.pays;

  const message = `Bonjour *${clientData.prenom} ${clientData.nom}*,

 Nous avons bien reçu vos documents de voyage pour *${paysFormatted}*.

 Notre équipe examine actuellement votre dossier.

 Vous serez recontacté(e) sous 48h maximum.

Merci de votre confiance ! 

_DataCollectApp - Soumission de documents en ligne_`;

  return await this.sendMessage(clientData.telephone, message);
}

  // Envoyer un message de confirmation de transfert
  async sendTransferConfirmation(clientData) {
    const message = `Bonjour *${clientData.prenom} ${clientData.nom}*,

 Nous avons bien reçu votre dossier de transfert :
_${clientData.typeTransfert}_

 Notre équipe examine actuellement votre demande.

 Vous serez recontacté(e) sous 48h maximum.

Merci de votre confiance ! 

_DataCollectApp - Soumission de documents en ligne_`;

    return await this.sendMessage(clientData.telephone, message);
  }

  // Fonction automatique appelée depuis votre formulaire
  async sendAutoNotification(formData, type) {
    console.log('\n🚀 ENVOI AUTOMATIQUE WHATSAPP');
    console.log('==============================');
    console.log('👤 Client:', `${formData.prenom} ${formData.nom}`);
    console.log('📧 Email:', formData.email);
    console.log('📱 Téléphone:', formData.telephone);
    console.log('📋 Type:', type);

    try {
      let result;
      
      if (type === 'voyage') {
        result = await this.sendTravelConfirmation(formData);
      } else {
        result = await this.sendTransferConfirmation(formData);
      }

      if (result.success) {
        console.log('✅ SUCCÈS - Message envoyé automatiquement');
        console.log('📨 ID Message:', result.messageId);
      } else {
        console.warn('⚠️ ÉCHEC - Message non envoyé');
        console.warn('Raison:', result.error);
      }

      return result;

    } catch (error) {
      console.error('💥 Erreur critique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fermer le client proprement
  async destroy() {
    if (this.client) {
      await this.client.destroy();
      console.log('🔴 Client WhatsApp arrêté');
    }
  }

  // Obtenir le statut du client
  getStatus() {
    return {
      isReady: this.isReady,
      state: this.client ? this.client.pupPage ? 'connected' : 'disconnected' : 'not_initialized'
    };
  }
}

// Export singleton
module.exports = new ImprovedWhatsAppService();
