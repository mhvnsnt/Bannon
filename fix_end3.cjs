const fs = require('fs');
let content = fs.readFileSync('src/components/AgentView.tsx', 'utf8');

const regex = /\{\/\* 5\. Task History Section \*\/\}[\s\S]*\}\);/g;

const replacement = `{/* 5. Task History Section */}
            <TaskHistoryDrawer history={taskHistory} onRetry={(id) => console.log('retry', id)} />
          </div>
          )}
        </div>
        </motion.div>
      )}
      {isStreamOpen && <RealTimeAgentLog sessionId={sessionId} onClose={() => setIsStreamOpen(false)} />}
      </div>
      <AgentResourceMonitor />
      <AgentToolsModal isOpen={showAgentTools} onClose={() => setShowAgentTools(false)} userId="local-user-id" />
      <DeployModal isOpen={!!deployUrl} onClose={() => setDeployUrl(null)} deployUrl={deployUrl} />
      
      {shareNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{shareNotification}</span>
        </div>
      )}
    </div>
  );
}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/AgentView.tsx', content);
