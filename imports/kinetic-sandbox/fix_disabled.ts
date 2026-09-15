import fs from 'fs';
const file = 'src/components/ControlsPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/isProcessing \|\| active/g, "isProcessing");

fs.writeFileSync(file, content);
console.log('Fixed disabled state!');
