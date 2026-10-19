// --- MOTOR CENTRAL DE ESTADO DO JOGO ---
const Game = {
    aura: 0,
    rebirths: 0,
    fragmentos: 0,
    upgrades: { u1: 0, u2: 0, u3: 0 },
    divindade: { h1: 0, h2: 0 }, // Árvore Divina
    custos: { u1: 15, u2: 60, u3: 400, rebirth: 1000 },
    skinAtiva: 'cyber'
};

let el, clickArea, cometaBonus;
let audioCtx = null;

// Inicializador Seguro Avançado
function iniciarJogo() {
    mapearElementos();
    carregarJogo();
    configurarEventos();
    mudarSkin(Game.skinAtiva);
    
    // Loops de Tempo Paralelos
    setInterval(executarGanhoPassivo, 100);
    setInterval(salvarJogo, 5000);
    setInterval(gerenciarSpawnCometa, 14000);
    
    atualizarTela();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarJogo);
} else {
    iniciarJogo();
}

function mapearElementos() {
    clickArea = document.getElementById("area-de-clique");
    cometaBonus = document.getElementById("cometa-bonus");
    el = {
        contador: document.getElementById("aura-contador"),
        txtFragmentos: document.getElementById("txt-fragmentos"),
        raridade: document.getElementById("txt-raridade"),
        valClique: document.getElementById("val-clique"),
        valPassivo: document.getElementById("val-passivo"),
        valCrit: document.getElementById("val-crit"),
        valBonusGod: document.getElementById("val-bonus-god"),
        lblRebirth: document.getElementById("lbl-rebirth"),
        btnRebirth: document.getElementById("btn-rebirth"),
        barraRebirth: document.getElementById("barra-progresso-rebirth"),
        
        u1: document.getElementById("btn-u1"),
        u2: document.getElementById("btn-u2"),
        u3: document.getElementById("btn-u3"),
        lvl1: document.getElementById("lvl-u1"),
        lvl2: document.getElementById("lvl-u2"),
        box3: document.getElementById("box-u3"),
        nome3: document.getElementById("nome-u3"),
        efeito3: document.getElementById("efeito-u3"),
        
        h1: document.getElementById("btn-h1"),
        h2: document.getElementById("btn-h2"),
        lvlH1: document.getElementById("lvl-h1"),
        lvlH2: document.getElementById("lvl-h2"),
        
        btnRoleta: document.getElementById("btn-roletar"),
        resGacha: document.getElementById("gacha-resultado")
    };
}

// --- SINTETIZADOR DE ÁUDIO NATIVO (Sons Sem Arquivos Extensores) ---
function tocarSom(freq, tipo, duracao) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = tipo; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duracao);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duracao);
    } catch(e){}
}

// --- EQUAÇÕES DE ESCALONAMENTO DE PODER ---
function obterSorteCritica() { return 0.10 + (Game.divindade.h1 * 0.05); } // 10% Base + 5% por nível divino
function obterMultiplicadorRebirth() { return 1 + Game.rebirths; }
function obterBonusDivinoPassivo() { return 1 + (Game.divindade.h2 * 0.25); } // +25% por nível divino

function calcularValorFinalClique() {
    let base = 1 + Game.upgrades.u1 + (Game.upgrades.u3 * 25);
    return Math.round(base * obterMultiplicadorRebirth());
}

function calcularValorFinalPassivo() {
    let base = Game.upgrades.u2 * 2;
    return Math.round(base * obterMultiplicadorRebirth() * obterBonusDivinoPassivo());
}

function atualizarRaridadeETexto(poderClique) {
    if (!el.raridade) return;
    if (poderClique < 20) el.raridade.innerText = "Aura Fluida (Comum)";
    else if (poderClique < 200) el.raridade.innerText = "Aura Eclipse (Rara)";
    else if (poderClique < 2000) el.raridade.innerText = "Aura Singular Cósmica (Épica)";
    else el.raridade.innerText = "REINO DOS DEUSES (IMPERIAL)";
}

