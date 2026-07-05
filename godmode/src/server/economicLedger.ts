import { v4 as uuidv4 } from 'uuid';

export interface EconomicTransaction {
    id: string;
    timestamp: number;
    project_id: string;
    type: 'REVENUE' | 'COST';
    category: string; // 'BUILD_SALE' | 'SUBSCRIPTION' | 'MODEL_COST' | 'COMPUTE_COST'
    amount: number; // positive float in USD
    model?: string;
    tokens_in?: number;
    tokens_out?: number;
    description: string;
}

// Pricing constants in USD per 1,000,000 tokens
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'groq-llama-3-8b': { input: 0.05, output: 0.08 },
    'openai-gpt-4o': { input: 5.00, output: 15.00 }
};

export class EconomicLedger {
    constructor(private db: any = null) {
        this.initTable();
    }

    private initTable() {
        if (!this.db) return;
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS economic_ledger (
                    id TEXT PRIMARY KEY,
                    timestamp INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    type TEXT NOT NULL,
                    category TEXT NOT NULL,
                    amount REAL NOT NULL,
                    model TEXT,
                    tokens_in INTEGER,
                    tokens_out INTEGER,
                    description TEXT NOT NULL
                );
            `);
            console.log('✅ SQLite economic_ledger table initialized');
            
            // Seed some dummy transactions so the dashboard has historical stats out of the box if empty
            const rowCount = this.db.prepare('SELECT COUNT(*) as count FROM economic_ledger').get() as any;
            if (rowCount && rowCount.count === 0) {
                this.seedHistoricalData();
            }
        } catch (e) {
            console.error('[EconomicLedger] Failed to initialize table:', e);
        }
    }

    private seedHistoricalData() {
        if (!this.db) return;
        try {
            console.log('[EconomicLedger] Seeding historical data for Forge demo...');
            const seedStmt = this.db.prepare(`
                INSERT INTO economic_ledger (id, timestamp, project_id, type, category, amount, model, tokens_in, tokens_out, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            
            // Seed transactions across the last 14 days
            for (let i = 14; i >= 0; i--) {
                const dayTs = now - (i * oneDay);
                
                // Add some build sale revenue
                const buildCount = Math.floor(Math.random() * 4) + 1; // 1 to 4 builds
                for (let k = 0; k < buildCount; k++) {
                    const tiers: Array<['QUICK' | 'STANDARD' | 'DEEP', number]> = [
                        ['QUICK', 2.99],
                        ['STANDARD', 7.99],
                        ['DEEP', 19.99]
                    ];
                    const [tier, price] = tiers[Math.floor(Math.random() * tiers.length)];
                    seedStmt.run(
                        uuidv4(),
                        dayTs - Math.floor(Math.random() * 100000),
                        'God Mode OS',
                        'REVENUE',
                        'BUILD_SALE',
                        price,
                        null,
                        null,
                        null,
                        `Forge Build Purchase: ${tier} Tier`
                    );
                }

                // Add subscription revenues on day 10, 5, 1
                if (i === 10 || i === 5 || i === 1) {
                    seedStmt.run(
                        uuidv4(),
                        dayTs,
                        'God Mode OS',
                        'REVENUE',
                        'SUBSCRIPTION',
                        49.00,
                        null,
                        null,
                        null,
                        'Forge Monthly Subscription Pro Tier'
                    );
                }

                // Add model costs for builds
                const models = ['gemini-1.5-flash', 'claude-3.5-sonnet', 'openai-gpt-4o'];
                for (let j = 0; j < buildCount * 2; j++) {
                    const model = models[Math.floor(Math.random() * models.length)];
                    const pricing = MODEL_PRICING[model] || { input: 1.0, output: 5.0 };
                    const tokensIn = Math.floor(Math.random() * 20000) + 5000;
                    const tokensOut = Math.floor(Math.random() * 15000) + 2000;
                    const cost = ((tokensIn * pricing.input) + (tokensOut * pricing.output)) / 1000000;
                    
                    seedStmt.run(
                        uuidv4(),
                        dayTs - Math.floor(Math.random() * 250000),
                        'God Mode OS',
                        'COST',
                        'MODEL_COST',
                        parseFloat(cost.toFixed(6)),
                        model,
                        tokensIn,
                        tokensOut,
                        `Model API Execution: ${model}`
                    );
                }

                // Node compute cost
                seedStmt.run(
                    uuidv4(),
                    dayTs,
                    'God Mode OS',
                    'COST',
                    'COMPUTE_COST',
                    0.50,
                    null,
                    null,
                    null,
                    'Sandboxed Container Compute Allotment'
                );
            }
            console.log('✅ SQLite historical economic data seeded successfully');
        } catch (e) {
            console.error('[EconomicLedger] Failed to seed historical data:', e);
        }
    }

