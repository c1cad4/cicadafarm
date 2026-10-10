import { WebWorkerMLCEngineHandler } from 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.85/lib/index.js';
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = event => handler.onmessage(event);
