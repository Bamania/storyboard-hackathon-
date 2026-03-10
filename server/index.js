/**
 * JavaScript entry point — loads the compiled TypeScript server.
 * Run: nodemon index.js
 */
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, 'dist', 'index.js');
await import(pathToFileURL(distPath).href);
