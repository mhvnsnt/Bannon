const fs = require('fs');
let code = fs.readFileSync('src/components/ProjectSelection.tsx', 'utf8');

// Add import for Fork icon
code = code.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, GitFork } from 'lucide-react';");

// Add state for forked projects
const stateInjection = `
  const [forkedProjects, setForkedProjects] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('codedummy-forked-projects') || '[]');
    } catch {
      return [];
    }
  });

  const handleFork = (project: any) => {
    const newFork = {
      ...project,
      id: \`\${project.id}-fork-\${Date.now()}\`,
      name: \`\${project.name} (Forked)\`,
      isFork: true
    };
    const newForks = [...forkedProjects, newFork];
    setForkedProjects(newForks);
    localStorage.setItem('codedummy-forked-projects', JSON.stringify(newForks));
    handleProjectClick(newFork.id, true);
  };
`;
code = code.replace(/const \[shareCopied, setShareCopied\] = useState\(false\);/, "const [shareCopied, setShareCopied] = useState(false);\n" + stateInjection);

// Add button to Share card
const forkButtonStr = `
                <button
                  onClick={() => handleFork(activeProjectDef)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-colors cursor-pointer mt-2"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  FORK PROJECT
                </button>
`;
code = code.replace(/(<button[\s\S]*?COPY LINK TO SHARE[\s\S]*?<\/button>)/, "$1\n" + forkButtonStr);

// Render forked projects alongside CAPSTONE_PROJECTS
code = code.replace(/\{CAPSTONE_PROJECTS\.map\(\(project\) => \{/, "{[...CAPSTONE_PROJECTS, ...forkedProjects].map((project) => {");

// We need activeProjectDef to also look in forked projects
code = code.replace(/const activeProjectDef = CAPSTONE_PROJECTS\.find\(p => p\.id === activeProjectId\);/, "const activeProjectDef = [...CAPSTONE_PROJECTS, ...forkedProjects].find(p => p.id === activeProjectId);");

fs.writeFileSync('src/components/ProjectSelection.tsx', code);
console.log("Patched ProjectSelection.tsx");
