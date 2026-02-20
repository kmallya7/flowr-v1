/*
  Firebase Functions example for processing access invite emails from mailQueue.

  Setup:
  1. Move this file to your Firebase Functions project as functions/index.js
  2. npm i firebase-admin firebase-functions resend
  3. Set env secret: RESEND_API_KEY
  4. Deploy with: firebase deploy --only functions
*/

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

const resend = new Resend(process.env.RESEND_API_KEY || '');

exports.sendQueuedInviteEmail = functions.firestore
  .document('mailQueue/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const ref = snap.ref;

    if (data.status !== 'queued') return null;
    if (!data.to || !data.template) {
      await ref.set({
        status: 'failed',
        lastError: 'Missing required fields: to/template',
        attempts: (data.attempts || 0) + 1,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return null;
    }

    await ref.set({
      status: 'sending',
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    try {
      const roleLabel = String(data.role || 'user').toUpperCase();
      const appUrl = process.env.APP_URL || 'https://your-app-url.example.com';

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>You are invited to Flowr</h2>
          <p>Hello ${data.fullName || 'there'},</p>
          <p>You have been invited as <strong>${roleLabel}</strong>.</p>
          <p>Please sign in using Google with this email address.</p>
          <p><a href="${appUrl}">Open Flowr</a></p>
        </div>
      `;

      const response = await resend.emails.send({
        from: process.env.MAIL_FROM || 'Flowr <noreply@yourdomain.com>',
        to: [data.to],
        subject: 'Your Flowr access invite',
        html
      });

      await ref.set({
        status: 'sent',
        provider: 'resend',
        providerMessageId: response?.data?.id || null,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        attempts: (data.attempts || 0) + 1,
        lastError: admin.firestore.FieldValue.delete()
      }, { merge: true });

      return null;
    } catch (err) {
      await ref.set({
        status: 'failed',
        attempts: (data.attempts || 0) + 1,
        lastError: String(err && err.message ? err.message : err),
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return null;
    }
  });
