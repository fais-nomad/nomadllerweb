try {
    const fs = require('fs');
    const content = fs.readFileSync('src/dashboard.js', 'utf8');
    const esprima = require('esprima');
    esprima.parseScript(content);
    console.log("No syntax errors");
} catch (e) {
    console.log("Syntax error:");
    console.log(e);
}
