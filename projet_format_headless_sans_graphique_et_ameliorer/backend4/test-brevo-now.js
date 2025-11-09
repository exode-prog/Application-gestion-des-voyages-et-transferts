require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  family: 4, // FORCE IPv4
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

console.log('🔍 Test connexion avec family: 4 (IPv4 forcé)...\n');

transporter.verify()
  .then(() => {
    console.log('✅ Connexion SMTP réussie!\n');
    console.log('📧 Envoi d\'un email de test...');
    
    return transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: '✅ Test Brevo réussi - DataCollectApp',
      text: 'Félicitations! Votre configuration Brevo fonctionne parfaitement.',
      html: '<h1>✅ Succès!</h1><p>Votre configuration Brevo fonctionne.</p>'
    });
  })
  .then(info => {
    console.log('✅ Email envoyé!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n🎉 Configuration validée!\n');
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    console.log('\nDétails:', err);
  });
