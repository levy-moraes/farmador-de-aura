// --- MOTOR CENTRAL DE ESTADO DO JOGO ---
const Game = {
    aura: 0,
    rebirths: 0,
    fragmentos: 0,
    upgrades: { u1: 0, u2: 0, u3: 0 },
    divindade: { h1: 0, h2: 0 },
    custos: { u1: 15, u2: 60, u3: 400, rebirth: 1000 },
    skinAtiva: 'cyber'
};

const Modificadores = {
    multiplicadorClique: 1,
    multiplicadorPassivo: 1,
    eventoAtual: 'nenhum',
    eventoTexto: 'Universo em Calmaria'
};

let el = {}, clickArea, cometaBonus, powerupLayer, roletaVisual;
let audioCtx = null;

// Executa com segurança máxima após carregar a árvore HTML
window.addEventListener("DOMContentLoaded", () => {
    mapearElementos();
    carregarJogo();
    configurarEventos();
    mudarSkin(Game.skinAtiva);
    
    // Loops de Tempo Paralelos
    setInterval(executarGanhoPassivo, 100);
    setInterval(salvarJogo, 5000);
    setInterval(gerenciarSpawnCometa, 14000);
    setInterval(gerenciarSpawnPowerUp, 20000);
    setInterval(gerenciarEventosAleatorios, 45000);
    
    atualizarTela();
});

function mapearElementos() {
    clickArea = document.getElementById("area-de-clique");
    cometaBonus = document.getElementById("cometa-bonus");
    powerupLayer = document.getElementById("powerup-layer");
    roletaVisual = document.getElementById("roleta-visual");
    
    el.contador = document.getElementById("aura-contador");
    el.txtFragmentos = document.getElementById("txt-fragmentos");
    el.raridade = document.getElementById("txt-raridade");
    el.valClique = document.getElementById("val-clique");
    el.valPassivo = document.getElementById("val-passivo");
    el.valCrit = document.getElementById("val-crit");
    el.valBonusGod = document.getElementById("val-bonus-god");
    el.lblRebirth = document.getElementById("lbl-rebirth");
    el.btnRebirth = document.getElementById("btn-rebirth");
    el.barraRebirth = document.getElementById("barra-progresso-rebirth");
    el.painelEvento = document.getElementById("painel-evento");
    
    el.u1 = document.getElementById("btn-u1");
    el.u2 = document.getElementById("btn-u2");
    el.u3 = document.getElementById("btn-u3");
    el.lvl1 = document.getElementById("lvl-u1");
    el.lvl2 = document.getElementById("lvl-u2");
    el.lvl3 = document.getElementById("lvl-u3");
    el.box3 = document.getElementById("box-u3");
    
    el.h1 = document.getElementById("btn-h1");
    el.h2 = document.getElementById("btn-h2");
    el.lvlH1 = document.getElementById("lvl-h1");
    el.lvlH2 = document.getElementById("lvl-h2");
    
    el.btnRoleta = document.getElementById("btn-roletar");
    el.resGacha = document.getElementById("gacha-resultado");
}

function tocarSom(freq, tipo, duracao) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = tipo; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duracao);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duracao);
    } catch(e){}
}

function obterSorteCritica() { 
    let baseCrit = 0.10 + (Game.divindade.h1 * 0.05); 
    if (Modificadores.eventoAtual === 'tempestade') baseCrit += 0.25;
    return baseCrit;
} 
function obterMultiplicadorRebirth() { return 1 + Game.rebirths; }
function obterBonusDivinoPassivo() { return 1 + (Game.divindade.h2 * 0.25); }

function calcularValorFinalClique() {
    let base = 1 + Game.upgrades.u1 + (Game.upgrades.u3 * 25);
    let total = Math.round(base * obterMultiplicadorRebirth() * Modificadores.multiplicadorClique);
    if (Modificadores.eventoAtual === 'supernova') total *= 2;
    return total;
}

function calcularValorFinalPassivo() {
    let base = Game.upgrades.u2 * 2;
    let total = Math.round(base * obterMultiplicadorRebirth() * obterBonusDivinoPassivo() * Modificadores.multiplicadorPassivo);
    if (Modificadores.eventoAtual === 'alinhamento') total *= 3;
    return total;
}

