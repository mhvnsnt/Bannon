import express from 'express';
import { A2AServer, AgentCard, TaskContext } from './a2a-sdk.js';

export function setupA2AServer(app: express.Express) {
  // 1. Define the Agent Card so the swarm knows what this sub-agent does
  const web3AuditorCard: AgentCard = {
    name: "Web3_Contract_Auditor",
    description: "Audits smart contracts for reentrancy and logic vulnerabilities.",
    url: "http://localhost:3000",
    version: "1.0.0",
    skills: [
      {
        id: "solidity_audit",
        name: "Solidity Audit",
        description: "Analyze raw Solidity code for execution flaws."
      }
    ]
  };

  // 2. Initialize the A2A Server
  const a2aServer = new A2AServer({ card: web3AuditorCard });

  // 3. Define the deterministic task execution logic
  a2aServer.onTask('solidity_audit', async (context: TaskContext) => {
    console.log("[A2A SERVER] Received audit task from orchestrator.");
    
    // Extract payload sent by the main swarm
    const contractCode = context.request.params.code;
    
    // Execute isolated logic...
    const auditResult = {
      vulnerable: false,
      confidenceScore: 98.5,
      suggestedFix: null
    };

    // Return the JSON-RPC formatted artifact back to the caller
    context.respond(auditResult);
  });

  // 4. Expose the well-known discovery route
  app.get('/.well-known/agent.json', (req, res) => {
    res.json(web3AuditorCard);
  });

  // 5. Expose the JSON-RPC execution route
  app.post('/a2a/rpc', (req, res) => {
    a2aServer.handleRequest(req, res);
  });
  
  console.log("[A2A SUB-AGENT] Web3 Auditor endpoints mounted.");
}