// --- ATUALIZADOR MAESTRO DA TELA ---
function atualizarTela() {
    if (!el || !el.contador) return;

    const clique = calcularValorFinalClique();
    const passivo = calcularValorFinalPassivo();

    el.contador.innerText = Math.floor(Game.aura).toLocaleString();
    el.txtFragmentos.innerText = Game.fragmentos;
    el.valClique.innerText = "+" + clique;
    el.valPassivo.innerText = "+" + passivo + "/s";
    el.valCrit.innerText = (obterSorteCritica() * 100).toFixed(0) + "%";
    el.valBonusGod.innerText = obterBonusDivinoPassivo().toFixed(2) + "x";
    el.lblRebirth.innerText = Game.rebirths;

    if (el.barraRebirth) {
        let pct = (Game.aura / Game.custos.rebirth) * 100;
        el.barraRebirth.style.width = Math.min(pct, 100) + "%";
    }

    atualizarRaridadeETexto(clique);

    // Botoes normais
    el.u1.innerText = "Custo: " + Game.custos.u1; el.u1.disabled = (Game.aura < Game.custos.u1);
    el.u2.innerText = "Custo: " + Game.custos.u2; el.u2.disabled = (Game.aura < Game.custos.u2);
    el.lvl1.innerText = Game.upgrades.u1; el.lvl2.innerText = Game.upgrades.u2;

    if (Game.rebirths >= 1) {
        el.box3.classList.remove("bloqueado");
        el.nome3.innerHTML = "Sintonia Astral (<span id='lvl-u3'>" + Game.upgrades.u3 + "</span>)";
        el.efeito3.innerText = "+25 por clique manual";
        el.u3.innerText = "Custo: " + Game.custos.u3; el.u3.disabled = (Game.aura < Game.custos.u3);
    } else { el.box3.classList.add("bloqueado"); el.nome3.innerText = "🔒 Rebirth 1 Necessário"; el.u3.disabled = true; }

    // Botões Divinos (Fragmentos)
    el.lvlH1.innerText = Game.divindade.h1;
    el.lvlH2.innerText = Game.divindade.h2;
    el.h1.disabled = (Game.fragmentos < 1);
    el.h2.disabled = (Game.fragmentos < 2);

    // Cassino Botão
    el.btnRoleta.disabled = (Game.aura < 200);
    el.btnRebirth.innerText = "Meta: " + Game.custos.rebirth.toLocaleString();
    el.btnRebirth.disabled = (Game.aura < Game.custos.rebirth);
}

// --- INPUTS: CLIQUES E PARTICULAS ---
function dispararClique(e) {
    const base = calcularValorFinalClique();
    const eCrit = Math.random() < obterSorteCritica();
    const total = eCrit ? base * 3 : base;

    Game.aura += total;
    tocarSom(eCrit ? 880 : 440, 'triangle', 0.08);

    if (clickArea) {
        const p = document.createElement("div"); p.classList.add("particle");
        p.innerText = "+" + total + (eCrit ? " ⚡ CRIT!" : "");
        if (eCrit) p.style.color = "var(--accent)";
        const rect = clickArea.getBoundingClientRect();
        p.style.left = (e.clientX ? (e.clientX - rect.left) : (rect.width/2)) + "px";
        p.style.top = (e.clientY ? (e.clientY - rect.top) : (rect.height/2)) + "px";
        clickArea.appendChild(p); setTimeout(() => p.remove(), 600);
    }
    atualizarTela();
}

// --- MINIJOGO: SPAWN DA ANOMALIA QUANTICA ---
function gerenciarSpawnCometa() {
    if (!cometaBonus || !cometaBonus.classList.contains("cometa-escondido")) return;
    if (Math.random() < 0.5) {
        cometaBonus.style.left = Math.floor(Math.random() * (window.innerWidth - 200)) + "px";
        cometaBonus.style.top = Math.floor(Math.random() * (window.innerHeight - 100)) + "px";
        cometaBonus.classList.remove("cometa-escondido");
        setTimeout(() => cometaBonus.classList.add("cometa-escondido"), 5000);
    }
}

function coletarCometa() {
    cometaBonus.classList.add("cometa-escondido");
    tocarSom(1200, 'sine', 0.4);
    let recompensa = Math.max(calcularValorFinalClique() * 50, 1000);
    Game.aura += recompensa;
    el.resGacha.innerText = "☄️ Capturou Anomalia! Recorreu +" + recompensa + " Auras!";
    atualizarTela();
}

