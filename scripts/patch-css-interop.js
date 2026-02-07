const fs = require('fs');
const path = require('path');

const targetPath = path.join(
  process.cwd(),
  'node_modules',
  'react-native-css-interop',
  'dist',
  'runtime',
  'native',
  'render-component.js'
);

const originalSnippet = `function stringify(object) {
    const seen = new WeakSet();
    return JSON.stringify(object, function replace(_, value) {
        if (!(value !== null && typeof value === "object")) {
            return value;
        }
        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);
        const newValue = Array.isArray(value) ? [] : {};
        for (const entry of Object.entries(value)) {
            newValue[entry[0]] = replace(entry[0], entry[1]);
        }
        seen.delete(value);
        return newValue;
    }, 2);
}`;

const patchedSnippet = `function stringify(object) {
    const seen = new WeakSet();
    function safeClone(value) {
        if (!(value !== null && typeof value === "object")) {
            return value;
        }
        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);
        const nextValue = Array.isArray(value) ? [] : {};
        for (const key of Object.keys(value)) {
            try {
                nextValue[key] = safeClone(value[key]);
            }
            catch (error) {
                const message = error && typeof error.message === "string"
                    ? error.message
                    : "unknown getter error";
                nextValue[key] = "[Inaccessible: " + message + "]";
            }
        }
        seen.delete(value);
        return nextValue;
    }
    return JSON.stringify(safeClone(object), null, 2);
}`;

function run() {
  if (!fs.existsSync(targetPath)) {
    console.warn('[patch-css-interop] target file not found, skipping');
    return;
  }

  const source = fs.readFileSync(targetPath, 'utf8');

  if (source.includes(patchedSnippet)) {
    console.log('[patch-css-interop] already patched');
    return;
  }

  if (!source.includes(originalSnippet)) {
    console.warn('[patch-css-interop] expected source block not found, skipping');
    return;
  }

  const updated = source.replace(originalSnippet, patchedSnippet);
  fs.writeFileSync(targetPath, updated, 'utf8');
  console.log('[patch-css-interop] patch applied');
}

run();
