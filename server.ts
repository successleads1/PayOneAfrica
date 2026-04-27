import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { initializeApp, cert, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pay-one-africa-secret-key';

// Initialize Firebase Admin
// Note: In this environment, we might not have a service account file, 
// so we'll try to initialize with default credentials or environment-provided project ID.
// However, firestore library on server sometimes needs credentials.
// For the sake of this implementation, we'll assume standard environment auth.
if (!getApps().length) {
  initializeApp({
    projectId: 'success-leads-403107',
  });
}

const db = getFirestore();
const auth = getAuth();

// --- EMAIL NOTIFICATION HELPER ---
async function sendEmailNotification(to: string, subject: string, body: string) {
  console.log(`[EMAIL SIMULATOR] To: ${to}, Subject: ${subject}`);
  console.log(`[EMAIL SIMULATOR] Body: ${body}`);
  
  try {
    await db.collection('mail').add({
      to,
      message: {
        subject,
        html: body,
      },
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log email to DB:', error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // --- API MIDDLEWARE ---
  const authenticateApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    try {
      // In a real app, hash and check against DB.
      // For MVP, look up merchant by API Key field.
      const merchantSnap = await db.collection('merchants')
        .where('apiKey', '==', apiKey)
        .limit(1)
        .get();

      if (merchantSnap.empty) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      const merchantData = merchantSnap.docs[0].data();
      if (merchantData.status !== 'approved') {
        return res.status(403).json({ error: 'Merchant is not approved' });
      }

      (req as any).merchant = { id: merchantSnap.docs[0].id, ...merchantData };
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // --- PAYMENT PROVIDER ABSTRACTION ---
  interface PaymentPayload {
    amount: number;
    currency: string;
    customerEmail: string;
    description?: string;
    provider: 'mock' | 'stripe' | 'paypal' | 'eft';
  }

  const providers = {
    mock: async (payload: PaymentPayload) => {
      // Simulate success for mock Card
      return { success: true, transactionId: `mock_${uuidv4()}` };
    },
    stripe: async (payload: PaymentPayload) => {
      // Simulate Stripe API call
      console.log('Stripe processing:', payload);
      return { success: true, transactionId: `stripe_${uuidv4()}` };
    },
    paypal: async (payload: PaymentPayload) => {
      // Simulate PayPal API call
      return { success: true, transactionId: `paypal_${uuidv4()}` };
    },
    eft: async (payload: PaymentPayload) => {
      // Simulating bank transfer initiation
      return { success: true, transactionId: `eft_${uuidv4()}`, status: 'pending' };
    }
  };

  // --- API ROUTES ---

  // Merchant creation (Registration)
  app.post('/api/merchants/register', async (req, res) => {
    try {
      const { businessName, registrationNumber, taxNumber, bankAccount, ownerId, idDocumentUrl } = req.body;
      
      const merchantRef = await db.collection('merchants').add({
        ownerId,
        businessName,
        registrationNumber,
        taxNumber,
        idDocumentUrl: idDocumentUrl || '',
        bankAccount,
        status: 'pending',
        apiKey: `poa_live_${uuidv4().replace(/-/g, '')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        balance: 0
      });

      // Initial status log
      await merchantRef.collection('statusHistory').add({
        oldStatus: 'none',
        newStatus: 'pending',
        adminId: 'system',
        adminEmail: 'PayOneAfrica System',
        createdAt: new Date().toISOString()
      });

      res.status(201).json({ id: merchantRef.id, message: 'Merchant registration pending approval' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to register merchant' });
    }
  });

  // Create Payment
  app.post('/api/payments/create', authenticateApiKey, async (req, res) => {
    try {
      const merchant = (req as any).merchant;
      const { amount, currency, customerEmail, description, provider = 'mock' } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      // Fraud detection check 1: Large spikes
      if (amount > 1000000) {
        // High risk
        return res.status(403).json({ error: 'High risk transaction blocked' });
      }

      // Get IP address
      const customerIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';

      // Fraud detection check 2: IP Velocity (e.g. max 10 transactions per hour per IP)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentTransactions = await db.collection('transactions')
        .where('customerIp', '==', customerIp)
        .where('createdAt', '>', oneHourAgo)
        .limit(11)
        .get();

      if (recentTransactions.size >= 10) {
        return res.status(429).json({ error: 'Terminal velocity reached. Too many transactions from this IP.' });
      }

      const providerFn = providers[provider as keyof typeof providers] || providers.mock;
      const result = await providerFn({ amount, currency, customerEmail, description, provider: provider as any }) as any;

      const fee = amount * 0.025; // 2.5% fee
      const netAmount = amount - fee;

      const transactionData = {
        merchantId: merchant.id,
        amount,
        currency,
        status: result.success ? (result.status || 'success') : 'failed',
        provider,
        customerEmail,
        customerIp,
        description,
        fee,
        netAmount,
        providerTransactionId: result.transactionId,
        createdAt: new Date().toISOString()
      };

      const transRef = await db.collection('transactions').add(transactionData);

      // Simple real-time update logic: Add to merchant balance if success
      if (transactionData.status === 'success') {
        const mercRef = db.collection('merchants').doc(merchant.id);
        await db.runTransaction(async (t) => {
          const doc = await t.get(mercRef);
          const currentBalance = doc.data()?.balance || 0;
          t.update(mercRef, { balance: currentBalance + netAmount });
        });
      }

      res.status(200).json({ 
        transactionId: transRef.id, 
        status: transactionData.status,
        providerResponse: result 
      });
    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  });

  // Verify Payment
  app.get('/api/payments/:id', authenticateApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const merchant = (req as any).merchant;

      const transSnap = await db.collection('transactions').doc(id).get();
      if (!transSnap.exists || transSnap.data()?.merchantId !== merchant.id) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(200).json(transSnap.data());
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  });

  // Admin: Approve Merchant
  app.post('/api/admin/merchants/:id/approve', async (req, res) => {
    // In a real app, check for admin auth header/token
    try {
      const { id } = req.params;
      const { adminId, adminEmail } = req.body;
      const merchantRef = db.collection('merchants').doc(id);
      const merchantSnap = await merchantRef.get();
      
      if (!merchantSnap.exists) {
        return res.status(404).json({ error: 'Merchant not found' });
      }

      const merchant = merchantSnap.data();
      const oldStatus = merchant?.status;
      
      await merchantRef.update({ status: 'approved', updatedAt: new Date().toISOString() });

      // Log history
      await merchantRef.collection('statusHistory').add({
        oldStatus,
        newStatus: 'approved',
        adminId: adminId || 'system',
        adminEmail: adminEmail || 'feelathomeincapetown@gmail.com',
        createdAt: new Date().toISOString()
      });

      // Get owner email
      try {
        const owner = await auth.getUser(merchant?.ownerId);
        if (owner.email) {
          await sendEmailNotification(
            owner.email, 
            'Your PayOneAfrica Account has been Approved!', 
            `<h1>Congratulations, ${merchant?.businessName}!</h1><p>Your account is now active. You can start processing payments and generating API keys.</p>`
          );
        }
      } catch (authErr) {
        console.error('Failed to get owner email for notification:', authErr);
      }

      res.json({ message: 'Merchant approved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve merchant' });
    }
  });

  // Admin: Reject Merchant
  app.post('/api/admin/merchants/:id/reject', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, adminId, adminEmail } = req.body;
      const merchantRef = db.collection('merchants').doc(id);
      const merchantSnap = await merchantRef.get();
      
      if (!merchantSnap.exists) {
        return res.status(404).json({ error: 'Merchant not found' });
      }

      const merchant = merchantSnap.data();
      const oldStatus = merchant?.status;

      await merchantRef.update({ status: 'rejected', updatedAt: new Date().toISOString(), rejectionReason: reason || 'Information provided was insufficient' });

      // Log history
      await merchantRef.collection('statusHistory').add({
        oldStatus,
        newStatus: 'rejected',
        adminId: adminId || 'system',
        adminEmail: adminEmail || 'feelathomeincapetown@gmail.com',
        reason: reason || 'Policy Violation',
        createdAt: new Date().toISOString()
      });

      // Get owner email
      try {
        const owner = await auth.getUser(merchant?.ownerId);
        if (owner.email) {
          await sendEmailNotification(
            owner.email, 
            'Your PayOneAfrica Account Status Update', 
            `<h1>Account Status: Rejected</h1><p>Dear ${merchant?.businessName},</p><p>Unfortunately, your account application has been rejected.</p><p>Reason: ${reason || 'Information provided was insufficient'}</p><p>Please contact support for more details.</p>`
          );
        }
      } catch (authErr) {
        console.error('Failed to get owner email for notification:', authErr);
      }

      res.json({ message: 'Merchant rejected' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject merchant' });
    }
  });

  // Admin: Suspend Merchant
  app.post('/api/admin/merchants/:id/suspend', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, adminId, adminEmail } = req.body;
      const merchantRef = db.collection('merchants').doc(id);
      const merchantSnap = await merchantRef.get();
      
      if (!merchantSnap.exists) {
        return res.status(404).json({ error: 'Merchant not found' });
      }

      const merchant = merchantSnap.data();
      const oldStatus = merchant?.status;

      await merchantRef.update({ 
        status: 'suspended', 
        updatedAt: new Date().toISOString(), 
        suspensionReason: reason || 'Policy Violation' 
      });

      // Log history
      await merchantRef.collection('statusHistory').add({
        oldStatus,
        newStatus: 'suspended',
        adminId: adminId || 'system',
        adminEmail: adminEmail || 'feelathomeincapetown@gmail.com',
        reason: reason || 'Policy Violation',
        createdAt: new Date().toISOString()
      });

      // Get owner email
      try {
        const owner = await auth.getUser(merchant?.ownerId);
        if (owner.email) {
          await sendEmailNotification(
            owner.email, 
            'Your PayOneAfrica Account has been Suspended', 
            `<h1>Account Suspended</h1><p>Dear ${merchant?.businessName},</p><p>Your account has been suspended indefinitely.</p><p>Reason: ${reason || 'Policy Violation'}</p><p>New payment processing is disabled. Please contact support immediately.</p>`
          );
        }
      } catch (authErr) {
        console.error('Failed to get owner email for notification:', authErr);
      }

      res.json({ message: 'Merchant suspended' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to suspend merchant' });
    }
  });

  // Admin: Support Reply
  app.post('/api/admin/support/reply', async (req, res) => {
    try {
      const { threadId, content, adminId } = req.body;
      
      const threadRef = db.collection('supportThreads').doc(threadId);
      const threadSnap = await threadRef.get();
      
      if (!threadSnap.exists) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const thread = threadSnap.data();
      const merchantId = thread?.merchantId;

      // Update thread
      await threadRef.update({
        lastMessageAt: new Date().toISOString(),
        unreadCountByMerchant: (thread?.unreadCountByMerchant || 0) + 1
      });

      // Add message
      await db.collection('supportMessages').add({
        threadId,
        merchantId,
        senderId: adminId,
        senderType: 'admin',
        content,
        createdAt: new Date().toISOString()
      });

      // Notify merchant
      try {
        const merchantSnap = await db.collection('merchants').doc(merchantId).get();
        if (merchantSnap.exists) {
          const merchant = merchantSnap.data();
          const owner = await auth.getUser(merchant?.ownerId);
          if (owner.email) {
            await sendEmailNotification(
              owner.email,
              'New Support Message from PayOneAfrica Admin',
              `<p>You have a new message regarding your support ticket "${thread?.merchantName}".</p><p>Message: <i>${content}</i></p><a href="${process.env.APP_URL || 'http://localhost:3000'}/support">Reply here</a>`
            );
          }
        }
      } catch (notifyErr) {
        console.error('Support notification failed:', notifyErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Support reply error:', error);
      res.status(500).json({ error: 'Failed to send reply' });
    }
  });

  // Settlement Engine Simulator Endpoint
  // This would normally be a cron job
  app.post('/api/admin/process-settlements', async (req, res) => {
    try {
      // Find all merchants with pending balance
      const merchantsSnap = await db.collection('merchants').where('balance', '>', 0).get();
      const results = [];

      for (const mercDoc of merchantsSnap.docs) {
        const merchant = mercDoc.data();
        const amount = merchant.balance;

        // Create settlement record
        const settlementData = {
          merchantId: mercDoc.id,
          amount,
          status: 'queued',
          scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // T+2
          createdAt: new Date().toISOString()
        };

        const settRef = await db.collection('settlements').add(settlementData);
        
        // Reset merchant balance
        await mercDoc.ref.update({ balance: 0 });
        
        results.push({ merchantId: mercDoc.id, settlementId: settRef.id, amount });
      }

      res.json({ message: 'Settlements processed', results });
    } catch (error) {
      res.status(500).json({ error: 'Settlement processing failed' });
    }
  });

  // Webhook Simulator
  app.post('/api/webhook', async (req, res) => {
    console.log('Webhook received:', req.body);
    res.status(200).send('OK');
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
