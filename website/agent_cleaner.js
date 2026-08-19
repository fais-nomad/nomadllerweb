const fs = require('fs');
let code = fs.readFileSync('/Users/nomadller/Desktop/nomadllerweb/src/dashboard.js', 'utf8');

// We only need from line 1 (Supabase init) and the costing logic
const initBlock = code.match(/const SUPABASE_URL.*?\nconst supabase = createClient\(SUPABASE_URL, SUPABASE_KEY\);/s)[0];
const ratesBlock = code.match(/window\.liveRates.*?\nasync function fetchExchangeRates\(\).*?\nfetchExchangeRates\(\);/s)[0];
const costingBlock = code.match(/\/\/ --- COSTING CALCULATOR LOGIC ---.*?document\.getElementById\('calc-hotel-room-type'\)\?\.addEventListener\('change', calculateCostingTotal\);/s)[0];

let agentCode = `
const { createClient } = supabase;
${initBlock}
${ratesBlock}

window.showSelectTrek = () => {
    document.getElementById('section-costing-calculator').style.display = 'none';
    document.getElementById('section-select-trek').style.display = 'block';
};

${costingBlock}

document.addEventListener('DOMContentLoaded', () => {
    loadCostingTreks();
});
`;

// Now let's fix the crashes by replacing `document.getElementById('...').textContent = ` with `const elX = document.getElementById('...'); if (elX) elX.textContent = `
agentCode = agentCode.replace(/document\.getElementById\('calc-guide-cost-display'\)\.textContent =/g, "const gcd = document.getElementById('calc-guide-cost-display'); if(gcd) gcd.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('calc-porter-cost-display'\)\.textContent =/g, "const pcd = document.getElementById('calc-porter-cost-display'); if(pcd) pcd.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('calc-permits-cost-display'\)\.innerHTML =/g, "const pmd = document.getElementById('calc-permits-cost-display'); if(pmd) pmd.innerHTML =");
agentCode = agentCode.replace(/document\.getElementById\('calc-food-cost-display'\)\.innerHTML =/g, "const fmd = document.getElementById('calc-food-cost-display'); if(fmd) fmd.innerHTML =");
agentCode = agentCode.replace(/document\.getElementById\('calc-food-cost-display'\)\.textContent =/g, "const fcd = document.getElementById('calc-food-cost-display'); if(fcd) fcd.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('calc-flight-details'\)\.innerHTML =/g, "const fld = document.getElementById('calc-flight-details'); if(fld) fld.innerHTML =");
agentCode = agentCode.replace(/document\.getElementById\('calc-flight-cost-display'\)\.textContent =/g, "const flc = document.getElementById('calc-flight-cost-display'); if(flc) flc.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('calc-transfers-cost-display'\)\.textContent =/g, "const tcd = document.getElementById('calc-transfers-cost-display'); if(tcd) tcd.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('calc-hotel-details'\)\.innerHTML =/g, "const hd = document.getElementById('calc-hotel-details'); if(hd) hd.innerHTML =");
agentCode = agentCode.replace(/document\.getElementById\('calc-hotel-details'\)\.textContent =/g, "const htc = document.getElementById('calc-hotel-details'); if(htc) htc.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('calc-hotel-cost-display'\)\.textContent =/g, "const hcd = document.getElementById('calc-hotel-cost-display'); if(hcd) hcd.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('calc-total-cost'\)\.textContent =/g, "const tct = document.getElementById('calc-total-cost'); if(tct) tct.textContent =");
agentCode = agentCode.replace(/document\.getElementById\('costing-detail-view'\)\.style\.display = 'none';/g, "");
agentCode = agentCode.replace(/document\.getElementById\('costing-master-view'\)\.style\.display = 'block';/g, "");
agentCode = agentCode.replace(/document\.getElementById\('costing-master-view'\)\.style\.display = 'none';/g, "document.getElementById('section-select-trek').style.display = 'none';");
agentCode = agentCode.replace(/document\.getElementById\('costing-detail-view'\)\.style\.display = 'block';/g, "document.getElementById('section-costing-calculator').style.display = 'block';");
agentCode = agentCode.replace(/document\.getElementById\('costing-trek-title'\)\.textContent = `\$\{trek\.name\} Calculator`;/g, "document.getElementById('calc-trek-title').textContent = trek.name;");

// Apply the +8000 markup logic
agentCode = agentCode.replace(/const totalStr = `NPR \$\{total\.toLocaleString\(\)\}`;/, `
    // --- APPLY AGENT MARKUP ---
    const perPersonMarkup = 8000;
    const totalMarkup = perPersonMarkup * pax;
    total += totalMarkup;
    
    const totalStr = \`NPR \$\{total.toLocaleString()\}\`;
`);

fs.writeFileSync('/Users/nomadller/Desktop/nomadllerweb/src/agent.js', agentCode);
console.log('Successfully created clean agent.js');
