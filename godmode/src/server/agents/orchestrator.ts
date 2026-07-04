import { quantAgentAssess } from './quantAgent';
import { behavioralAgentAssess } from './behavioralAgent';
import { executeArbitrageAutopsy } from '../RSI/rsiEngine';

export async function masterAgentOrchestrator(dataContext: any) {
    console.log("[ORCHESTRATOR]: Dispatching data to specialized agents...");
    
    if (dataContext.type === 'market_data') {
        await quantAgentAssess(dataContext.payload);
    } else if (dataContext.type === 'academic_data') {
        await behavioralAgentAssess(dataContext.payload);
    }
}
