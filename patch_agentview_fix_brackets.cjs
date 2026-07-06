const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

// I'll just find the exact block and replace it manually to be safe.
const target = `            {/* 5. Task History Section */}
            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
        </div>
        )}
        </motion.div>
      )}
      {isStreamOpen && <RealTimeAgentLog sessionId={sessionId} onClose={() => setIsStreamOpen(false)} />}
      </div>`;

const fixed = `            {/* 5. Task History Section */}
            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
          </div>
          )}
        </div>
        </motion.div>
      )}
      {isStreamOpen && <RealTimeAgentLog sessionId={sessionId} onClose={() => setIsStreamOpen(false)} />}
      </div>`;

content = content.replace(target, fixed);
fs.writeFileSync('src/components/AgentView.tsx', content);
console.log("Fixed brackets");
