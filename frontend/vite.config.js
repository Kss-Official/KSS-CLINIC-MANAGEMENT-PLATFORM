import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, path.resolve(__dirname), ''),
    ...loadEnv(mode, path.resolve(__dirname, '..'), ''),
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  };

  const receiverEmail = env.CLINIC_RECEIVER_EMAIL || 'pratikshaharode0@gmail.com';
  const senderEmail = env.BREVO_SENDER_EMAIL || 'pratikshaharode0@gmail.com';
  const smtpUser = env.BREVO_SMTP_USER || 'c10889001@smtp-brevo.com';
  const smtpKey = env.BREVO_SMTP_KEY || '';

  const brevoTransporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // TLS
    auth: {
      user: smtpUser,
      pass: smtpKey,
    },
  });

  function contactApiPlugin() {
    return {
      name: 'brevo-contact-api-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ? req.url.split('?')[0] : '';
          if (req.method === 'POST' && (url === '/api/contact' || url === '/api/contact/')) {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const data = JSON.parse(body || '{}');
                const { fullName, phone, email, purpose, message } = data;

                if (!fullName || !phone || !message) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, error: 'Full name, phone, and message are required.' }));
                  return;
                }

                const replyEmail = email && email.trim() ? email.trim() : receiverEmail;
                const selectedPurpose = purpose || 'General Consultation';

                const info = await brevoTransporter.sendMail({
                  from: `"Homeopathy Clinic Website" <${senderEmail}>`,
                  to: receiverEmail,
                  replyTo: replyEmail,
                  subject: `New Patient Inquiry: ${fullName} (${selectedPurpose})`,
                  text: `New Inquiry from Website Contact Form:\n\nFull Name: ${fullName}\nPhone: +91 ${phone}\nEmail: ${email || 'Not provided'}\nPurpose: ${selectedPurpose}\n\nMessage:\n${message}`,
                  html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f5; padding: 30px 15px;">
                      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5eae6;">
                        <div style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 24px 28px; color: #ffffff;">
                          <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 8px;">NEW INQUIRY</span>
                          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Write to Us &bull; Patient Contact</h2>
                          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">A patient submitted a new inquiry on the clinic website.</p>
                        </div>
                        
                        <div style="padding: 28px;">
                          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 22px;">
                            <tr style="border-bottom: 1px solid #f0f3f1;">
                              <td style="padding: 11px 0; color: #6b7280; font-weight: 600; width: 140px;">Patient Name:</td>
                              <td style="padding: 11px 0; color: #111827; font-weight: 700;">${fullName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f0f3f1;">
                              <td style="padding: 11px 0; color: #6b7280; font-weight: 600;">Phone Number:</td>
                              <td style="padding: 11px 0; color: #111827; font-weight: 600;"><a href="tel:${phone}" style="color: #1b4332; text-decoration: none;">+91 ${phone}</a></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f0f3f1;">
                              <td style="padding: 11px 0; color: #6b7280; font-weight: 600;">Email Address:</td>
                              <td style="padding: 11px 0; color: #111827;">${email ? `<a href="mailto:${email}" style="color: #1b4332; text-decoration: none;">${email}</a>` : '<span style="color: #9ca3af; font-style: italic;">Not provided</span>'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f0f3f1;">
                              <td style="padding: 11px 0; color: #6b7280; font-weight: 600;">Inquiry Purpose:</td>
                              <td style="padding: 11px 0; color: #111827; font-weight: 600;">${selectedPurpose}</td>
                            </tr>
                          </table>

                          <div style="background-color: #f9fbf9; border-left: 4px solid #1b4332; border-radius: 8px; padding: 16px; margin-top: 10px;">
                            <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Patient Message:</span>
                            <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 14.5px; white-space: pre-wrap;">${message}</p>
                          </div>

                          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f3f1; text-align: center;">
                            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                              Sent directly to <strong>${receiverEmail}</strong> via Brevo SMTP relay.<br/>
                              You can click <strong>Reply</strong> to respond directly to the patient.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  `,
                });

                console.log(`[Brevo SMTP] Email sent successfully to ${receiverEmail}! MessageId:`, info.messageId);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, message: 'Message sent successfully via Brevo.' }));
              } catch (err) {
                console.error('[Brevo SMTP Error]', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message || 'Failed to send email via Brevo SMTP.' }));
              }
            });
            return;
          }
          next();
        });
      },
    };
  }

  return {
    plugins: [react(), contactApiPlugin()],
    server: {
      port: 3000,
      open: true,
    },
  };
});
