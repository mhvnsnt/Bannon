const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const { Octokit } = require('@octokit/rest');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('[BOOT] Checking environment variables...');
const envVars = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_ADMIN_ID: process.env.TELEGRAM_ADMIN_ID,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_OWNER: process.env.GITHUB_OWNER,
  GITHUB_REPO: process.env.GITHUB_REPO,
  GITHUB_BRANCH: process.env.GITHUB_BRANCH,
  RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  RAILWAY_API_TOKEN: process.env.RAILWAY_API_TOKEN,
  RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
  RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID,
  RAILWAY_ENVIRONMENT_ID: process.env.RAILWAY_ENVIRONMENT_ID,
  ADMIN_SECRET: process.env.ADMIN_SECRET
};

for (const [key, value] of Object.entries(envVars)) {
  if (value) console.log(`[BOOT] ✔ ${key} is set.`);
  else console.warn(`[BOOT] ⚠ ${key} is NOT set.`);
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8867602832:AAFv-BujSUiAGR-RjIJVr5snBtIT8u99aqk'; // Fallback to provided token if env var is missed
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID; 

const PUBLIC_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : (process.env.WEBHOOK_URL || 'https://bannon-production.up.railway.app');

const bot = new TelegramBot(TOKEN);

async function connectTelegram() {
  if (!TOKEN) {
    console.log('⚠ TELEGRAM_BOT_TOKEN missing');
    return;
  }
  if (!PUBLIC_URL) {
    console.log('⚠ No public URL set — falling back to polling');
    bot.startPolling();
    return;
  }

  const webhookPath = `/webhook/${TOKEN}`;
  const fullWebhookUrl = `${PUBLIC_URL}${webhookPath}`;

  try {
    await bot.setWebHook(fullWebhookUrl);
    const info = await bot.getWebHookInfo();

    if (info.url === fullWebhookUrl) {
      console.log(`✔ Webhook confirmed live: ${info.url}`);
    } else {
      console.log(`⚠ Webhook mismatch — Telegram has "${info.url}", expected "${fullWebhookUrl}". Falling back to polling.`);
      await bot.deleteWebHook();
      bot.startPolling();
    }
  } catch (err) {
    console.log(`⚠ setWebHook failed: ${err.message} — falling back to polling`);
    bot.startPolling();
  }
}

app.use(express.json());
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

connectTelegram();


// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'placeholder');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Octokit (GitHub)
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';

const SYSTEM_CONTEXT = `You are Living Nexus, M.'s AI collaborator on the BANNON wrestling game project. Be direct and concrete, not grandiose. Never claim a file exists, a build succeeded, or a system is "verified" unless you have actually executed something and can show real output.`;

bot.on('webhook_error', (err) => console.error('[TELEGRAM] Webhook error:', err.message));
bot.on('polling_error', (err) => console.error('[TELEGRAM] Polling error:', err.message));

function isAdmin(msgId) {
  if (msgId.toString() === '8580133014') return true; // Direct hardcoded bypass for Marquis
  if (!ADMIN_ID) return true; // Default to allow if not configured
  return msgId.toString() === ADMIN_ID;
}

// --- AUTONOMOUS DIRECT PUSH ---
async function pushFileChange(filePath, newContent, commitMessage) {
  let existingSha;
  try {
    const { data: existing } = await octokit.repos.getContent({
      owner: OWNER, repo: REPO, path: filePath, ref: BRANCH
    });
    existingSha = existing.sha;
  } catch (e) {
    // file doesn't exist yet — fine, this creates it
  }

  const { data: commit } = await octokit.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO, path: filePath,
    message: commitMessage,
    content: Buffer.from(newContent).toString('base64'),
    branch: BRANCH,
    sha: existingSha
  });

  return commit.commit.html_url;
}

bot.onText(/\/push (.+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  bot.sendMessage(msg.chat.id, 'Pushing...');
  try {
    // Right now this is testing the pipeline logic with a timestamp file:
    const commitUrl = await pushFileChange(
      `test_push_${Date.now()}.md`, 'NEW_CONTENT_HERE', 'AUTONOMOUS: ' + match[1]
    );
    bot.sendMessage(msg.chat.id, `Pushed: ${commitUrl}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Failed: ${err.message}`);
  }
});

