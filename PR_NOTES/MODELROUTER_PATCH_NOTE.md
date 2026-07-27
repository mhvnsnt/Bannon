*** BEGIN PATCH: godmode/src/server/modelRouter.ts (instrumentation) ***
*** Please review below changes to insert logging calls around provider requests/responses. ***

// In the Anthropic / OpenRouter / local branches where `prompt` is sent and `responseText` computed,
// add calls like:
// await recordUserPrompt(prompt, { provider });
// ... perform request ...
// await recordProviderCall({ provider, model: selectedModel, taskId }, { requestBody }, { responseBody }, timingMs);

// I will now add imports at top of file:
// import { recordProviderCall, recordUserPrompt } from './memory_logger';

*** END PATCH ***
