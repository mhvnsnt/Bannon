const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

const target = `            {/* 5. Task History Section */}
            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
        </div>
        )}
        </motion.div>
      )}
      {isStreamOpen && <RealTimeAgentLog sessionId={sessionId} onClose={() => setIsStreamOpen(false)} />}
      </div>
      <AgentResourceMonitor />`;

const replacement = `            {/* 5. Task History Section */}
            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
          </div>
          )}
        </div>
        </motion.div>
      )}
      {isStreamOpen && <RealTimeAgentLog sessionId={sessionId} onClose={() => setIsStreamOpen(false)} />}
      </div>
      <AgentResourceMonitor />`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/AgentView.tsx', content);
