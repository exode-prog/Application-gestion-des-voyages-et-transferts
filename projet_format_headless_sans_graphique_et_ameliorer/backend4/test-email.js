// test-email.js
// Script pour tester la configuration SMTP Brevo

require('dotenv').config();
const nodemailer = require('nodemailer');

// ==========================================
// TEST CONFIGURATION SMTP
// ==========================================

async function testSMTPConnection() {
  console.log('\n🔍 Début du test de connexion SMTP...\n');
  
  // Vérifier que les variables d'environnement sont présentes
  console.log('📋 Vérification des variables d\'environnement:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST ? '✅' : '❌'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT ? '✅' : '❌'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅' : '❌'}`);
  console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅' : '❌'}`);
  console.log('');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Variables d\'environnement manquantes!');
    console.log('\n💡 Assurez-vous que votre fichier .env contient:');
    console.log('   SMTP_HOST=smtp-relay.brevo.com');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_USER=votre-email@example.com');
    console.log('   SMTP_PASSWORD=votre-cle-smtp-brevo');
    console.log('   SMTP_FROM=votre-email@example.com\n');
    process.exit(1);
  }

  // Créer le transporteur
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Test 1: Vérification de la connexion
  console.log('📡 Test 1: Vérification de la connexion SMTP...');
  try {
    await transporter.verify();
    console.log('   ✅ Connexion SMTP réussie!\n');
  } catch (error) {
    console.error('   ❌ Échec de la connexion SMTP:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('Invalid login')) {
      console.log('💡 Conseils:');
      console.log('   - Vérifiez que SMTP_USER est bien votre email Brevo');
      console.log('   - Vérifiez que SMTP_PASSWORD est votre clé SMTP (pas votre mot de passe compte)');
      console.log('   - La clé SMTP se trouve dans: Brevo → Settings → SMTP & API\n');
    }
    
    process.exit(1);
  }

  // Test 2: Envoi d'un email de test
  console.log('📧 Test 2: Envoi d\'un email de test...');
  
  const testEmail = process.env.SMTP_FROM || "exode4141@gmail.com";
  
  try {
    const info = await transporter.sendMail({
      from: `"DataCollectApp Test" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '✅ Test SMTP Brevo - DataCollectApp',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f7fa;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #10b981; margin-top: 0;">✅ Configuration SMTP réussie!</h1>
            
            <p>Félicitations! Votre configuration SMTP Brevo fonctionne correctement.</p>
            
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <h3 style="color: #15803d; margin-top: 0;">Informations de configuration</h3>
              <ul style="color: #4b5563;">
                <li><strong>Serveur SMTP:</strong> ${process.env.SMTP_HOST}</li>
                <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
                <li><strong>Utilisateur:</strong> ${process.env.SMTP_USER}</li>
                <li><strong>Date du test:</strong> ${new Date().toLocaleString('fr-FR')}</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Cet email de test a été envoyé automatiquement par DataCollectApp.
            </p>
          </div>
        </body>
        </html>
      `
    });

    console.log(`   ✅ Email de test envoyé avec succès!`);
    console.log(`   📬 Message ID: ${info.messageId}`);
    console.log(`   📧 Destinataire: ${testEmail}\n`);
    
    console.log('🎉 Tous les tests sont passés avec succès!\n');
    console.log('✅ Votre configuration SMTP Brevo est opérationnelle.');
    console.log('📬 Vérifiez votre boîte de réception pour voir l\'email de test.\n');
    
  } catch (error) {
    console.error('   ❌ Échec de l\'envoi de l\'email:');
    console.error(`   ${error.message}\n`);
    
    if (error.responseCode === 550) {
      console.log('💡 Erreur 550: Adresse email invalide ou rejetée');
      console.log('   Vérifiez que votre adresse email est vérifiée dans Brevo\n');
    }
    
    process.exit(1);
  }
}

// ==========================================
// EXÉCUTION DU TEST
// ==========================================

console.log('╔════════════════════════════════════════════════╗');
console.log('║   TEST DE CONFIGURATION SMTP - BREVO          ║');
console.log('╚════════════════════════════════════════════════╝');

testSMTPConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur inattendue:', error.message);
    process.exit(1);
  });
