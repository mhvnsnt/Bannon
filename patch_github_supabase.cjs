const fs = require('fs');
let file = 'src/components/AgentView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert the Supabase PAT fetcher on mount
const mountHook = `useEffect(() => {`;
const fetchPATCode = `
  useEffect(() => {
    const fetchGitHubToken = async () => {
      const storedLocalToken = localStorage.getItem('codedummy-github-token');
      if (storedLocalToken) {
        setGithubToken(storedLocalToken);
      }
      
      const userId = localStorage.getItem('codedummy-user-id');
      if (userId && isSupabaseConfigured) {
        const { data } = await supabase.from('user_profiles').select('github_pat').eq('id', userId).single();
        if (data?.github_pat) {
          setGithubToken(data.github_pat);
          localStorage.setItem('codedummy-github-token', data.github_pat);
        }
      }
    };
    fetchGitHubToken();
  }, []);
`;
content = content.replace("const [githubToken, setGithubToken] = useState('');", "const [githubToken, setGithubToken] = useState('');\n" + fetchPATCode);

fs.writeFileSync(file, content);

file = 'src/components/GitHubActions.tsx';
content = fs.readFileSync(file, 'utf8');

const oldMessageHook = `  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setGithubToken(event.data.token);
        localStorage.setItem('codedummy-github-token', event.data.token);
        alert('GitHub Account linked successfully!');
      }
    };`;

const newMessageHook = `  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        setGithubToken(event.data.token);
        localStorage.setItem('codedummy-github-token', event.data.token);
        
        // Save to Supabase
        const { supabase, isSupabaseConfigured } = await import('../services/supabaseClient');
        if (isSupabaseConfigured) {
            const userId = localStorage.getItem('codedummy-user-id');
            if (userId) {
                await supabase.from('user_profiles').upsert({ id: userId, github_pat: event.data.token });
            }
        }
        alert('GitHub Account linked successfully!');
      }
    };`;
content = content.replace(oldMessageHook, newMessageHook);

// Also add a login with github button, standard supabase oauth
const oldConnectBtn = `              <button
                onClick={handleGithubOAuth}
                className="flex-1 lg:flex-none bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
              >
                Connect GitHub
              </button>`;

const newConnectBtn = `              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={handleGithubOAuth}
                  className="flex-1 lg:flex-none bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                  title="Connect via App OAuth"
                >
                  <Key className="w-3.5 h-3.5" />
                  Connect
                </button>
                <button
                  onClick={async () => {
                    const { supabase, isSupabaseConfigured } = await import('../services/supabaseClient');
                    if (isSupabaseConfigured) {
                      await supabase.auth.signInWithOAuth({ provider: 'github' });
                    } else {
                      alert('Supabase not configured yet for this MVP.');
                    }
                  }}
                  className="flex-1 lg:flex-none bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
                  title="Sign In with GitHub"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Sign In
                </button>
              </div>`;
content = content.replace(oldConnectBtn, newConnectBtn);

fs.writeFileSync(file, content);
console.log("Patched React components!");
