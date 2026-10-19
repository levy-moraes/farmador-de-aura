const Game = {
    aura: 0,
    auraHistorica: 0,
    rebirths: 0,
    upgrades: { u1: 0, u2: 0, u3: 0, u4: 0 },
    custos: { u1: 15, u2: 60, u3: 400, u4: 2500, rebirth: 1000 },
    achievements: { ach1: false, ach2: false, ach3: false }
};

let el, clickArea;

// Inicialização Absoluta Segura
window.onload = function() {
    mapearElementos();
    carregarJogo();
    configurarEventos();
    
    // Loops Principais de tempo
    setInterval(executarGanhoPassivo, 100);
    setInterval(salvarJogo, 5000);
    
    atualizarTela();
};

function mapearElementos() {
    clickArea = document.getElementById("area-de-clique");
    el = {
        contador: document.getElementById("aura-contador"),
        raridade: document.getElementById("txt-raridade"),
        valClique: document.getElementById("val-clique"),
        valPassivo: document.getElementById("val-passivo"),
        valCrit: document.getElementById("val-crit"),
        valBonusConq: document.getElementById("val-bonus-conq"),
        lblRebirth: document.getElementById("lbl-rebirth"),
        btnRebirth: document.getElementById("btn-rebirth"),
        
        u1: document.getElementById("btn-u1"),
        u2: document.getElementById("btn-u2"),
        u3: document.getElementById("btn-u3"),
        u4: document.getElementById("btn-u4"),
        
        lvl1: document.getElementById("lvl-u1"),
        lvl2: document.getElementById("lvl-u2"),
        
        box3: document.getElementById("box-u3"),
        nome3: document.getElementById("nome-u3"),
        efeito3: document.getElementById("efeito-u3"),
        
        box4: document.getElementById("box-u4"),
        nome4: document.getElementById("nome-u4"),
        efeito4: document.getElementById("efeito-u4")
    };
}

// --- SISTEMA DE CÁLCULO E BALANÇO ---
function obterBonusConquistas() {
    let bonus = 1.0;
    if (Game.achievements.ach1) bonus += 0.1;
    if (Game.achievements.ach2) bonus += 0.1;
    if (Game.achievements.ach3) bonus += 0.2;
    return bonus;
}

function obterMultiplicadorRebirth() { return 1 + Game.rebirths; }
function obterPoderCliqueBase() { return 1 + Game.upgrades.u1 + (Game.upgrades.u3 * 20); }
function obterGanhoPassivoBase() { return (Game.upgrades.u2 * 2) + (Game.upgrades.u4 * 120); }

function calcularValorFinalClique() {
    return Math.round(obterPoderCliqueBase() * obterMultiplicadorRebirth() * obterBonusConquistas());
}

function calcularValorFinalPassivo() {
    return Math.round(obterGanhoPassivoBase() * obterMultiplicadorRebirth() * obterBonusConquistas());
}

// --- IDENTIFICADOR DINÂMICO DE RARIDADES ---
function atualizarRaridadeETexto(poderClique) {
    if (poderClique < 10) { el.raridade.innerText = "Aura Fluida (Comum)"; el.raridade.style.color = "#8c8dae"; }
    else if (poderClique < 100) { el.raridade.innerText = "Aura Cromática (Rara)"; el.raridade.style.color = "#00ffff"; }
    else if (poderClique < 1000) { el.raridade.innerText = "Aura Eclipse (Épica)"; el.raridade.style.color = "#bc13fe"; }
    else { el.raridade.innerText = "Aura Divina Singular (Lendária)"; el.raridade.style.color = "#ffaa00"; }
}

// --- RENDERIZADOR GLOBAL ---
function atualizarTela() {
    if (!el.contador) return;

    const ganhoClique = calcularValorFinalClique();
    const ganhoPassivo = calcularValorFinalPassivo();

    el.contador.innerText = Math.floor(Game.aura).toLocaleString();
    el.valClique.innerText = "+" + ganhoClique;
    el.valPassivo.innerText = "+" + ganhoPassivo + "/s";
    el.valBonusConq.innerText = obterBonusConquistas().toFixed(1) + "x";
    el.lblRebirth.innerText = Game.rebirths;
    
    atualizarRaridadeETexto(ganhoClique);
    verificarConquistas();

    // Upgrades Comuns
    el.u1.innerText = "Custo: " + Game.custos.u1;
    el.u2.innerText = "Custo: " + Game.custos.u2;
    el.lvl1.innerText = Game.upgrades.u1;
    el.lvl2.innerText = Game.upgrades.u2;
    el.u1.disabled = (Game.aura < Game.custos.u1);
    el.u2.disabled = (Game.aura < Game.custos.u2);

    // Tier 2 (Rebirth 1+)
    if (Game.rebirths >= 1) {
        el.box3.classList.remove("bloqueado");
        el.nome3.innerHTML = "Sintonia Astral (<span id='lvl-u3'>" + Game.upgrades.u3 + "</span>)";
        el.efeito3.innerText = "+20 base por clique manual";
        el.u3.innerText = "Custo: " + Game.custos.u3;
        el.u3.disabled = (Game.aura < Game.custos.u3);
    } else {
        el.box3.classList.add("bloqueado");
        el.nome3.innerText = "🔒 Bloqueado (Rebirth 1)";
        el.u3.disabled = true;
    }

    // Tier 3 (Rebirth 2+)
    if (Game.rebirths >= 2) {
        el.box4.classList.remove("bloqueado");
        el.nome4.innerHTML = "Fenda Cósmica Passiva (<span id='lvl-u4'>" + Game.upgrades.u4 + "</span>)";
        el.efeito4.innerText = "+120 base por segundo";
        el.u4.innerText = "Custo: " + Game.custos.u4;
        el.u4.disabled = (Game.aura < Game.custos.u4);
    } else {
        el.box4.classList.add("bloqueado");
        el.nome4.innerText = "🔒 Bloqueado (Rebirth 2)";
        el.u4.disabled = true;
    }

    // Botão de Rebirth
    el.btnRebirth.innerText = "Meta: " + Game.custos.rebirth.toLocaleString();
    el.btnRebirth.disabled = (Game.aura < Game.custos.rebirth);
}

