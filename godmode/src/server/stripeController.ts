import Stripe from 'stripe';
import crypto from 'crypto';

export interface ForgeCustomer {
    id: string;
    email: string;
    stripe_customer_id: string | null;
    tier: 'NONE' | 'ONCE' | 'PRO';
    active: boolean;
    created_at: number;
    last_build_at: number | null;
    build_count: number;
}

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (key) {
            stripeInstance = new Stripe(key, { apiVersion: '2025-01-27.accompat' as any });
        }
    }
    return stripeInstance;
}

export async function generateArbitragePaymentLink(amountUsd: number, description: string): Promise<string> {
    const stripe = getStripe();
    if (!stripe) {
        return `https://mock.stripe.com/pay?amount=${amountUsd}&desc=${encodeURIComponent(description)}`;
    }
    
    try {
        const product = await stripe.products.create({
            name: description,
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(amountUsd * 100), // convert to cents
            currency: 'usd',
        });

        const paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
        });

        return paymentLink.url;
    } catch (e) {
        console.error('[STRIPE ERROR]: Failed to generate execution link', e);
        return `https://mock.stripe.com/pay_error?amount=${amountUsd}`;
    }
}

export class StripeController {
    constructor(private db: any = null) {
        this.initTable();
    }

    private initTable() {
        if (!this.db) return;
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS forge_customers (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    stripe_customer_id TEXT,
                    tier TEXT NOT NULL DEFAULT 'NONE',
                    active INTEGER DEFAULT 1,
                    created_at INTEGER NOT NULL,
                    last_build_at INTEGER,
                    build_count INTEGER DEFAULT 0
                );
                
                CREATE TABLE IF NOT EXISTS admins (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ SQLite forge_customers and admins tables initialized');
            
            // Seed Prime Architect / Admin
            this.db.prepare(`
                INSERT OR IGNORE INTO admins (id, email)
                VALUES (?, ?)
            `).run('prime-architect', 'marquiswhitacre@gmail.com');

            // Auto-create/seed the prime admin account as predefined PRO
            this.db.prepare(`
                INSERT OR IGNORE INTO forge_customers (id, email, tier, active, created_at, build_count)
                VALUES (?, ?, 'PRO', 1, ?, 999)
            `).run('c-admin-root', 'marquiswhitacre@gmail.com', Date.now());
        } catch (e) {
            console.error('[StripeController] Failed to initialize tables:', e);
        }
    }

    /**
     * Verifies if a user is currently authorized to deploy/utilize Forge builds
     */
    public checkBuildAuthorization(email: string): { authorized: boolean; tier: 'NONE' | 'ONCE' | 'PRO' | 'ADMIN'; expiresAt?: number; unlimited?: boolean } {
        const cleanEmail = String(email || '').trim().toLowerCase();
        
        if (!this.db) {
            if (cleanEmail === 'marquiswhitacre@gmail.com') {
                return { authorized: true, tier: 'ADMIN', unlimited: true };
            }
            return { authorized: false, tier: 'NONE' };
        }

        try {
            // Check admins table first
            const adminCheck = this.db.prepare('SELECT * FROM admins WHERE email = ?').get(cleanEmail);
            if (adminCheck) {
                return { authorized: true, tier: 'ADMIN', unlimited: true };
            }

            const customer = this.db.prepare('SELECT * FROM forge_customers WHERE email = ?').get(cleanEmail) as any;
            if (!customer || customer.active === 0) {
                return { authorized: false, tier: 'NONE' };
            }

            if (customer.tier === 'PRO') {
                return { authorized: true, tier: 'PRO' };
            }

            if (customer.tier === 'ONCE') {
                // Check if the purchase happened within the last 24 hours
                const oneDayInMs = 24 * 60 * 60 * 1000;
                const expirationTime = customer.created_at + oneDayInMs;
                const active = Date.now() < expirationTime;
                
                return { 
                    authorized: active, 
                    tier: 'ONCE', 
                    expiresAt: expirationTime 
                };
            }
        } catch (e) {
            console.error('[StripeController] Authorization verification failed:', e);
        }

        return { authorized: false, tier: 'NONE' };
    }