function atualizarRaridadeETexto(poderClique) {
    if (!el.raridade) return;
    if (poderClique < 20) el.raridade.innerText = "Aura Fluida (Comum)";
    else if (poderClique < 200) el.raridade.innerText = "Aura Eclipse (Rara)";
    else if (poderClique < 2000) el.raridade.innerText = "Aura Multiversal (Épica)";
    else el.raridade.innerText = "ENTIDADE SUPREMA (DEUS)";
}

function atualizarTela() {
    if (!el || !el.contador) return;

    const clique = calcularValorFinalClique();
    const passivo = calcularValorFinalPassivo();

    el.contador.innerText = Math.floor(Game.aura).toLocaleString();
    el.txtFragmentos.innerText = Game.fragmentos;
    el.valClique.innerText = "+" + clique;
    el.valPassivo.innerText = "+" + passivo + "/s";
    el.valCrit.innerText = (obterSorteCritica() * 100).toFixed(0) + "%";
    
    let bonusGeral = obterBonusDivinoPassivo() * Modificadores.multiplicadorClique * Modificadores.multiplicadorPassivo;
    el.valBonusGod.innerText = bonusGeral.toFixed(1) + "x";
    el.lblRebirth.innerText = Game.rebirths;

    if (el.barraRebirth) {
        let pct = (Game.aura / Game.custos.rebirth) * 100;
        el.barraRebirth.style.width = Math.min(pct, 100) + "%";
    }

    if (Modificadores.eventoAtual !== 'nenhum') {
        el.painelEvento.style.display = "block";
        el.painelEvento.innerText = Modificadores.eventoTexto;
    } else { el.painelEvento.style.display = "none"; }

    atualizarRaridadeETexto(clique);

    // Botões Loja Padrão
    el.u1.innerText = "Custo: " + Game.custos.u1; el.u1.disabled = (Game.aura < Game.custos.u1);
    el.u2.innerText = "Custo: " + Game.custos.u2; el.u2.disabled = (Game.aura < Game.custos.u2);
    el.lvl1.innerText = Game.upgrades.u1; el.lvl2.innerText = Game.upgrades.u2;

    // Destravas do Rebirth 1+
    if (Game.rebirths >= 1) {
        el.box3.classList.remove("bloqueado");
        el.box3.querySelector(".info-nome").innerHTML = "Sintonia Astral (<span id='lvl-u3'>" + Game.upgrades.u3 + "</span>)";
        el.box3.querySelector(".info-efeito").innerText = "+25 por clique manual";
        el.u3.innerText = "Custo: " + Game.custos.u3; el.u3.disabled = (Game.aura < Game.custos.u3);
    } else {
        el.box3.classList.add("bloqueado");
        el.box3.querySelector(".info-nome").innerText = "🔒 Rebirth 1";
        el.box3.querySelector(".info-efeito").innerText = "Sintonia Astral";
        el.u3.innerText = "Bloqueado"; el.u3.disabled = true;
    }

    // CORREÇÃO DOS CONTADORES DE HABILIDADES DIVINAS
    el.lvlH1.innerText = Game.divindade.h1;
    el.lvlH2.innerText = Game.divindade.h2;
    el.h1.disabled = (Game.fragmentos < 1);
    el.h2.disabled = (Game.fragmentos < 2);

    // Cassino e Rebirth
    el.btnRoleta.disabled = (Game.aura < 200);
    el.btnRebirth.innerText = "Meta: " + Game.custos.rebirth.toLocaleString();
    el.btnRebirth.disabled = (Game.aura < Game.custos.rebirth);
}

// --- CLIQUE MANUAL ---
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

