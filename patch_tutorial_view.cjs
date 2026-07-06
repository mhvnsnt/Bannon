const fs = require('fs');
let content = fs.readFileSync('src/components/TutorialView.tsx', 'utf-8');

// Replace onChange={(e) => setCode(e.target.value)} with something that dispatches
const findChange = "onChange={(e) => setCode(e.target.value)}";
const replaceChange = `onChange={(e) => {
                      setCode(e.target.value);
                      window.dispatchEvent(new CustomEvent('editor-code-changed', { detail: { code: e.target.value } }));
                    }}`;

content = content.replace(findChange, replaceChange);
fs.writeFileSync('src/components/TutorialView.tsx', content);