    /**
     * Verifies or fetches a buyer customer profile
     */
    public verifyCustomer(email: string): ForgeCustomer {
        const cleanEmail = String(email || '').trim().toLowerCase();
        const defaultProfile: ForgeCustomer = {
            id: 'c-new-' + Math.random().toString(36).substring(3, 9),
            email: cleanEmail,
            stripe_customer_id: null,
            tier: 'NONE',
            active: false,
            created_at: Date.now(),
            last_build_at: null,
            build_count: 0
        };

        if (cleanEmail === 'marquiswhitacre@gmail.com') {
            return {
                ...defaultProfile,
                id: 'c-admin-root',
                tier: 'PRO',
                active: true,
                build_count: 9999
            };
        }

        if (!this.db) return defaultProfile;

        try {
            let row = this.db.prepare('SELECT * FROM forge_customers WHERE email = ?').get(cleanEmail) as any;
            if (!row) {
                // Insert standard starting profile
                this.db.prepare(`
                    INSERT INTO forge_customers (id, email, stripe_customer_id, tier, active, created_at, build_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    defaultProfile.id,
                    defaultProfile.email,
                    null,
                    'NONE',
                    0,
                    defaultProfile.created_at,
                    0
                );
                return defaultProfile;
            }

            return {
                id: row.id,
                email: row.email,
                stripe_customer_id: row.stripe_customer_id,
                tier: row.tier as any,
                active: row.active === 1,
                created_at: row.created_at,
                last_build_at: row.last_build_at,
                build_count: row.build_count
            };
        } catch (e) {
            console.error('[StripeController] Error fetching customer:', e);
            return defaultProfile;
        }
    }

    /**
     * Records a successful client execution and audits cost metrics
     */
    public incrementBuildCount(email: string) {
        if (!this.db) return;
        try {
            const cleanEmail = String(email || '').trim().toLowerCase();
            this.db.prepare(`
                UPDATE forge_customers 
                SET build_count = build_count + 1, last_build_at = ? 
                WHERE email = ?
            `).run(Date.now(), cleanEmail);
        } catch (e) {
            console.error('[StripeController] Failed to record execution increment:', e);
        }
    }

    /**
     * Initializes Stripe PaymentIntent for specified size
     */
    public async createPaymentIntent(email: string, Complexity: 'QUICK' | 'STANDARD' | 'DEEP') {
        const pricing = { QUICK: 2.99, STANDARD: 7.99, DEEP: 19.99 };
        const price = pricing[Complexity] || 7.99;
        const cleanEmail = email.toLowerCase().trim();

        const stripe = getStripe();
        if (!stripe) {
            // MOCK sandbox generation if secret key is omitted - keeps application robust and test-ready
            console.log(`[StripeController] No active STRIPE_SECRET_KEY detected. Creating sandbox payment intent object for ${Complexity} ($${price}).`);
            const mockIntentId = 'pi_mock_' + crypto.randomBytes(16).toString('hex');
            return {
                id: mockIntentId,
                clientSecret: 'cs_mock_secret_' + crypto.randomBytes(24).toString('hex'),
                amount: price,
                isMock: true,
                message: "Stripe sandbox simulated, proceed with checkout simulation."
            };
        }

        const amountCents = Math.round(price * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'usd',
            receipt_email: cleanEmail,
            metadata: {
                email: cleanEmail,
                complexity: Complexity,
                type: 'SINGLE_BUILD'
            }
        });

        return {
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            amount: price,
            isMock: false
        };
    }

    /**
     * Initializes Stripe Checkout Session forMonthly subscription package ($49.00/mo)
     */
    public async createSubscriptionSession(email: string, successUrl: string, cancelUrl: string) {
        const cleanEmail = email.toLowerCase().trim();
        const priceUsd = 49.00;

        const stripe = getStripe();
        if (!stripe) {
            console.log(`[StripeController] No active STRIPE_SECRET_KEY. Simulating monthly subscription checkout link.`);
            const mockSessionId = 'cs_subs_mock_' + crypto.randomBytes(16).toString('hex');
            return {
                id: mockSessionId,
                url: `${successUrl}?session_id=${mockSessionId}&mock=true&email=${encodeURIComponent(cleanEmail)}`,
                isMock: true
            };
        }

        // Check or create subscription product/price dynamically on the fly
        const products = await stripe.products.list({ limit: 5 });
        let product = products.data.find(p => p.name === 'Forge Pro Subscription');
        if (!product) {
            product = await stripe.products.create({
                name: 'Forge Pro Subscription',
                description: 'Unlimited high-performance builds in the Living Forge matrix'
            });
        }

        const prices = await stripe.prices.list({ product: product.id });
        let price = prices.data.find(p => p.recurring?.interval === 'month' && p.unit_amount === 4900);
        if (!price) {
            price = await stripe.prices.create({
                product: product.id,
                unit_amount: 4900,
                currency: 'usd',
                recurring: { interval: 'month' }
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            billing_address_collection: 'auto',
            customer_email: cleanEmail,
            line_items: [
                {
                    price: price.id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                email: cleanEmail,
                type: 'SUBSCRIPTION'
            }
        });

        return {
            id: session.id,
            url: session.url,
            isMock: false
        };
    }

    /**
     * Hooks success records directly to database
     */
    public recordSuccessfulPayment(email: string, tier: 'ONCE' | 'PRO', amount: number, stripeId: string) {
        if (!this.db) return;
        const cleanEmail = String(email || '').trim().toLowerCase();
        try {
            const customerId = 'c-' + Math.random().toString(36).substring(3, 9);
            this.db.prepare(`
                INSERT INTO forge_customers (id, email, stripe_customer_id, tier, active, created_at, build_count)
                VALUES (?, ?, ?, ?, 1, ?, 0)
                ON CONFLICT(email) DO UPDATE SET
                    stripe_customer_id = excluded.stripe_customer_id,
                    tier = excluded.tier,
                    active = 1,
                    created_at = excluded.created_at
            `).run(customerId, cleanEmail, stripeId, tier, Date.now());

            // Write entry to economic ledger
            const category = tier === 'PRO' ? 'SUBSCRIPTION' : 'BUILD_SALE';
            const logStmt = this.db.prepare(`
                INSERT INTO economic_ledger (
                    id, timestamp, project_id, type, category, amount, model, tokens_in, tokens_out, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            logStmt.run(
                'tr-stripe-' + stripeId,
                Date.now(),
                'God Mode OS',
                'REVENUE',
                category,
                amount,
                null,
                null,
                null,
                `Stripe Checkout Fulfillment: ${tier} Tier for ${cleanEmail}`
            );

            console.log(`[StripeController] Successfully verified and provisioned payment for: ${cleanEmail} (${tier} tier)`);
        } catch (e) {
            console.error('[StripeController] Error logging success transaction:', e);
        }
    }
}
