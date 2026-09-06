import { TranslationService } from './bbTranslationService.ts';

async function runTests() {
    console.log("Starting BB AST Parser Tests...");
    const service = new TranslationService();

    const mockBB = `
; Legacy BB Schema
Type Wrestler
    Field id
    Field hp
    Field name
End Type

Global Dim rosterStatus(100)

Function CheckStatus()
    ; do something
End Function
`;

    console.log("\n--- Testing Meta Domain (Career.bb) ---");
    const metaResult = await service.digestModule('Career.bb', mockBB);
    if (metaResult.success) {
        console.log("SUCCESS:");
        console.log(metaResult.output);
    } else {
        console.error("FAILED:", metaResult.error);
    }

    console.log("\n--- Testing Physics Domain (Attacks.bb) ---");
    const physicsResult = await service.digestModule('Attacks.bb', mockBB);
    if (physicsResult.success) {
        console.log("SUCCESS:");
        console.log(physicsResult.output);
    } else {
        console.error("FAILED:", physicsResult.error);
    }
}

runTests().catch(console.error);