// --- AI WORKSPACE (Google AI Studio / Claude Code Replacement) ---
bot.onText(/\/agent (\w+) (.+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  const targetAgent = match[1].toLowerCase();
  const prompt = match[2];
  bot.sendMessage(msg.chat.id, `Routing directive to [${targetAgent.toUpperCase()}]...`);
  
  try {
    let reply = "";
    if (targetAgent === 'gemini') {
      const result = await model.generateContent(prompt);
      reply = result.response.text();
    } else if (targetAgent === 'deepseek' || targetAgent === 'qwen' || targetAgent === 'quibble') {
      // Use free models if available, or premium if set
      const modelMap = {
        'deepseek': 'deepseek/deepseek-chat:free',
        'qwen': 'qwen/qwen-2-7b-instruct:free',
        'quibble': 'qwen/qwen-2.5-coder-32b-instruct' 
      };
      const orModel = modelMap[targetAgent] || 'deepseek/deepseek-chat:free';
      const orKey = process.env.OPENROUTER_API_KEY || 'sk-or-v1-dummy-fallback'; 
      // If we don't have a key, OpenRouter will likely fail, but let's attempt it
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: orModel,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const orData = await orRes.json();
      if (orData.error) throw new Error(orData.error.message || JSON.stringify(orData.error));
      reply = orData.choices?.[0]?.message?.content || "No response from OpenRouter.";
    } else {
      reply = `Unknown agent designation: ${targetAgent}. Try gemini, deepseek, or qwen.`;
    }

    
    // Telegram message chunking for long code outputs
    const chunks = reply.match(/[\s\S]{1,4000}/g) || [];
    for (const chunk of chunks) {
      await bot.sendMessage(msg.chat.id, chunk);
    }
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Agent [${targetAgent}] Error: ${err.message}`);
  }
});

bot.onText(/\/code (\w+) (.+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  const targetAgent = match[1].toLowerCase();
  const prompt = match[2];
  
  bot.sendMessage(msg.chat.id, `Generating code via [${targetAgent.toUpperCase()}] and pushing to GitHub...`);
  
  try {
     let generatedCode = "// Generated code fallback";
     if (targetAgent === 'gemini') {
         const result = await model.generateContent(`Generate code for the following. Respond ONLY with raw code, no markdown wrapping:\n${prompt}`);
         generatedCode = result.response.text();
     } else if (targetAgent === 'deepseek' || targetAgent === 'qwen' || targetAgent === 'quibble') {
         const modelMap = {
           'deepseek': 'deepseek/deepseek-chat:free',
           'qwen': 'qwen/qwen-2-7b-instruct:free',
           'quibble': 'qwen/qwen-2.5-coder-32b-instruct'
         };
         const orModel = modelMap[targetAgent] || 'deepseek/deepseek-chat:free';
         const orKey = process.env.OPENROUTER_API_KEY || 'sk-or-v1-dummy-fallback';
         
         const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${orKey}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             model: orModel,
             messages: [{ role: 'user', content: `Generate code for the following. Respond ONLY with raw code, no markdown wrapping:\n${prompt}` }]
           })
         });
         const orData = await orRes.json();
         if (orData.error) throw new Error(orData.error.message || JSON.stringify(orData.error));
         generatedCode = orData.choices?.[0]?.message?.content || "// No code generated";
         
         // Remove markdown wrapping if the model ignored the instruction
         generatedCode = generatedCode.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
     } else {
         generatedCode = `// Unknown agent: ${targetAgent}`;
     }
     
     const fileName = `generated_${Date.now()}.js`;
     const commitUrl = await pushFileChange(
        fileName, generatedCode, `AUTONOMOUS CODE GEN via ${targetAgent}: ` + prompt.substring(0, 50)
     );
     bot.sendMessage(msg.chat.id, `Code successfully generated and pushed to repo!\nFile: ${fileName}\nCommit: ${commitUrl}`);
  } catch (err) {
     bot.sendMessage(msg.chat.id, `Code Generation Error: ${err.message}`);
  }
});

// --- RAILWAY GRAPHQL & AUTOFIX ---
bot.onText(/\/status/, async (msg) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  if (!process.env.RAILWAY_API_TOKEN) return bot.sendMessage(msg.chat.id, 'RAILWAY_API_TOKEN not set.');
  
  bot.sendMessage(msg.chat.id, 'Checking Railway deployment status...');
  try {
    const query = `
      query {
        projects {
          edges {
            node {
              id
              name
              deployments {
                edges {
                  node {
                    id
                    status
                    createdAt
                  }
                }
              }
            }
          }
        }
      }
    `;
    const res = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RAILWAY_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0].message);
    
    // Quick summarize
    const projects = data.data.projects.edges.map(e => e.node);
    let reply = '🚂 Railway Status:\n';
    for (const p of projects) {
       const latest = p.deployments?.edges?.[0]?.node;
       reply += `- ${p.name}: ${latest ? latest.status : 'No deployments'}\n`;
    }
    bot.sendMessage(msg.chat.id, reply);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Status Error: ${err.message}`);
  }
});

bot.onText(/\/autofix/, async (msg) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  bot.sendMessage(msg.chat.id, 'Pushing automated nixpacks.toml fix...');
  try {
    const nixpacksContent = `
