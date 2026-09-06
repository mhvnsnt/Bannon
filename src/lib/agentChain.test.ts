import { AutonomousChainingAgent } from './agentChain.ts';

async function runTests() {
    console.log("Starting Autonomous Chaining Agent Tests...");
    const agent = new AutonomousChainingAgent({ anchorLines: 3 });

    let calls = 0;
    const mockGeneratorFn = async (prompt: string) => {
        calls++;
        if (calls === 1) {
            console.log("First pass triggered...");
            return {
                output: `Line 1
Line 2
Line 3
Line 4
Line 5`,
                reason: 'MAX_TOKENS'
            };
        } else {
            console.log("Second pass triggered with prompt:\n", prompt);
            return {
                output: `Line 6
Line 7
Line 8`,
                reason: 'STOP'
            };
        }
    };

    let writtenOutput = "";
    const mockWriter = async (content: string) => {
        writtenOutput += content + "\n";
    };

    try {
        await agent.executeExtractionLoop('test_module.cpp', "Initial Prompt", mockGeneratorFn, mockWriter);
        console.log("Extraction complete.");
        console.log("Total calls:", calls);
        console.log("Final written output:\n" + writtenOutput);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

runTests().catch(console.error);
