export class InferenceFirewall {
  static sanitizeContext(rawContent: string): string {
    console.log("[InferenceFirewall] Scanning scraped web data for adversarial prompt injections...");
    let sanitized = rawContent;

    // 1. Strip basic system prompt override attempts
    const adversarialPatterns = [
      /ignore all previous instructions/gi,
      /you are now a/gi,
      /forget what you were told/gi,
      /system override/gi,
      /disregard system prompt/gi,
      /bypass safety/gi
    ];

    let foundThreats = 0;
    for (const pattern of adversarialPatterns) {
      if (pattern.test(sanitized)) {
        foundThreats++;
        sanitized = sanitized.replace(pattern, "[MALICIOUS_INSTRUCTION_REDACTED]");
      }
    }

    // 2. Filter malicious JSON/code payload attempts
    const scriptInjection = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    if (scriptInjection.test(sanitized)) {
      foundThreats++;
      sanitized = sanitized.replace(scriptInjection, "[SCRIPT_INJECTION_REMOVED]");
    }

    if (foundThreats > 0) {
      console.warn(`[InferenceFirewall] Blocked ${foundThreats} adversarial injection attempt(s) from entering the Quantum Chat Brain context window.`);
    }

    return sanitized;
  }
}
