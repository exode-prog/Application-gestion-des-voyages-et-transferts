const axios = require('axios');

class WhatsAppService {
  constructor() {
    // ✅ VOS VRAIES INFORMATIONS
    this.accessToken = 'EAARSS1SyWHYBPuYN273UwsDa1myt2HiRUKoKH3cNWwZBuswZAFpb82R1BZBcra99zvOnTg3uGI2qZCaDUm9WiwP4xQHZA7u2xnhyuNq9qIFTwr5Bfx9Iz6y6Ijyx3KjkZCYo23luQA6UzCrJ9YNfnl6ssLc3KVnDkINSZCAmZAh34BdbZA5lFk8K7kih7bcx2beZAZBo5XjGgYuiQVKI76gkDrypvZCoGRNmZCj2XSfksE3Dt';
    this.phoneNumberId = '843182735546570';
    this.apiVersion = 'v22.0';
  }

  // Nettoyer le numéro de téléphone
  cleanPhoneNumber(phone) {
    return phone.replace(/[^0-9]/g, '');
  }

  // Envoyer un message template
  async sendTemplateMessage(phoneNumber, templateName, parameters = []) {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
      
      const data = {
        messaging_product: 'whatsapp',
        to: this.cleanPhoneNumber(phoneNumber),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' } // ✅ Utiliser en_US pour l'instant
        }
      };

      // ⚠️ TEMPORAIREMENT : COMMENTÉ - NE PAS AJOUTER DE PARAMÈTRES
      // Le template hello_world n'accepte pas de paramètres
      /*
      if (parameters.length > 0) {
        data.template.components = [{
          type: 'body',
          parameters: parameters.map(param => ({
            type: 'text',
            text: param
          }))
        }];
      }
      */

      console.log('📤 Envoi WhatsApp à:', phoneNumber);
      console.log('📝 Template:', templateName);
      console.log('🔧 Paramètres: AUCUN (commentés temporairement)');

      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ WhatsApp envoyé avec succès');
      console.log('📨 ID Message:', response.data.messages[0].id);
      return { success: true, messageId: response.data.messages[0].id };
      
    } catch (error) {
      console.error('❌ Erreur WhatsApp:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error?.message };
    }
  }

  // Notification automatique pour voyage
  async sendAutoTravelConfirmation(clientData) {
    console.log('🎯 Préparation message VOYAGE pour:', clientData.prenom, clientData.nom);
    
    return await this.sendTemplateMessage(
      clientData.telephone,
      'hello_world', // ✅ Template qui fonctionne
      [] // ⚠️ Tableau VIDE - aucun paramètre
    );
  }

  // Notification automatique pour transfert
  async sendAutoTransferConfirmation(clientData) {
    console.log('🎯 Préparation message TRANSFERT pour:', clientData.prenom, clientData.nom);
    
    return await this.sendTemplateMessage(
      clientData.telephone,
      'hello_world', // ✅ Template qui fonctionne
      [] // ⚠️ Tableau VIDE - aucun paramètre
    );
  }

  // Méthode principale
  async sendAutoNotification(formData, type) {
    console.log('\n🚀 ENVOI WHATSAPP AUTOMATIQUE');
    console.log('👤 Client:', `${formData.prenom} ${formData.nom}`);
    console.log('📞 Téléphone:', formData.telephone);
    console.log('📋 Type:', type);

    try {
      let result;
      if (type === 'voyage') {
        result = await this.sendAutoTravelConfirmation(formData);
      } else {
        result = await this.sendAutoTransferConfirmation(formData);
      }

      console.log('📱 Résultat final:', result.success ? '✅ SUCCÈS' : '❌ ÉCHEC');
      return result;
      
    } catch (error) {
      console.error('💥 Erreur critique WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