// --- ENGENHARIA DE PARTICULAS NO CLIQUE ---
function dispararClique(e) {
    const ganhoBase = calcularValorFinalClique();
    const eCritico = Math.random() < 0.05; // 5% Chance Crítico 3x
    const ganhoFinal = eCritico ? ganhoBase * 3 : ganhoBase;

    Game.aura += ganhoFinal;
    Game.auraHistorica += ganhoFinal;

    const p = document.createElement("div");
    p.classList.add("particle");
    p.innerText = "+" + ganhoFinal + (eCritico ? " CRÍTICO!" : "");
    if(eCritico) p.style.color = "var(--accent)";
    
    const rect = clickArea.getBoundingClientRect();
    const posX = e.clientX ? (e.clientX - rect.left) : (rect.width / 2);
    const posY = e.clientY ? (e.clientY - rect.top) : (rect.height / 2);
    
    p.style.left = posX + "px";
    p.style.top = posY + "px";
    clickArea.appendChild(p);

    setTimeout(() => p.remove(), 600);
    atualizarTela();
}

// --- VERIFICADOR DE CONQUISTAS ---
function verificarConquistas() {
    if (!Game.achievements.ach1 && Game.auraHistorica >= 500) {
        Game.achievements.ach1 = true;
        marcarConquistaGanha("ach-1", "badge-1");
    }
    if (!Game.achievements.ach2 && Game.upgrades.u1 >= 15) {
        Game.achievements.ach2 = true;
        marcarConquistaGanha("ach-2", "badge-2");
    }
    if (!Game.achievements.ach3 && Game.rebirths >= 1) {
        Game.achievements.ach3 = true;
        marcarConquistaGanha("ach-3", "badge-3");
    }
}

function marcarConquistaGanha(boxId, badgeId) {
    const cBox = document.getElementById(boxId);
    const cBadge = document.getElementById(badgeId);
    if (cBox) cBox.classList.add("desbloqueada");
    if (cBadge) cBadge.innerText = "CONCLUÍDO";
}

// --- CONTROLES DE INTERAÇÃO DO JOGADOR ---
function configurarEventos() {
    document.getElementById("btn-farmar").addEventListener("click", dispararClique);
    document.getElementById("btn-u1").addEventListener("click", () => comprarUpgrade('u1', 1.4));
    document.getElementById("btn-u2").addEventListener("click", () => comprarUpgrade('u2', 1.5));
    document.getElementById("btn-u3").addEventListener("click", () => comprarUpgrade('u3', 1.6));
    document.getElementById("btn-u4").addEventListener("click", () => comprarUpgrade('u4', 1.7));
    el.btnRebirth.addEventListener("click", efetuarRebirth);
    document.getElementById("btn-reset").addEventListener("click", resetGeral);
}

function comprarUpgrade(id, inflacao) {
    if (Game.aura >= Game.custos[id]) {
        Game.aura -= Game.custos[id];
        Game.upgrades[id]++;
        Game.custos[id] = Math.round(Game.custos[id] * inflacao);
        atualizarTela();
        salvarJogo();
    }
}

function efetuarRebirth() {
    if (Game.aura >= Game.custos.rebirth) {
        Game.rebirths++;
        Game.aura = 0;
        Game.upgrades = { u1: 0, u2: 0, u3: 0, u4: 0 };
        Game.custos = { u1: 15, u2: 60, u3: 400, u4: 2500, rebirth: Math.round(Game.custos.rebirth * 3.5) };
        atualizarTela();
        salvarJogo();
    }
}

function executarGanhoPassivo() {
    const passivoTotal = calcularValorFinalPassivo();
    if (passivoTotal > 0) {
        Game.aura += passivoTotal / 10;
        Game.auraHistorica += passivoTotal / 10;
        atualizarTela();
    }
}

// --- SALVAMENTO LOCAL ---
function salvarJogo() {
    try { localStorage.setItem("cosmicTycoonSave_v2", JSON.stringify(Game)); } catch (e) {}
}

function carregarJogo() {
    try {
        const save = localStorage.getItem("cosmicTycoonSave_v2");
        if (save) {
            const obj = JSON.parse(save);
            Object.assign(Game, obj);
            if (Game.achievements.ach1) marcarConquistaGanha("ach-1", "badge-1");
            if (Game.achievements.ach2) marcarConquistaGanha("ach-2", "badge-2");
            if (Game.achievements.ach3) marcarConquistaGanha("ach-3", "badge-3");
        }
    } catch (e) {}
}

function resetGeral() {
    if (confirm("Isto deletará todo o seu progresso e conquistas. Deseja redefinir permanentemente?")) {
        try { localStorage.removeItem("cosmicTycoonSave_v2"); } catch(e){}
        location.reload();
    }
}