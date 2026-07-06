const fs = require('fs');
let content = fs.readFileSync('src/components/GitHubActions.tsx', 'utf8');

// Add import
content = content.replace(
  "import PRPreviewModal from './PRPreviewModal';",
  "import PRPreviewModal from './PRPreviewModal';\nimport { IntegrationsModal } from './IntegrationsModal';"
);

// Replace state
content = content.replace(
  /const \[showRailwayModal, setShowRailwayModal\] = useState\(false\);\n  const \[showSupabaseModal, setShowSupabaseModal\] = useState\(false\);\n  const \[railwayToken, setRailwayToken\] = useState\(localStorage.getItem\('railway_token'\) \|\| ''\);\n  const \[supabaseUrl, setSupabaseUrl\] = useState\(localStorage.getItem\('supabase_url'\) \|\| ''\);\n  const \[supabaseKey, setSupabaseKey\] = useState\(localStorage.getItem\('supabase_key'\) \|\| ''\);/,
  "const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);"
);

// Replace button clicks
content = content.replace(
  /onClick=\{\(\) => setShowSupabaseModal\(true\)\}/,
  "onClick={() => setShowIntegrationsModal(true)}"
);

content = content.replace(
  /onClick=\{\(\) => setShowRailwayModal\(true\)\}/,
  "onClick={() => setShowIntegrationsModal(true)}"
);

// We have 2 buttons calling setShowIntegrationsModal now. We can leave them as is, or remove one. 
// Leaving them is fine, they both open the same modal.

// Inject the modal before PRPreviewModal
content = content.replace(
  "<PRPreviewModal",
  "<IntegrationsModal isOpen={showIntegrationsModal} onClose={() => setShowIntegrationsModal(false)} />\n      <PRPreviewModal"
);

fs.writeFileSync('src/components/GitHubActions.tsx', content);
console.log("Patched GitHubActions.tsx");
