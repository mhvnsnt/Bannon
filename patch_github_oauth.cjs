const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

// We will add the OAuth endpoints before the Vite middleware setup.
// Find the Vite middleware setup:
const viteMarker = "if (process.env.NODE_ENV !== 'production')";

const oauthRoutes = `
// --- GitHub OAuth Integration ---
app.get('/api/auth/github/url', (req, res) => {
  const redirectUri = \`\${req.protocol}://\${req.get('host')}/auth/github/callback\`;
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: 'repo user',
    state: Math.random().toString(36).substring(7)
  });
  const authUrl = \`https://github.com/login/oauth/authorize?\${params.toString()}\`;
  res.json({ url: authUrl });
});

app.get(['/auth/github/callback', '/auth/github/callback/'], async (req, res) => {
  const { code } = req.query;
  const redirectUri = \`\${req.protocol}://\${req.get('host')}/auth/github/callback\`;
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri
      })
    });
    const data = await response.json();
    const token = data.access_token;
    
    // Store token securely or return it to the frontend via postMessage
    res.send(\`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '\${token}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>GitHub Authentication successful! This window should close automatically.</p>
        </body>
      </html>
    \`);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.status(500).send('Authentication failed.');
  }
});

`;

content = content.replace(viteMarker, oauthRoutes + viteMarker);

fs.writeFileSync(file, content);
console.log("Patched server.ts with GitHub OAuth routes!");
