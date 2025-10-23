const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

class FreeWhatsAppService {
  constructor() {
    this.sessionDir = path.join(__dirname, '../whatsapp-session');
    this.ensureSessionDir();
  }

  ensureSessionDir() {
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  async sendMessage(phoneNumber, message) {
    let browser;
    try {
      console.log('🚀 Démarrage WhatsApp Web automatique...');
      
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--remote-debugging-port=0'
        ],
        timeout: 60000
      });

      const page = await browser.newPage();
      
      // Configurer le timeout de navigation
      page.setDefaultNavigationTimeout(120000);
      page.setDefaultTimeout(60000);

      // Charger la session existante si disponible
      const hasSession = await this.loadSession(page);
      
      if (!hasSession) {
        console.log('🔐 Aucune session trouvée. Connexion nécessaire...');
        await this.setupNewSession(page);
      } else {
        console.log('✅ Session chargée, tentative de connexion...');
        await page.goto('https://web.whatsapp.com', { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
      }

      // Vérifier si connecté
      const isLoggedIn = await this.checkLoginStatus(page);
      
      if (!isLoggedIn) {
        console.log('🔐 Connexion nécessaire...');
        await this.waitForQRAndLogin(page);
      } else {
        console.log('✅ Déjà connecté à WhatsApp Web');
      }

      // Nettoyer le numéro
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      console.log(`📤 Envoi à: ${cleanNumber}`);
      console.log(`💬 Message: ${message}`);

      // Utiliser une approche différente pour l'envoi
      const result = await this.sendMessageViaAPI(page, cleanNumber, message);
      
      console.log('✅ Message envoyé avec succès!');
      return { success: true, method: 'whatsapp_web' };
      
    } catch (error) {
      console.error('❌ Erreur WhatsApp Web:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async sendMessageViaAPI(page, phoneNumber, message) {
    // Construire l'URL du message
    const encodedMessage = encodeURIComponent(message);
    const chatUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
    
    console.log('🔗 Navigation vers:', chatUrl);
    
    await page.goto(chatUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Attendre que l'interface se charge
    await page.waitForTimeout(10000);
    
    // Vérifier si le numéro existe
    const invalidNumber = await page.$('span[data-testid="invalid-number"]');
    if (invalidNumber) {
      throw new Error('Numéro WhatsApp invalide');
    }
    
    // Attendre le bouton d'envoi
    await page.waitForSelector('button[data-testid="compose-btn-send"]', { 
      timeout: 15000 
    });
    
    console.log('🖱️ Clic sur le bouton d\'envoi...');
    await page.click('button[data-testid="compose-btn-send"]');
    
    // Attendre l'envoi
    await page.waitForTimeout(5000);
    
    return true;
  }

  async setupNewSession(page) {
    console.log('🎯 Préparation nouvelle session...');
    await page.goto('https://web.whatsapp.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
  }

  async waitForQRAndLogin(page) {
    console.log('📱 Attente du QR Code...');
    
    try {
      // Attendre que le QR code soit chargé avec un timeout plus long
      await page.waitForSelector('canvas[aria-label="Scan me!"]', { 
        timeout: 45000 
      });
      
      console.log('\n🎯 QR CODE DÉTECTÉ - Génération pour la console...');
      console.log('=================================================');
      
      // Générer un QR code avec l'URL de connexion WhatsApp
      const connectUrl = 'https://web.whatsapp.com';
      qrcode.generate(connectUrl, { small: true }, (qr) => {
        console.log(qr);
      });
      
      console.log('🔗 Scannez le QR code ci-dessus avec WhatsApp');
      console.log('📱 Ou allez sur: https://web.whatsapp.com');
      console.log('⏳ Attente de la connexion (vous avez 2 minutes)...');
      
      // Attendre la connexion avec timeout plus long
      await page.waitForSelector('._2_1wd', { timeout: 120000 });
      await this.saveSession(page);
      console.log('✅ Connexion réussie! Session sauvegardée.');
      
    } catch (error) {
      console.log('❌ Timeout - QR code non détecté ou connexion échouée');
      console.log('💡 Essayez de relancer le test');
      throw new Error('Connexion WhatsApp échouée: ' + error.message);
    }
  }

  async checkLoginStatus(page) {
    try {
      await page.waitForSelector('div[data-testid="conversation-panel-wrapper"]', { 
        timeout: 10000 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async saveSession(page) {
    try {
      const cookies = await page.cookies();
      const sessionData = { cookies, timestamp: Date.now() };
      fs.writeFileSync(
        path.join(this.sessionDir, 'session.json'),
        JSON.stringify(sessionData, null, 2)
      );
      console.log('💾 Session sauvegardée');
    } catch (error) {
      console.log('⚠️ Erreur sauvegarde session:', error.message);
    }
  }

  async loadSession(page) {
    try {
      const sessionPath = path.join(this.sessionDir, 'session.json');
      if (fs.existsSync(sessionPath)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        
        // Vérifier si la session est récente (moins de 7 jours)
        const sessionAge = Date.now() - sessionData.timestamp;
        if (sessionAge < 7 * 24 * 60 * 60 * 1000) {
          await page.setCookie(...sessionData.cookies);
          console.log('✅ Session chargée depuis le cache');
          return true;
        } else {
          console.log('⚠️ Session expirée, nouvelle connexion nécessaire');
        }
      }
    } catch (error) {
      console.log('⚠️ Impossible de charger la session:', error.message);
    }
    return false;
  }

  // Méthodes pour votre application
  async sendAutoTravelConfirmation(clientData) {
    const message = `Bonjour ${clientData.prenom} ${clientData.nom}, nous avons bien reçu vos documents de voyage pour ${clientData.pays}. Notre équipe les examine et vous recontactera sous 48h. Merci de votre confiance !`;
    
    return await this.sendMessage(clientData.telephone, message);
  }

  async sendAutoTransferConfirmation(clientData) {
    const message = `Bonjour ${clientData.prenom} ${clientData.nom}, nous avons bien reçu votre dossier de transfert (${clientData.typeTransfert}). Notre équipe l'examine et vous recontactera sous 48h. Merci !`;
    
    return await this.sendMessage(clientData.telephone, message);
  }

  async sendAutoNotification(formData, type) {
    console.log('\n🚀 ENVOI WHATSAPP WEB AUTOMATIQUE');
    console.log('👤 Client:', `${formData.prenom} ${formData.nom}`);
    
    try {
      let result;
      if (type === 'voyage') {
        result = await this.sendAutoTravelConfirmation(formData);
      } else {
        result = await this.sendAutoTransferConfirmation(formData);
      }

      console.log('📱 Résultat:', result.success ? '✅ SUCCÈS' : '❌ ÉCHEC');
      return result;
      
    } catch (error) {
      console.error('💥 Erreur WhatsApp Web:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FreeWhatsAppService();
