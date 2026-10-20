// CONFIGURAÇÕES E ESTADO DO JOGO
let game = {
    aura: 0,
    totalAuraEarned: 0,
    
    clickLevel: 1,
    clickPower: 1,
    clickPrice: 15,
    
    auto1: 0,
    auto1Price: 100,
    auto1Power: 1,

    auto2: 0,
    auto2Price: 1100,
    auto2Power: 8,

    auto3: 0,
    auto3Price: 12000,
    auto3Power: 60,

    auto4: 0,
    auto4Price: 130000,
    auto4Power: 450,

    // Loja Secreta
    secret1: 0,
    secret1Price: 75000,
    secret2: 0,
    secret2Price: 500000,
    secret3: 0,
    secret3Price: 4000000,

    rebirths: 0,
    rebirthCost: 1000000,

    // Roleta
    paidSpinCost: 500,
    isSpinning: false,
    currentRotation: 0,

    // Sistema Administrador (Cheats)
    isAdmin: false,
    infiniteAuraActive: false,
    megaMultiplierActive: false
};

const ranks = [
    { limit: 0, name: "Desperto 🌌" },
    { limit: 1000, name: "Espírito Iluminado 🔮" },
    { limit: 15000, name: "Mestre Elemental ⚡" },
    { limit: 100000, name: "Entidade Mística 🌀" },
    { limit: 1000000, name: "Soberano da Aura ✨" },
    { limit: 50000000, name: "Deidade Absoluta 👑" }
];

// Elementos do DOM
const auraDisplay = document.getElementById('auraDisplay');
const apsDisplay = document.getElementById('apsDisplay');
const rankDisplay = document.getElementById('rankDisplay');
const clickBtn = document.getElementById('clickBtn');

const tabNormal = document.getElementById('tabNormal');
const tabRoulette = document.getElementById('tabRoulette');
const tabSecret = document.getElementById('tabSecret');
const shopNormalContent = document.getElementById('shopNormalContent');
const shopRouletteContent = document.getElementById('shopRouletteContent');
const shopSecretContent = document.getElementById('shopSecretContent');

const upClick = document.getElementById('upClick');
const clickEffect = document.getElementById('clickEffect');
const clickPrice = document.getElementById('clickPrice');
const upAuto1 = document.getElementById('upAuto1');
const auto1Effect = document.getElementById('auto1Effect');
const auto1Price = document.getElementById('auto1Price');
const upAuto2 = document.getElementById('upAuto2');
const auto2Effect = document.getElementById('auto2Effect');
const auto2Price = document.getElementById('auto2Price');
const upAuto3 = document.getElementById('upAuto3');
const auto3Effect = document.getElementById('auto3Effect');
const auto3Price = document.getElementById('auto3Price');
const upAuto4 = document.getElementById('upAuto4');
const auto4Effect = document.getElementById('auto4Effect');
const auto4Price = document.getElementById('auto4Price');

const upSecret1 = document.getElementById('upSecret1');
const secret1Effect = document.getElementById('secret1Effect');
const secret1Price = document.getElementById('secret1Price');
const upSecret2 = document.getElementById('upSecret2');
const secret2Effect = document.getElementById('secret2Effect');
const secret2Price = document.getElementById('secret2Price');
const upSecret3 = document.getElementById('upSecret3');
const secret3Effect = document.getElementById('secret3Effect');
const secret3Price = document.getElementById('secret3Price');

const wheel = document.getElementById('wheel');
const wheelText = document.getElementById('wheelText');
const spinPaidBtn = document.getElementById('spinPaidBtn');
const paidCostText = document.getElementById('paidCostText');
const rouletteResult = document.getElementById('rouletteResult');

const rebirthBtn = document.getElementById('rebirthBtn');
const rebirthDisplay = document.getElementById('rebirthDisplay');

// DOM dos Cheats ADM
const adminCodeInput = document.getElementById('adminCodeInput');
const adminAuthBtn = document.getElementById('adminAuthBtn');
const adminPanel = document.getElementById('adminPanel');
const btnInfAura = document.getElementById('btnInfAura');
const btnGiveMillion = document.getElementById('btnGiveMillion');
const btnMegaMultiplier = document.getElementById('btnMegaMultiplier');
const btnClearSave = document.getElementById('btnClearSave');

