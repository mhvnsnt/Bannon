const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// Replace the extra </div>
content = content.replace(`            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
          </div>
        </div>
        </motion.div>`, `            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
        </div>
        </motion.div>`);

fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Fixed mismatched div in AgentView.tsx");
