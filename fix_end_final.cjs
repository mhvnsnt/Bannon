const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

const lastPart = `            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
        </div>
        )}
        </motion.div>
      )}
      {isStreamOpen`;

const replacementPart = `            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
          </div>
          )}
        </div>
        </motion.div>
      )}
      {isStreamOpen`;

content = content.replace(lastPart, replacementPart);
fs.writeFileSync('src/components/AgentView.tsx', content);