// PROCESSO DE NAVEGAÇÃO DE ABAS
function switchTab(activeTab, activeContent) {
    [tabNormal, tabRoulette, tabSecret].forEach(t => t.classList.remove('active'));
    [shopNormalContent, shopRouletteContent, shopSecretContent].forEach(c => c.classList.remove('active'));
    activeTab.classList.add('active');
    activeContent.classList.add('active');
}
tabNormal.addEventListener('click', () => switchTab(tabNormal, shopNormalContent));
tabRoulette.addEventListener('click', () => switchTab(tabRoulette, shopRouletteContent));
tabSecret.addEventListener('click', () => switchTab(tabSecret, shopSecretContent));

// CÁLCULOS DO FLUXO DO JOGO
function getMultiplier() {
    return game.megaMultiplierActive ? 999 : (1 + game.rebirths);
}

function getAuraPerSecond() {
    let baseAPS = (game.auto1 * game.auto1Power) + (game.auto2 * game.auto2Power) + (game.auto3 * game.auto3Power) + (game.auto4 * game.auto4Power);
    baseAPS += (game.secret2 * 5000);
    let totalAPS = baseAPS * getMultiplier();
    if (game.secret3 > 0) totalAPS = totalAPS * Math.pow(2, game.secret3);
    return totalAPS;
}

function getClickPower() {
    let secretClickMultiplier = 1 + (game.secret1 * 5);
    return game.clickPower * getMultiplier() * secretClickMultiplier;
}

// VALIDAÇÃO E ATIVAÇÃO DO CÓDIGO ADMINISTRADOR
adminAuthBtn.addEventListener('click', () => {
    if (adminCodeInput.value === "JFC_aura2026") {
        game.isAdmin = true;
        adminPanel.style.display = "block";
        rouletteResult.innerText = "Sessão de Administrador ativada com sucesso! 💎";
        adminCodeInput.value = "";
    } else {
        alert("Chave mestra incorreta ou inválida!");
    }
});

// EVENTOS DE COMANDO DO PAINEL ADM
btnInfAura.addEventListener('click', () => {
    game.infiniteAuraActive = !game.infiniteAuraActive;
    if (game.infiniteAuraActive) {
        btnInfAura.classList.add('active');
        btnInfAura.innerText = "Aura Infinita: ATIVADO";
    } else {
        btnInfAura.classList.remove('active');
        btnInfAura.innerText = "Aura Infinita: DESATIVADO";
    }
});

btnGiveMillion.addEventListener('click', () => {
    game.aura += 1000000;
    game.totalAuraEarned += 1000000;
    updateUI();
});

btnMegaMultiplier.addEventListener('click', () => {
    game.megaMultiplierActive = !game.megaMultiplierActive;
    if (game.megaMultiplierActive) {
        btnMegaMultiplier.classList.add('active');
        btnMegaMultiplier.innerText = "Multiplicador x999: ATIVADO";
    } else {
        btnMegaMultiplier.classList.remove('active');
        btnMegaMultiplier.innerText = "Multiplicador x999: DESATIVADO";
    }
    updateUI();
});

btnClearSave.addEventListener('click', () => {
    game.aura = 0; game.totalAuraEarned = 0; game.clickLevel = 1; game.clickPower = 1; game.clickPrice = 15;
    game.auto1 = 0; game.auto1Price = 100; game.auto2 = 0; game.auto2Price = 1100;
    game.auto3 = 0; game.auto3Price = 12000; game.auto4 = 0; game.auto4Price = 130000;
    game.secret1 = 0; game.secret1Price = 75000; game.secret2 = 0; game.secret2Price = 500000;
    game.secret3 = 0; game.secret3Price = 4000000; game.rebirths = 0;
    game.infiniteAuraActive = false; game.megaMultiplierActive = false;
    btnInfAura.classList.remove('active'); btnInfAura.innerText = "Aura Infinita: DESATIVADO";
    btnMegaMultiplier.classList.remove('active'); btnMegaMultiplier.innerText = "Multiplicador x999: DESATIVADO";
    updateUI();
    alert("Todos os dados do plano físico e espiritual foram resetados!");
});

