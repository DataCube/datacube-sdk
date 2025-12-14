const fs = require('fs');
const code = fs.readFileSync('dist/index.js', 'utf8');
// Remove ESM imports and createRequire
let cjs = code.replace(/import { createRequire } from 'module';[\r\n]+const require = createRequire\(import\.meta\.url\);[\r\n]+/, '');
// Remove export keywords
cjs = cjs.replace(/export /g, '');
// replace ESM 
cjs = cjs.replace(/\(ESM\)/g, '(CJS)');
// Add module.exports
cjs += '\nmodule.exports = { DataCubeClient, DataCubeError };';
fs.writeFileSync('dist/index.cjs', cjs);