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

// Modificadores de buffs temporários
const Modificadores = {
    multiplicadorClique: 1,
    multiplicadorPassivo: 1,
    eventoAtual: 'nenhum',
    eventoTexto: 'Universo em Calmaria'
};

let el, clickArea, cometaBonus, powerupLayer;
let audioCtx = null;

function iniciarJogo() {
    mapearElementos();
    carregarJogo();
    configurarEventos();
    mudarSkin(Game.skinAtiva, null);
    
    // Loops Paralelos do Motor do Jogo
    setInterval(executarGanhoPassivo, 100);
    setInterval(salvarJogo, 5000);
    setInterval(gerenciarSpawnCometa, 14000);
    setInterval(gerenciarSpawnPowerUp, 20000);     // Cristais surgem a cada 20 segundos
    setInterval(gerenciarEventosAleatorios, 45000); // Climas cósmicos alteram a cada 45 segundos
    
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
    powerupLayer = document.getElementById("powerup-layer");
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
        painelEvento: document.getElementById("painel-evento"),
        
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

// --- SINTETIZADOR DE ÁUDIO NATIVO ---
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

// --- MATEMÁTICA DE ESCALONAMENTO ---
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

// --- RENDERIZADOR GLOBAL ---
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
    } else {
        el.painelEvento.style.display = "none";
    }

    atualizarRaridadeETexto(clique);

    // Botões Loja
    el.u1.innerText = "Custo: " + Game.custos.u1; el.u1.disabled = (Game.aura < Game.custos.u1);
    el.u2.innerText = "Custo: " + Game.custos.u2; el.u2.disabled = (Game.aura < Game.custos.u2);
    el.lvl1.innerText = Game.upgrades.u1; el.lvl2.innerText = Game.upgrades.u2;

    if (Game.rebirths >= 1) {
        el.box3.classList.remove("bloqueado");
        el.nome3.innerHTML = "Sintonia Astral (<span id='lvl-u3'>" + Game.upgrades.u3 + "</span>)";
        el.efeito3.innerText = "+25 por clique manual";
        el.u3.innerText = "Custo: " + Game.custos.u3; el.u3.disabled = (Game.aura < Game.custos.u3);
    } else { el.box3.classList.add("bloqueado"); el.nome3.innerText = "🔒 Rebirth 1 Necessário"; el.u3.disabled = true; }

    el.lvlH1.innerText = Game.divindade.h1; el.lvlH2.innerText = Game.divindade.h2;
    el.h1.disabled = (Game.fragmentos < 1); el.h2.disabled = (Game.fragmentos < 2);

    el.btnRoleta.disabled = (Game.aura < 200);
    el.btnRebirth.innerText = "Meta: " + Game.custos.rebirth.toLocaleString();
    el.btnRebirth.disabled = (Game.aura < Game.custos.rebirth);
}

// --- CONTROLE DE CRISTAIS FLUTUANTES ---
function gerenciarSpawnPowerUp() {
    if (!powerupLayer) return;
    if (Math.random() < 0.5) {
        const drop = document.createElement("div");
        drop.classList.add("powerup-drop");
        
        const tipoBuff = Math.random() < 0.5 ? 'clique' : 'passivo';
        if (tipoBuff === 'clique') {
            drop.innerText = "⚡ CRISTAL FRENESI (+2x Clique!)";
            drop.style.background = "linear-gradient(135deg, #ff007f, #ffaa00)";
        } else {
            drop.innerText = "🌀 CRISTAL TEMPORAL (+2x Passivo!)";
            drop.style.background = "linear-gradient(135deg, #00ffff, #00ff66)";
        }

        drop.style.left = Math.floor(Math.random() * (window.innerWidth - 250)) + "px";
        drop.style.top = Math.floor(Math.random() * (window.innerHeight - 150)) + "px";
        
        drop.addEventListener("click", () => {
            tocarSom(1000, 'sine', 0.3);
            drop.remove();
            ativarPowerUp(tipoBuff);
        });

        powerupLayer.appendChild(drop);
        setTimeout(() => { drop.remove(); }, 8000);
    }
}

