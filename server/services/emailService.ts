import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { NotificationType } from '../../shared/notificationTypes';

interface EmailData {
  to: string;
  userName?: string;
  companyName?: string;
  senderName?: string;
  listingTitle?: string;
  listingId?: number;
  reason?: string;
  amount?: string;
  type?: string;
  transactionId?: string;
  link?: string;
  [key: string]: any;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const EMAIL_TEMPLATE_MAP: Partial<Record<NotificationType, string>> = {
  'welcome': 'account/welcome.html',
  'pro_account_activated': 'account/pro_account_activated.html',
  'new_message': 'messaging/new_message.html',
  'message_reply': 'messaging/message_reply.html',
  'listing_validated': 'listings/listing_validated.html',
  'listing_rejected': 'listings/listing_rejected.html',
  'listing_favorited': 'listings/listing_favorited.html',
  'payment_success': 'payments/payment_success.html',
  'payment_failed': 'payments/payment_failed.html',
  'new_follower': 'followers/new_follower.html',
  'followed_new_listing': 'followers/followed_new_listing.html',
};

async function loadTemplate(templatePath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), 'server', 'templates', templatePath);
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Erreur de chargement du template ${templatePath}:`, error);
    throw error;
  }
}

function replaceVariables(template: string, data: EmailData): string {
  let result = template;
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
  });
  
  return result;
}

export async function sendEmail(
  notificationType: NotificationType,
  title: string,
  data: EmailData
): Promise<boolean> {
  try {
    const templatePath = EMAIL_TEMPLATE_MAP[notificationType];
    
    if (!templatePath) {
      console.log(`⏭️  Aucun template email pour ${notificationType}, envoi ignoré (notification in-app créée)`);
      return false;
    }

    const templateHtml = await loadTemplate(templatePath);
    const htmlContent = replaceVariables(templateHtml, {
      ...data,
      title,
      year: new Date().getFullYear().toString(),
    });

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: data.to,
      subject: title,
      html: htmlContent,
    });

    console.log(`✅ Email envoyé avec succès: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email:`, error);
    return false;
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion SMTP:', error);
    return false;
  }
}