// REFRESH COMPLETO DA INTERFACE
function updateUI() {
    if (game.infiniteAuraActive) {
        game.aura = 999999999999;
    }

    auraDisplay.innerText = Math.floor(game.aura).toLocaleString() + " Aura";
    apsDisplay.innerText = "Aura por seg: " + getAuraPerSecond().toLocaleString(undefined, {maximumFractionDigits: 1});
    
    if (game.totalAuraEarned >= 5000) tabSecret.style.display = "block";

    // Atualização de preços e botões normais
    clickPrice.innerText = Math.floor(game.clickPrice).toLocaleString() + " Aura";
    clickEffect.innerText = `Ganha +${getClickPower().toLocaleString()} por clique (Nível ${game.clickLevel})`;
    upClick.disabled = game.aura < game.clickPrice || game.isSpinning;

    upAuto1.disabled = game.aura < game.auto1Price || game.isSpinning;
    auto1Price.innerText = Math.floor(game.auto1Price).toLocaleString() + " Aura";
    auto1Effect.innerText = `+${(game.auto1Power * getMultiplier()).toLocaleString()}/seg (${game.auto1} possuídos)`;

    upAuto2.disabled = game.aura < game.auto2Price || game.isSpinning;
    auto2Price.innerText = Math.floor(game.auto2Price).toLocaleString() + " Aura";
    auto2Effect.innerText = `+${(game.auto2Power * getMultiplier()).toLocaleString()}/seg (${game.auto2} comprados)`;

    upAuto3.disabled = game.aura < game.auto3Price || game.isSpinning;
    auto3Price.innerText = Math.floor(game.auto3Price).toLocaleString() + " Aura";
    auto3Effect.innerText = `+${(game.auto3Power * getMultiplier()).toLocaleString()}/seg (${game.auto3} comprados)`;

    upAuto4.disabled = game.aura < game.auto4Price || game.isSpinning;
    auto4Price.innerText = Math.floor(game.auto4Price).toLocaleString() + " Aura";
    auto4Effect.innerText = `+${(game.auto4Power * getMultiplier()).toLocaleString()}/seg (${game.auto4} comprados)`;

    // Upgrades Secretos
    upSecret1.disabled = game.aura < game.secret1Price || game.isSpinning;
    secret1Price.innerText = Math.floor(game.secret1Price).toLocaleString() + " Aura";
    secret1Effect.innerText = `Aumenta o multiplicador de cliques em +500% (${game.secret1} comprados)`;

    upSecret2.disabled = game.aura < game.secret2Price || game.isSpinning;
    secret2Price.innerText = Math.floor(game.secret2Price).toLocaleString() + " Aura";
    secret2Effect.innerText = `Ganha +5.000 Aura/seg passivamente (${game.secret2} comprados)`;
    upSecret3.disabled = game.aura < game.secret3Price || game.isSpinning;
secret3Price.innerText = Math.floor(game.secret3Price).toLocaleString() + " Aura";
secret3Effect.innerText = `Dobra permanentemente toda a sua Aura por segundo atual (${game.secret3} comprados)`;
// Definição do Custo da Roleta
game.paidSpinCost = Math.max(500, Math.floor(getAuraPerSecond() * 15));
paidCostText.innerText = `Custo: ${game.paidSpinCost.toLocaleString()} Aura`;
spinPaidBtn.disabled = game.aura < game.paidSpinCost || game.isSpinning;
// Ranks e Transcendência
let currentRank = ranks.name;
for (let i = 0; i < ranks.length; i++) {
if (game.totalAuraEarned >= ranks[i].limit) currentRank = ranks[i].name;
}
rankDisplay.innerText = "Rank: " + currentRank;
rebirthDisplay.innerText = `Almas Divinas: ${game.rebirths} (+${game.rebirths * 100}% bônus total)`;

rebirthBtn.disabled = game.aura < game.rebirthCost || game.isSpinning;
}
// SISTEMA DO GIRO DA ROLETA
function spinWheel() {
if (game.isSpinning) return;
if(!game.infiniteAuraActive) {
game.aura -= game.paidSpinCost;
}
game.isSpinning = true;
rouletteResult.innerText = "Canalizando forças místicas...";
wheelText.innerText = "🌀";
const options = [
{ name: "Azar Espiritual (Perdeu 15% de Aura) 💀", action: () => { if(!game.infiniteAuraActive) game.aura *= 0.85; } },
{ name: "Faísca de Aura (+500 Aura) ⚡", action: () => { game.aura += 500; game.totalAuraEarned += 500; } },
{ name: "Explosão Astral (+5.000 Aura) 🔮", action: () => { game.aura += 5000; game.totalAuraEarned += 5000; } },
{ name: "Poder de Toque (+50 cliques base) 🎴", action: () => game.clickPower += 50 },
{ name: "JACKPOT CÓSMICO (+100.000 Aura!) 👑", action: () => { game.aura += 100000; game.totalAuraEarned += 100000; } },
{ name: "Dízimo da Fortuna (+10% do seu total histórico) ✨", action: () => { let bonus = game.totalAuraEarned * 0.1; game.aura += bonus; game.totalAuraEarned += bonus; } }
];
let choiceIdx = Math.floor(Math.random() * options.length);
let extraRounds = 7 * 360;
let targetAngle = (choiceIdx * 60) + 30;
game.currentRotation += extraRounds + targetAngle - (game.currentRotation % 360);
wheel.style.transform = `rotate(${game.currentRotation}deg)`;
setTimeout(() => {
game.isSpinning = false;
options[choiceIdx].action();
wheelText.innerText = "✨";
// CÓDIGO CORRIGIDO (Adicionado as crases ` no início e no fim):
rouletteResult.innerText = `Resultado: ${options[choiceIdx].name}`;

updateUI();
}, 2500);
}
spinPaidBtn.addEventListener('click', spinWheel);
// CLIQUE PRINCIPAL
clickBtn.addEventListener('click', () => {
if (game.isSpinning) return;
let power = getClickPower();
game.aura += power;
game.totalAuraEarned += power;
updateUI();
});
// COMPRAS DE MELHORIAS NORMAIS
upClick.addEventListener('click', () => { if (game.aura >= game.clickPrice) { game.aura -= game.clickPrice; game.clickLevel++; game.clickPower += 1; game.clickPrice = Math.floor(game.clickPrice * 1.5); updateUI(); } });
upAuto1.addEventListener('click', () => { if (game.aura >= game.auto1Price) { game.aura -= game.auto1Price; game.auto1++; game.auto1Price = Math.floor(game.auto1Price * 1.15); updateUI(); } });
upAuto2.addEventListener('click', () => { if (game.aura >= game.auto2Price) { game.aura -= game.auto2Price; game.auto2++; game.auto2Price = Math.floor(game.auto2Price * 1.18); updateUI(); } });
upAuto3.addEventListener('click', () => { if (game.aura >= game.auto3Price) { game.aura -= game.auto3Price; game.auto3++; game.auto3Price = Math.floor(game.auto3Price * 1.22); updateUI(); } });
upAuto4.addEventListener('click', () => { if (game.aura >= game.auto4Price) { game.aura -= game.auto4Price; game.auto4++; game.auto4Price = Math.floor(game.auto4Price * 1.26); updateUI(); } });
// COMPRAS DE MELHORIAS SECRETAS
upSecret1.addEventListener('click', () => { if (game.aura >= game.secret1Price) { game.aura -= game.secret1Price; game.secret1++; game.secret1Price = Math.floor(game.secret1Price * 2.5); updateUI(); } });
upSecret2.addEventListener('click', () => { if (game.aura >= game.secret2Price) { game.aura -= game.secret2Price; game.secret2++; game.secret2Price = Math.floor(game.secret2Price * 2.2); updateUI(); } });
upSecret3.addEventListener('click', () => { if (game.aura >= game.secret3Price) { game.aura -= game.secret3Price; game.secret3++; game.secret3Price = Math.floor(game.secret3Price * 3.0); updateUI(); } });
// PRESTÍGIO
rebirthBtn.addEventListener('click', () => {
if (game.aura >= game.rebirthCost) {
game.rebirths++; game.aura = 0; game.clickLevel = 1; game.clickPower = 1; game.clickPrice = 15;
game.auto1 = 0; game.auto1Price = 100; game.auto2 = 0; game.auto2Price = 1100; game.auto3 = 0; game.auto3Price = 12000; game.auto4 = 0; game.auto4Price = 130000;
updateUI(); alert("Você transcendeu seu plano espiritual!");
}
});
// LOOP PRINCIPAL DO TICK (100ms)
setInterval(() => {
let aps = getAuraPerSecond();
if (aps > 0 && !game.isSpinning) {
game.aura += aps / 10;
game.totalAuraEarned += aps / 10;
}
updateUI();
}, 100);
updateUI();