// --- COMPRAS E REBIRTH INFINITO CORRIGIDO ---
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
        // Concede 1 Fragmento fixo + bônus por auras extras acumuladas
        Game.fragmentos += 1 + Math.floor(Game.aura / 2000);
        Game.rebirths++;

        // Resetar os Upgrades normais da rodada
        Game.aura = 0;
        Game.upgrades.u1 = 0;
        Game.upgrades.u2 = 0;
        Game.upgrades.u3 = 0;

        // Resetar e escalar os custos inflacionados da loja
        Game.custos.u1 = 15;
        Game.custos.u2 = 60;
        Game.custos.u3 = 400;

        // Escalar o custo do Rebirth exponencialmente
        Game.custos.rebirth = Math.round(Game.custos.rebirth * 3.5);

        tocarSom(200, 'sawtooth', 0.5);
        atualizarTela();
        salvarJogo();
    }
}

// --- CASSINO GACHA ANIMADO CÓSMICO PREMIUM ---
function jogarCassino() {
    if (Game.aura < 200 || roletaVisual.classList.contains("rodando")) return;
    Game.aura -= 200;
    atualizarTela();

    // Inicia Animação e Som acelerado da Roleta
    roletaVisual.classList.add("rodando");
    el.btnRoleta.disabled = true;
    el.resGacha.innerText = "🌀 Sintonizando fendas quânticas...";
    el.resGacha.style.color = "var(--text-muted)";

    let intervaloSom = setInterval(() => tocarSom(600, 'sine', 0.03), 100);

    // Sorteia o resultado em background durante o giro de 1.5 segundos
    setTimeout(() => {
        clearInterval(intervaloSom);
        roletaVisual.classList.remove("rodando");
        el.btnRoleta.disabled = false;

// CHANCES RECALIBRADAS (MUITO MAIS DIFÍCIL)
// 65% Perder | 30% Ganhar 2x | 5% Jackpot 10x
let sorteio = Math.random();
if (sorteio < 0.65) { // PERDEU
tocarSom(150, 'sawtooth', 0.3);
el.resGacha.innerText = "❌ Colapso Quântico! Você perdeu as 200 Auras.";
el.resGacha.style.color = "#ff4444";
} else if (sorteio < 0.95) { // GANHO NORMAL
Game.aura += 420;
tocarSom(700, 'sine', 0.15);
el.resGacha.innerText = "🎉 Vitória Estável! Ganhou +420 Auras.";
el.resGacha.style.color = "#00ff66";
} else { // JACKPOT RARO (5% CHANCE)
Game.aura += 2500;
tocarSom(1400, 'triangle', 0.6);
el.resGacha.innerText = "💎 JACKPOT MUNDIAL! +2.500 AURAS CONCENTRADAS!";
el.resGacha.style.color = "#ffaa00";
}
atualizarTela();
salvarJogo();
}, 1500);
}
// --- OUTROS MOTORES E SISTEMAS (DROPS/EVENTOS) ---
function gerenciarSpawnPowerUp() {
if (!powerupLayer) return;
if (Math.random() < 0.5) {
const drop = document.createElement("div"); drop.classList.add("powerup-drop");
const tipoBuff = Math.random() < 0.5 ? 'clique' : 'passivo';
if (tipoBuff === 'clique') { drop.innerText = "⚡ FRENESI (+2x Clique!)"; drop.style.background = "linear-gradient(135deg, #ff007f, #ffaa00)"; }
else { drop.innerText = "🌀 TEMPORAL (+2x Passivo!)"; drop.style.background = "linear-gradient(135deg, #00ffff, #00ff66)"; }
drop.style.left = Math.floor(Math.random() * (window.innerWidth - 250)) + "px";
drop.style.top = Math.floor(Math.random() * (window.innerHeight - 150)) + "px";
drop.addEventListener("click", () => { tocarSom(1000, 'sine', 0.3); drop.remove(); activarPowerUp(tipoBuff); });
powerupLayer.appendChild(drop); setTimeout(() => { if(drop && drop.parentNode) drop.remove(); }, 8000);
}
}
function activarPowerUp(tipo) {
if (tipo === 'clique') { Modificadores.multiplicadorClique = 2; setTimeout(() => { Modificadores.multiplicadorClique = 1; atualizarTela(); }, 10000); }
else { Modificadores.multiplicadorPassivo = 2; setTimeout(() => { Modificadores.multiplicadorPassivo = 1; atualizarTela(); }, 10000); }
atualizarTela();
}
function gerenciarEventosAleatorios() {
const sorteio = Math.random();
if (sorteio < 0.33) { Modificadores.eventoAtual = 'supernova'; Modificadores.eventoTexto = "💥 SUPERNOVA! (Cliques em Dobro!)"; el.painelEvento.style.background = "linear-gradient(90deg, #ff2200, #ff7700)"; }
else if (sorteio < 0.66) { Modificadores.eventoAtual = 'tempestade'; Modificadores.eventoTexto = "⚡ TEMPESTADE! (+25% Sorte Crítica!)"; el.painelEvento.style.background = "linear-gradient(90deg, #00b7ff, #aa00ff)"; }
else { Modificadores.eventoAtual = 'alinhamento'; Modificadores.eventoTexto = "🪐 ALINHAMENTO! (Passivo Triplicado!)"; el.painelEvento.style.background = "linear-gradient(90deg, #00ff66, #00b3ff)"; }
tocarSom(700, 'sawtooth', 0.4); atualizarTela();
setTimeout(() => { Modificadores.eventoAtual = 'nenhum'; atualizarTela(); }, 15000);
}
function gerenciarSpawnCometa() {
if (!cometaBonus || !cometaBonus.classList.contains("cometa-escondido")) return;
if (Math.random() < 0.5) {
cometaBonus.style.left = Math.floor(Math.random() * (window.innerWidth - 200)) + "px"; cometaBonus.style.top = Math.floor(Math.random() * (window.innerHeight - 100)) + "px"; cometaBonus.classList.remove("cometa-escondido");
setTimeout(() => { if(cometaBonus) cometaBonus.classList.add("cometa-escondido"); }, 5000);
}
}
function coletarCometa() {
cometaBonus.classList.add("cometa-escondido"); tocarSom(1200, 'sine', 0.4);
let recompensa = Math.max(calcularValorFinalClique() * 50, 1000); Game.aura += recompensa;
el.resGacha.innerText = "☄️ Anomalia Capturada! Ganhou +" + recompensa + " Auras!"; atualizarTela();
}
function executarGanhoPassivo() { const p = calcularValorFinalPassivo(); if (p > 0) { Game.aura += p / 10; atualizarTela(); } }
function abrirAba(nomeAba) { document.querySelectorAll('.conteudo-aba').forEach(a => a.classList.remove('ativa')); document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa')); const alvo = document.getElementById("aba-" + nomeAba); if (alvo) alvo.classList.add('ativa'); }
function mudarSkin(id) { document.body.className = ""; if (id !== 'cyber') document.body.classList.add("theme-" + id); Game.skinAtiva = id; document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('ativo')); }
function configurarEventos() {
document.getElementById("btn-farmar").addEventListener("click", dispararClique);
cometaBonus.addEventListener("click", coletarCometa); el.btnRoleta.addEventListener("click", jogarCassino);
el.u1.addEventListener("click", () => comprarItem('u1', 1.4)); el.u2.addEventListener("click", () => comprarItem('u2', 1.5)); el.u3.addEventListener("click", () => comprarItem('u3', 1.6));
el.h1.addEventListener("click", () => comprarDivindade('h1', 1)); el.h2.addEventListener("click", () => comprarDivindade('h2', 2));
el.btnRebirth.addEventListener("click", efetuarRebirth); document.getElementById("btn-reset").addEventListener("click", resetTudo);
document.querySelectorAll(".aba-btn").forEach(b => { b.addEventListener("click", (e) => { abrirAba(e.target.getAttribute("data-aba")); e.target.classList.add("ativa"); }); });
document.querySelectorAll(".skin-btn").forEach(b => { b.addEventListener("click", (e) => { mudarSkin(e.target.getAttribute("data-skin")); e.target.classList.add("ativo"); }); });
}
function salvarJogo() { try { localStorage.setItem("auraGodSave_v5.5", JSON.stringify(Game)); } catch(e){} }
function carregarJogo() { try { const s = localStorage.getItem("auraGodSave_v5.5"); if (s) { Object.assign(Game, JSON.parse(s)); } } catch(e){} }
function resetTudo() { if(confirm("Deletar todos os deuses e registros?")) { localStorage.removeItem("auraGodSave_v5.5"); location.reload(); } }