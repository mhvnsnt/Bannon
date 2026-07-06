const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

const targetLine = "const [isHistoryOpen, setIsHistoryOpen] = useState(true);";
if (content.includes(targetLine)) {
    content = content.replace(
        targetLine,
        targetLine + "\n  const [showAgentTools, setShowAgentTools] = useState(false);\n  const [showMistakes, setShowMistakes] = useState(false);"
    );
}

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Patched AgentView with missing states");