[build]
builder = "npm"

[start]
cmd = "node index.js"
`;
    const commitUrl = await pushFileChange('nixpacks.toml', nixpacksContent, 'AUTONOMOUS: Fix deployment container via nixpacks');
    bot.sendMessage(msg.chat.id, `Fix pushed successfully!\nCommit: ${commitUrl}`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Autofix Error: ${err.message}`);
  }
});

// Trigger Android Native Build via GitHub Actions
bot.onText(/\/build/, async (msg) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  bot.sendMessage(msg.chat.id, 'Triggering Native Android Build (APK) via GitHub Actions...');
  try {
    await octokit.actions.createWorkflowDispatch({
      owner: OWNER,
      repo: REPO,
      workflow_id: 'build_native.yml',
      ref: BRANCH
    });
    bot.sendMessage(msg.chat.id, `Build triggered successfully! The APK will be sent here when it finishes compiling.`);
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Failed to trigger build: ${err.message}. Ensure GitHub Actions are enabled and the workflow exists.`);
  }
});

// Generate CAW DNA Payload
bot.onText(/\/caw (.+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, 'Not authorized.');
  bot.sendMessage(msg.chat.id, `Generating DNA Payload for: ${match[1]}...`);
  
  try {
    const cawPrompt = `You are the BANNON engine DNA generator. Create a JSON DNA payload for a new wrestler named "${match[1]}". 
    Include fields for strength, agility, stamina, charisma, primary_style, signature_move, and visual_hex_colors. 
    Respond ONLY with raw JSON, no formatting or markdown.`;
    
    const result = await model.generateContent(cawPrompt);
    const reply = result.response.text();
    
    bot.sendMessage(msg.chat.id, `🧬 DNA Payload Generated:\n\`\`\`json\n${reply}\n\`\`\``, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(msg.chat.id, `Error generating CAW: ${err.message}`);
  }
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Living Nexus is online. Awaiting directives.');
});

bot.on('message', async (msg) => {
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return; // Ignore slash commands

  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // 1. Store incoming user message to Supabase
  try {
    await supabase.from('chat_history').insert([
      { chat_id: chatId.toString(), user_id: userId.toString(), message: msg.text, role: 'user' }
    ]);
  } catch (err) {
    console.error('Supabase error saving user message:', err.message);
  }

  // 2. Retrieve conversation context
  let historyContext = "";
  try {
    const { data: pastMessages } = await supabase
        .from('chat_history')
        .select('message, role')
        .eq('chat_id', chatId.toString())
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (pastMessages && pastMessages.length > 0) {
        historyContext = "\n\nRecent History:\n" + pastMessages.reverse().map(m => `${m.role}: ${m.message}`).join("\n");
    }
  } catch (err) {
    console.error('Supabase error fetching history:', err.message);
  }

  // 3. Generate response using Gemini
  try {
    const result = await model.generateContent(`${SYSTEM_CONTEXT}${historyContext}\n\nUser: ${msg.text}`);
    const reply = result.response.text();
    
    // 4. Store AI reply to Supabase
    try {
        await supabase.from('chat_history').insert([
          { chat_id: chatId.toString(), user_id: userId.toString(), message: reply, role: 'assistant' }
        ]);
    } catch (err) {
        console.error('Supabase error saving assistant reply:', err.message);
    }

    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('[GEMINI] Error:', err.message);
    bot.sendMessage(chatId, `Error reaching the model: ${err.message}`);
  }
});

// --- RAILWAY WATCHDOG ---
const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';
const { RAILWAY_API_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_SERVICE_ID, RAILWAY_ENVIRONMENT_ID } = process.env;