function activarPowerUp(tipo) {
    if (tipo === 'clique') {
        Modificadores.multiplicadorClique = 2;
        alert("⚡ FRENESI CÓSMICO ATIVADO! Cliques dobram de bônus por 10 segundos!");
        setTimeout(() => { Modificadores.multiplicadorClique = 1; atualizarTela(); }, 10000);
    } else {
        Modificadores.multiplicadorPassivo = 2;
        alert("🌀 DOBRA TEMPORAL ATIVADA! Produção passiva dobrada por 10 segundos!");
        setTimeout(() => { Modificadores.multiplicadorPassivo = 1; atualizarTela(); }, 10000);
    }
    atualizarTela();
}

// --- CLIMAS CÓSMICOS GLOBAIS ---
function gerenciarEventosAleatorios() {
    const sorteio = Math.random();
    if (sorteio < 0.33) {
        Modificadores.eventoAtual = 'supernova';
        Modificadores.eventoTexto = "💥 EVENTO: SUPERNOVA ATIVA! (Cliques Estão Dobrados!)";
        el.painelEvento.style.background = "linear-gradient(90deg, #ff2200, #ff7700)";
    } else if (sorteio < 0.66) {
        Modificadores.eventoAtual = 'tempestade';
        Modificadores.eventoTexto = "⚡ EVENTO: TEMPESTADE ELÉTRICA! (+25% Sorte Crítica!)";
        el.painelEvento.style.background = "linear-gradient(90deg, #00b7ff, #aa00ff)";
    } else {
        Modificadores.eventoAtual = 'alinhamento';
        Modificadores.eventoTexto = "🪐 EVENTO: ALINHAMENTO ESPIRITUAL! (Produção Passiva Triplicada!)";
        el.painelEvento.style.background = "linear-gradient(90deg, #00ff66, #00b3ff)";
    }
    
    tocarSom(700, 'sawtooth', 0.4);
    atualizarTela();

    setTimeout(() => {
        Modificadores.eventoAtual = 'nenhum';
        Modificadores.eventoTexto = "Universo em Calmaria";
        atualizarTela();
    }, 15000);
}

// --- CLIQUES E ANIMAÇÕES ---
function dispararClique(e) {
const base = calcularValorFinalClique();
const eCrit = Math.random() < obterSorteCritica();
const total = eCrit ? base * 3 : base;
Game.aura += total;
tavorSom = tocarSom(eCrit ? 880 : 440, 'triangle', 0.08);
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
el.resGacha.innerText = "☄️ Fenda Coletada! Concedeu +" + recompensa + " Auras!";
atualizarTela();
}
// --- GACHA CASSINO ---
function jogarCassino() {
if (Game.aura < 200) return;
Game.aura -= 200;
tocarSom(300, 'sawtooth', 0.2);
let sorteio = Math.random();
if (sorteio < 0.4) {
el.resGacha.innerText = "❌ Perdeu as 200 Auras na flutuação cósmica.";
el.resGacha.style.color = "#ff4444";
} else if (sorteio < 0.85) {
Game.aura += 400;
el.resGacha.innerText = "🎉 Ganhou! Recompensa dobrada (+400 Auras)";
el.resGacha.style.color = "#00ff66";
} else {
Game.aura += 2000;
tocarSom(1500, 'sine', 0.6);
el.resGacha.innerText = "💎 JACKPOT INTERGALÁCTICO! (+2.000 AURAS!)";
el.resGacha.style.color = "#ffaa00";
}
atualizarTela();
}
// --- INTERFACES, SKINS E COMPRAS ---
function abrirAba(nomeAba, evento) {
document.querySelectorAll('.conteudo-aba').forEach(a => a.classList.remove('ativa'));
document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
const abaAlvo = document.getElementById("aba-" + nomeAba);
if (abaAlvo) abaAlvo.classList.add('ativa');
if (evento && evento.currentTarget) evento.currentTarget.classList.add('ativa');
}
function mudarSkin(id, evento) {
document.body.className = "";
if (id !== 'cyber') document.body.classList.add("theme-" + id);
Game.skinAtiva = id;
document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('ativo'));
if (evento && evento.currentTarget) evento.currentTarget.classList.add('ativo');
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
function salvarJogo() { try { localStorage.setItem("auraGodSave_v5", JSON.stringify(Game)); } catch(e){} }
function carregarJogo() {
try {
const s = localStorage.getItem("auraGodSave_v5");
if (s) { Object.assign(Game, JSON.parse(s)); }
} catch(e){}
}
function resetTudo() { if(confirm("Deletar todos os registros?")) { localStorage.removeItem("auraGodSave_v5"); location.reload(); } }