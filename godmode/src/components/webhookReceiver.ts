import express from 'express';
import crypto from 'crypto';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export function setupWebhookReceiver(app: express.Application) {
    const githubWebhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!githubWebhookSecret) {
        console.error('[WEBHOOK RECEIVER]: GITHUB_WEBHOOK_SECRET is not defined. Webhook security perimeter compromised.');
        return;
    }

    app.post('/webhook', async (req, res) => {
        const signature = req.headers['x-hub-signature-256'] as string;
        const payload = JSON.stringify(req.body);

        if (!signature) {
            console.warn('[WEBHOOK RECEIVER]: No signature provided. Rejecting unauthorized webhook.');
            return res.status(401).send('Unauthorized: No signature.');
        }

        const hmac = crypto.createHmac('sha256', githubWebhookSecret);
        const digest = 'sha256=' + hmac.update(payload).digest('hex');

        if (digest !== signature) {
            console.warn('[WEBHOOK RECEIVER]: Invalid signature. Rejecting forged webhook.');
            return res.status(401).send('Unauthorized: Invalid signature.');
        }

        // Signature verified. Initiating deployment.
        console.log('[WEBHOOK RECEIVER]: GitHub push detected and validated. Initiating deployment sequence.');
        res.status(202).send('Deployment initiated.');

        // Execute the server-side deployment script in a detached process
        // to not block the webhook response.
        execPromise('/home/youruser/deploy_prime_node.sh').then(({ stdout, stderr }) => {
            console.log(`[DEPLOYMENT SCRIPT STDOUT]: ${stdout}`);
            if (stderr) console.error(`[DEPLOYMENT SCRIPT STDERR]: ${stderr}`);
        }).catch(error => {
            console.error('[DEPLOYMENT SCRIPT ERROR]: Execution friction detected.', error);
        });
    });
}