async function railwayQuery(query, variables) {
  const res = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RAILWAY_API_TOKEN}` },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

async function getLatestDeployment() {
  const query = `query($input: DeploymentListInput!) {
    deployments(first: 1, input: $input) { edges { node { id status createdAt } } }
  }`;
  const data = await railwayQuery(query, {
    input: { projectId: RAILWAY_PROJECT_ID, serviceId: RAILWAY_SERVICE_ID, environmentId: RAILWAY_ENVIRONMENT_ID }
  });
  return data?.data?.deployments?.edges?.[0]?.node;
}

async function getBuildLogs(deploymentId) {
  const query = `query($deploymentId: String!) {
    buildLogs(deploymentId: $deploymentId, limit: 200) { message severity }
  }`;
  const data = await railwayQuery(query, { deploymentId });
  return (data?.data?.buildLogs || []).map(l => l.message).join('\n');
}

async function redeploy() {
  const mutation = `mutation($serviceId: String!, $environmentId: String!) {
    serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId)
  }`;
  return railwayQuery(mutation, { serviceId: RAILWAY_SERVICE_ID, environmentId: RAILWAY_ENVIRONMENT_ID });
}

const KNOWN_FIXES = [
  {
    signature: /providers.*array|malformed \[providers\]|nixpacks\.toml/i,
    filePath: 'nixpacks.toml',
    fix: `providers = ["node"]\n\n[phases.install]\ncmds = ["npm install"]\n\n[start]\ncmd = "node index.js"\n`,
    label: 'nixpacks providers table fix'
  }
];

async function watchdogTick() {
  if (!RAILWAY_API_TOKEN) return;
  try {
    const deployment = await getLatestDeployment();
    if (!deployment || !['FAILED', 'CRASHED'].includes(deployment.status)) return;

    const logs = await getBuildLogs(deployment.id);
    const match = KNOWN_FIXES.find(f => f.signature.test(logs));

    if (match) {
      const commitUrl = await pushFileChange(match.filePath, match.fix, `WATCHDOG: ${match.label}`);
      await redeploy();
      if(ADMIN_ID) bot.sendMessage(ADMIN_ID, `Build ${deployment.status}. Applied: ${match.label}. Pushed: ${commitUrl}. Redeploy triggered.`);
    } else if (ADMIN_ID) {
      bot.sendMessage(ADMIN_ID, `Build ${deployment.status}, no known fix matched:\n${logs.slice(0, 500)}`);
    }
  } catch (error) {
    console.error('Watchdog error:', error);
  }
}

if (RAILWAY_API_TOKEN) {
    setInterval(watchdogTick, 5 * 60 * 1000);
}

app.get('/', (req, res) => res.send('Living Nexus is running.'));

app.get('/build-stats', async (req, res) => {
  if (!process.env.RAILWAY_API_TOKEN) {
    return res.status(500).json({ error: 'RAILWAY_API_TOKEN is not set' });
  }
  
  try {
    const query = `query($input: DeploymentListInput!) {
      deployments(first: 5, input: $input) { edges { node { id status createdAt } } }
    }`;
    const data = await railwayQuery(query, {
      input: { 
        projectId: process.env.RAILWAY_PROJECT_ID, 
        serviceId: process.env.RAILWAY_SERVICE_ID, 
        environmentId: process.env.RAILWAY_ENVIRONMENT_ID 
      }
    });
    
    res.json({
      status: 'ok',
      deployments: data?.data?.deployments?.edges?.map(e => e.node) || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', async (req, res) => {
  let githubStatus = 'untested';
  let githubRepoAccess = false;
  
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
    try {
      const { data } = await octokit.rest.repos.get({
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO
      });
      githubStatus = 'ok';
      githubRepoAccess = true;
    } catch (err) {
      githubStatus = `error: ${err.message}`;
    }
  } else {
    githubStatus = 'missing_env_vars';
  }

  const info = TOKEN ? await bot.getWebHookInfo().catch(() => null) : null;

  res.json({
    status: 'ok',
    uptime_seconds: process.uptime(),
    env_vars_present: {
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
      GITHUB_OWNER: !!process.env.GITHUB_OWNER,
      GITHUB_REPO: !!process.env.GITHUB_REPO,
      RAILWAY_API_TOKEN: !!process.env.RAILWAY_API_TOKEN
    },
    telegram_token_present: !!TOKEN,
    webhook_url: info?.url || null,
    webhook_pending_updates: info?.pending_update_count ?? null,
    gemini_model_initialized: typeof model !== 'undefined',
    github_auth_status: githubStatus,
    github_repo_read_access: githubRepoAccess,
    watchdog_active: !!process.env.RAILWAY_API_TOKEN
  });
});

app.listen(PORT, () => {
  console.log(`[BOOT] HTTP server listening on port ${PORT}`);
  console.log('[BOOT] Telegram bot webhook handler started.');
});