// --- CASSINO MINI-GACHA ---
function jogarCassino() {
    if (Game.aura < 200) return;
    Game.aura -= 200;
    tocarSom(300, 'sawtooth', 0.2);
    
    let sorteio = Math.random();
    if (sorteio < 0.4) { // Perdeu
        el.resGacha.innerText = "❌ AzarCósmico! Você perdeu as 200 Auras.";
        el.resGacha.style.color = "#ff4444";
    } else if (sorteio < 0.85) { // Ganho Normal (2x)
        Game.aura += 400;
        el.resGacha.innerText = "🎉 Ganhou! Recompensa dobrada (+400 Auras)";
        el.resGacha.style.color = "#00ff66";
    } else { // JACKPOT! (10x)
        Game.aura += 2000;
        tocarSom(1500, 'sine', 0.6);
        el.resGacha.innerText = "💎 JACKPOT INTERGALÁCTICO! RECOMPENSA DE +2.000 AURAS!";
        el.resGacha.style.color = "#ffaa00";
    }
    atualizarTela();
}

// --- GERENCIADOR DE ABAS E EVENTOS ---
function abrirAba(nomeAba) {
    document.querySelectorAll('.conteudo-aba').forEach(a => a.classList.remove('ativa'));
    document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
    document.getElementById("aba-" + nomeAba).classList.add('ativa');
    event.currentTarget.classList.add('ativa');
}

function mudarSkin(id) {
    document.body.className = ""; 
    if (id !== 'cyber') document.body.classList.add("theme-" + id);
    Game.skinAtiva = id;
    document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('ativo'));
    event?.currentTarget?.classList.add('ativo');
}

function configurarEventos() {
    document.getElementById("btn-farmar").addEventListener("click", dispararClique);
    cometaBonus.addEventListener("click", coletarCometa);
    el.btnRoleta.addEventListener("click", jogarCassino);
    
    el.u1.addEventListener("click", () => comprarItem('u1', 1.4));
    el.u2.addEventListener("click", () => comprarItem('u2', 1.5));
    el.u3.addEventListener("click", () => comprarItem('u3', 1.6));
    
    el.h1.addEventListener("click", () => comprarDivindade('h1', 1));
    el.h2.addEventListener("click", () => comprarDivindade('h2', 2));
    el.btnRebirth.addEventListener("click", efetuarRebirth);
    document.querySelector(".btn-acao-perfil").addEventListener("click", resetTudo);
}

function comprarItem(id, inflacao) {
if (Game.aura >= Game.custos[id]) {
Game.aura -= Game.custos[id]; Game.upgrades[id]++;
Game.custos[id] = Math.round(Game.custos[id] * inflacao);
tocarSom(600, 'sine', 0.05); atualizarTela(); salvarJogo();
}
}
function comprarDivindade(id, preco) {
if (Game.fragmentos >= preco) {
Game.fragmentos -= preco; Game.divindade[id]++;
tocarSom(900, 'triangle', 0.15); atualizarTela(); salvarJogo();
}
}
function efetuarRebirth() {
if (Game.aura >= Game.custos.rebirth) {
Game.rebirths++;
// Concede Fragmentos baseado no nível do Rebirth alcançado
Game.fragmentos += Math.floor(Game.custos.rebirth / 1000);
Game.aura = 0; Game.upgrades = { u1: 0, u2: 0, u3: 0 };
Game.custos = { u1: 15, u2: 60, u3: 400, rebirth: Math.round(Game.custos.rebirth * 3.8) };
tocarSom(200, 'sawtooth', 0.5); atualizarTela(); salvarJogo();
}
}
function executarGanhoPassivo() {
const p = calcularValorFinalPassivo();
if (p > 0) { Game.aura += p / 10; atualizarTela(); }
}
function salvarJogo() { try { localStorage.setItem("auraGodSave_v4", JSON.stringify(Game)); } catch(e){} }
function carregarJogo() {
try {
const s = localStorage.getItem("auraGodSave_v4");
if (s) { Object.assign(Game, JSON.parse(s)); }
} catch(e){}
}
function resetTudo() { if(confirm("Deletar todos os deuses e registros?")) { localStorage.removeItem("auraGodSave_v4"); location.reload(); } }