const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

const regex = /\{\/\*\s*5\.\s*Task History Section\s*\*\/\}\s*<TaskHistoryDrawer[^\>]*\/>\s*<\/div>\s*\)\}\s*<\/motion\.div>\s*\)\}\s*\{isStreamOpen/g;

const replacement = `{/* 5. Task History Section */}
            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
          </div>
          )}
        </div>
        </motion.div>
      )}
      {isStreamOpen`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/AgentView.tsx', content);
