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
                const now = new Date();
                const nowStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
                  now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                const replyBtnHtml = email && email.trim() ?
                  `<a href="mailto:${email}" style="display: inline-block; background-color: #ffffff; color: #1b4332; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 8px; border: 1.5px solid #1b4332; margin: 4px;">&#9993; Reply via Email</a>` : '';

                const emailRowHtml = email && email.trim() ?
                  `<a href="mailto:${email}" style="color: #1b4332; text-decoration: none; word-break: break-all; overflow-wrap: anywhere; font-weight: 600;">${email}</a>` :
                  `<span style="color: #94a3b8; font-style: italic;">Not provided</span>`;

                const info = await brevoTransporter.sendMail({
                  from: `"Homeopathy Clinic Website" <${senderEmail}>`,
                  to: receiverEmail,
                  replyTo: replyEmail,
                  subject: `New Patient Inquiry: ${fullName} (${selectedPurpose})`,
                  text: `=============================================\nNEW PATIENT INQUIRY - WRITE TO US\nHomeopathy Clinic Website\n=============================================\n\n• Patient Name   : ${fullName}\n• Phone Number   : +91 ${phone}\n• Email Address  : ${email || 'Not provided'}\n• Inquiry Purpose: ${selectedPurpose}\n• Submitted On   : ${nowStr}\n\n---------------------------------------------\nPATIENT MESSAGE:\n---------------------------------------------\n${message}\n\n=============================================\nReply to this email or call +91 ${phone} to respond to the patient.\n`,
                  html: `<!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>New Patient Inquiry</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #edf2ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%;">
                      <div style="background-color: #edf2ee; padding: 20px 10px; width: 100%; box-sizing: border-box;">
                        <div style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #dce4de; box-sizing: border-box;">
                          
                          <!-- Header Banner -->
                          <div style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 24px 20px; color: #ffffff; box-sizing: border-box;">
                            <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 8px;">NEW INQUIRY</span>
                            <h2 style="margin: 0; font-size: 21px; font-weight: 700; line-height: 1.3; color: #ffffff;">Write to Us &bull; Patient Contact</h2>
                            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.92; line-height: 1.4; color: #e8f5e9;">A patient submitted a new inquiry on the clinic website.</p>
                          </div>

                          <!-- Content Body -->
                          <div style="padding: 22px 20px; box-sizing: border-box;">
                            
                            <!-- Field: Patient Name -->
                            <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Patient Name</div>
                              <div style="font-size: 16px; font-weight: 700; color: #0f172a; word-break: break-word;">${fullName}</div>
                            </div>

                            <!-- Field: Phone Number -->
                            <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Phone Number</div>
                              <div style="font-size: 15px; font-weight: 700;">
                                <a href="tel:${phone}" style="color: #1b4332; text-decoration: none; word-break: break-word;">+91 ${phone}</a>
                              </div>
                            </div>

                            <!-- Field: Email Address -->
                            <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Email Address</div>
                              <div style="font-size: 14.5px; word-break: break-all; overflow-wrap: anywhere; line-height: 1.4;">
                                ${emailRowHtml}
                              </div>
                            </div>

                            <!-- Field: Purpose of Contact -->
                            <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px;">Inquiry Purpose</div>
                              <span style="display: inline-block; background-color: #e8f5e9; color: #1b4332; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 6px;">
                                ${selectedPurpose}
                              </span>
                            </div>

                            <!-- Field: Submitted On -->
                            <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Submitted On</div>
                              <div style="font-size: 13.5px; color: #475569; font-weight: 500;">${nowStr}</div>
                            </div>

                            <!-- Field: Patient Message Box -->
                            <div style="background-color: #f8faf9; border-left: 4px solid #1b4332; border-radius: 8px; padding: 16px 14px; margin-top: 16px; box-sizing: border-box;">
                              <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px;">PATIENT MESSAGE</span>
                              <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 14.5px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;">${message}</p>
                            </div>

                            <!-- Action Buttons -->
                            <div style="margin-top: 22px; text-align: center;">
                              <a href="tel:${phone}" style="display: inline-block; background-color: #1b4332; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 8px; margin: 4px;">📞 Call Patient</a>
                              ${replyBtnHtml}
                            </div>

                            <!-- Footer Note -->
                            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #edf2ee; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                              Sent to <strong>${receiverEmail}</strong> via Brevo SMTP relay.<br/>
                              You can also click <strong>Reply</strong> in your email client to respond directly.
                            </div>

                          </div>
                        </div>
                      </div>
                    </body>
                    </html>`
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