    public recordTransaction(
        projectId: string,
        type: 'REVENUE' | 'COST',
        category: string,
        amount: number,
        description: string,
        model?: string,
        tokensIn?: number,
        tokensOut?: number
    ): string {
        const id = uuidv4();
        if (!this.db) return id;
        try {
            const stmt = this.db.prepare(`
                INSERT INTO economic_ledger (
                    id, timestamp, project_id, type, category, amount, model, tokens_in, tokens_out, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const ts = Date.now();
            stmt.run(
                id,
                ts,
                projectId || 'God Mode OS',
                type,
                category,
                parseFloat(amount.toFixed(6)),
                model || null,
                tokensIn || null,
                tokensOut || null,
                description
            );
            return id;
        } catch (e) {
            console.error('[EconomicLedger] Failed to record transaction:', e);
            return id;
        }
    }

    public recordModelExpense(
        projectId: string,
        model: string,
        tokensIn: number,
        tokensOut: number,
        description: string
    ): number {
        const pricing = MODEL_PRICING[model] || { input: 0.1, output: 0.4 }; // fallback standard pricing
        const cost = ((tokensIn * pricing.input) + (tokensOut * pricing.output)) / 1000000;
        const roundedCost = parseFloat(cost.toFixed(6));
        
        this.recordTransaction(
            projectId,
            'COST',
            'MODEL_COST',
            roundedCost,
            description,
            model,
            tokensIn,
            tokensOut
        );
        return roundedCost;
    }

    public calculateBuildMargin(projectId?: string) {
        if (!this.db) return { revenue: 0, cost: 0, profit: 0, margin: 100 };
        try {
            let revQuery = "SELECT SUM(amount) as total FROM economic_ledger WHERE type = 'REVENUE'";
            let costQuery = "SELECT SUM(amount) as total FROM economic_ledger WHERE type = 'COST'";
            
            const params: any[] = [];
            if (projectId) {
                revQuery += " AND project_id = ?";
                costQuery += " AND project_id = ?";
                params.push(projectId);
            }

            const revRow = this.db.prepare(revQuery).get(...params) as any;
            const costRow = this.db.prepare(costQuery).get(...params) as any;

            const revenue = revRow ? (revRow.total || 0) : 0;
            const cost = costRow ? (costRow.total || 0) : 0;
            const profit = revenue - cost;
            const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 100;

            return {
                revenue: parseFloat(revenue.toFixed(2)),
                cost: parseFloat(cost.toFixed(2)),
                profit: parseFloat(profit.toFixed(2)),
                margin: Math.round(margin)
            };
        } catch (e) {
            console.error('[EconomicLedger] Failed to calculate margins:', e);
            return { revenue: 0, cost: 0, profit: 0, margin: 100 };
        }
    }

    public getPLReport(timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY', projectId?: string): any[] {
        if (!this.db) return [];
        try {
            // Group by daily date format (YYYY-MM-DD)
            const query = `
                SELECT 
                    date(timestamp / 1000, 'unixepoch', 'localtime') as period,
                    SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END) as revenue,
                    SUM(CASE WHEN type = 'COST' THEN amount ELSE 0 END) as cost
                FROM economic_ledger
                ${projectId ? 'WHERE project_id = ?' : ''}
                GROUP BY period
                ORDER BY period DESC
                LIMIT 30
            `;
            
            const rows = projectId 
                ? this.db.prepare(query).all(projectId) 
                : this.db.prepare(query).all();
                
            return rows.map((r: any) => {
                const rev = r.revenue || 0;
                const cost = r.cost || 0;
                const profit = rev - cost;
                return {
                    period: r.period,
                    revenue: parseFloat(rev.toFixed(2)),
                    cost: parseFloat(cost.toFixed(2)),
                    profit: parseFloat(profit.toFixed(2)),
                    margin: rev > 0 ? Math.round((profit / rev) * 100) : 100
                };
            });
        } catch (e) {
            console.error('[EconomicLedger] Failed to generate P&L report:', e);
            return [];
        }
    }

    public getEconomicStats(projectId?: string) {
        const margins = this.calculateBuildMargin(projectId);
        if (!this.db) {
            return {
                ...margins,
                totalBuildSales: 0,
                totalSubscriptions: 0,
                dailyAvgPL: 0,
                marginHealth: 'EXCELLENT',
                transactionsCount: 0
            };
        }

        try {
            let salesQuery = "SELECT SUM(amount) as total FROM economic_ledger WHERE category = 'BUILD_SALE'";
            let subsQuery = "SELECT SUM(amount) as total FROM economic_ledger WHERE category = 'SUBSCRIPTION'";
            let countQuery = "SELECT COUNT(*) as count FROM economic_ledger";
            
            const params: any[] = [];
            if (projectId) {
                salesQuery += " AND project_id = ?";
                subsQuery += " AND project_id = ?";
                countQuery += " AND project_id = ?";
                params.push(projectId);
            }

            const salesVal = (this.db.prepare(salesQuery).get(...params) as any).total || 0;
            const subsVal = (this.db.prepare(subsQuery).get(...params) as any).total || 0;
            const totalCount = (this.db.prepare(countQuery).get(...params) as any).count || 0;

            let health = 'EXCELLENT';
            if (margins.margin < 30) health = 'CRITICAL';
            else if (margins.margin < 60) health = 'CAUTIOUS';
            else if (margins.margin < 80) health = 'STABLE';

            return {
                revenue: margins.revenue,
                cost: margins.cost,
                profit: margins.profit,
                margin: margins.margin,
                totalBuildSales: parseFloat(salesVal.toFixed(2)),
                totalSubscriptions: parseFloat(subsVal.toFixed(2)),
                marginHealth: health,
                transactionsCount: totalCount
            };
        } catch (e) {
            console.error('[EconomicLedger] Failed to collect metrics:', e);
            return {
                ...margins,
                totalBuildSales: 0,
                totalSubscriptions: 0,
                dailyAvgPL: 0,
                marginHealth: 'STABLE',
                transactionsCount: 0
            };
        }
    }

    public getRecentTransactions(projectId?: string, limit: number = 20): any[] {
        if (!this.db) return [];
        try {
            const query = projectId
                ? 'SELECT * FROM economic_ledger WHERE project_id = ? ORDER BY timestamp DESC LIMIT ?'
                : 'SELECT * FROM economic_ledger ORDER BY timestamp DESC LIMIT ?';
            const params = projectId ? [projectId, limit] : [limit];
            return this.db.prepare(query).all(...params);
        } catch (e) {
            console.error('[EconomicLedger] Error fetching transactions:', e);
            return [];
        }
    }
}
