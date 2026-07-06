import { A2AClient } from './a2a-sdk.js';

export class A2ADiscoveryClient {
  /**
   * Autonomously discovers a remote agent and delegates a task.
   */
  static async delegateTask(targetUrl: string, skillId: string, payload: any) {
    console.log(`[A2A CLIENT] Initiating discovery protocol at ${targetUrl}...`);
    
    try {
      // 1. Discovery: Fetch the Agent Card from the well-known URL
      const discoveryResponse = await fetch(`${targetUrl}/.well-known/agent.json`);
      const agentCard = await discoveryResponse.json();
      
      console.log(`[A2A CLIENT] Discovered agent: ${agentCard.name}`);
      
      // 2. Verification: Ensure the remote agent actually supports the required skill
      const hasSkill = agentCard.skills.some((skill: any) => skill.id === skillId);
      if (!hasSkill) {
        throw new Error(`[A2A FAULT] Remote agent lacks skill: ${skillId}`);
      }

      // 3. Execution: Establish connection and send JSON-RPC 2.0 payload
      const client = new A2AClient(agentCard.url);
      console.log(`[A2A CLIENT] Delegating task [${skillId}]...`);
      
      const result = await client.sendTask(skillId, payload);
      
      console.log("[A2A CLIENT] Task completed. Artifact extracted.");
      return result;

    } catch (error: any) {
      console.error("[A2A CLIENT EXCEPTION]", error.message);
      return null;
    }
  }
}
