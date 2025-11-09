const nodemailer = require('nodemailer');
require('dotenv').config();

// Version debug du service email
const createTransporter = () => {
  console.log('🔧 Configuration transporteur email:');
  console.log('   Host: smtp.gmail.com');
  console.log('   Port: 587');
  console.log('   User:', process.env.EMAIL_USER);
  console.log('   Password défini:', !!process.env.EMAIL_PASSWORD);
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    logger: true,
    debug: true
  });
};

// Test direct
async function testEmailService() {
  console.log('=== TEST DIRECT SERVICE EMAIL ===');
  
  const transporter = createTransporter();
  
  try {
    console.log('1. Vérification connexion...');
    await transporter.verify();
    console.log('✅ Connexion OK');
    
    console.log('2. Envoi email test...');
    const result = await transporter.sendMail({
      from: `"Test Debug" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Debug Email Service',
      text: 'Ceci est un test'
    });
    
    console.log('✅ Email envoyé:', result.messageId);
    return true;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testEmailService();
}

module.exports = { createTransporter, testEmailService };
