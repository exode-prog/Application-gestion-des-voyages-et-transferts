require('dotenv').config();
const nodemailer = require('nodemailer');

async function testDifferentOptions() {
  const optionsList = [
    {
      name: "Option standard port 587",
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    },
    {
      name: "Option port 2525",
      host: "smtp-relay.brevo.com", 
      port: 2525,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    },
    {
      name: "Option avec TLS forcé",
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }
  ];

  for (const options of optionsList) {
    console.log(`\n🔧 Test: ${options.name}`);
    console.log(`   Host: ${options.host}:${options.port}`);
    
    try {
      const transporter = nodemailer.createTransport(options);
      await transporter.verify();
      console.log('   ✅ Connexion réussie!');
      
      // Test envoi email
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER,
        subject: `Test: ${options.name}`,
        text: 'Test réussi!'
      });
      console.log('   ✅ Email envoyé avec succès!');
      return; // Stop au premier succès
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }
}

testDifferentOptions();
