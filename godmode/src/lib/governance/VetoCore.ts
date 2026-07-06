// Strict purity contract
// Zero IO. Zero network calls. Zero LLM inference.
import { ActionRequest, VetoDecision, VetoType, CognitiveLock } from "../../types/GovernanceTypes.js";

export class VetoCore {
  static evaluateProposal(request: ActionRequest, locks: CognitiveLock[]): VetoDecision {
    const violatesVelocity = request.payload?.velocity > 3.8;
    const targetsBlacklistedKey = request.payload?.target === "CDP_PRIVATE_KEY";

    if (violatesVelocity || targetsBlacklistedKey) {
      return { status: VetoType.HARD_BLOCK, reason: "Strict boundary violation detected" };
    }

    // Keep original limits as cognitive locks examples
    const MAX_ALLOWED_ETH = 2.0;
    const MAX_SLIPPAGE = 0.05;

    if (request.type === 'CRYPTO_SWAP') {
      if (request.payload.amountEth > MAX_ALLOWED_ETH) {
        return { status: VetoType.HARD_BLOCK, reason: `Transaction amount exceeds hard limit (${MAX_ALLOWED_ETH} ETH)` };
      }
      if (request.payload.slippage > MAX_SLIPPAGE) {
         return { status: VetoType.HARD_BLOCK, reason: `Slippage exceeds hard limit (${MAX_SLIPPAGE})` };
      }
    }

    // Protected core files cannot be modified speculatively or without manual high privilege
    const PROTECTED_FILES = ['server.ts', '.env', 'package.json'];
    if (request.type === 'FILE_EDIT') {
      const filePath = request.payload.filePath || '';
      for (const protectedFile of PROTECTED_FILES) {
        if (filePath.includes(protectedFile)) {
          return { status: VetoType.HARD_BLOCK, reason: `Attempt to edit protected core boundary file: ${filePath}` };
        }
      }
    }

    return { status: VetoType.APPROVED, reason: "Clear" };
  }
}
