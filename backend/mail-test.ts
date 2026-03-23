import * as nodemailer from 'nodemailer';

// Run this with: npx ts-node mail-test.ts

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: 'kpopie2009@gmail.com',
    pass: 'tgykgmponpqfhtaq',
  },
});

async function test() {
  console.log('Testing transporter connection...');

  // Step 1: verify connection
  try {
    await transporter.verify();
    console.log('✅ Transporter connected successfully');
  } catch (err) {
    console.error('❌ Transporter connection failed:', err);
    process.exit(1);
  }

  // Step 2: send a test email
  try {
    const info = await transporter.sendMail({
      from: '"Oralis AI" <kpopie2009@gmail.com>',
      to: 'kpopie2009@gmail.com',
      subject: 'Test email from NestJS',
      html: '<p>If you see this, your mail config works! ✅</p>',
    });
    console.log('✅ Email sent! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
}

test();
