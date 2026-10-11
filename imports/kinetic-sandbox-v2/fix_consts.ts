import fs from 'fs';
const file = 'src/components/ControlsPanel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const ([a-zA-Z0-9_]+) = \1;/g, "const $1 = usePhysicsStore(s => s.$1);");

fs.writeFileSync(file, content);
console.log('Fixed consts!');
