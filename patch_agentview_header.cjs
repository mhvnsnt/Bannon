const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// Make the header scrollable on mobile if it gets too tall
content = content.replace(
    '<header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 border-b border-black/5 shrink-0 bg-white/80 backdrop-blur-md z-10 shadow-sm">',
    '<header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 border-b border-black/5 shrink-0 bg-white/80 backdrop-blur-md z-10 shadow-sm max-h-[50vh] overflow-y-auto lg:overflow-visible lg:max-h-none">'
);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched header to be scrollable on mobile");
