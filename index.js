let aura = 0;
let auraPorClique = 1;

// 2. Mapear os elementos do HTML
const contadorTexto = document.getElementById("aura-contador");
const botaoFarmar = document.getElementById("btn-farmar");

// 3. Criar a função que adiciona a Aura
function farmarAura() {
    aura += auraPorClique;
    atualizarTela();
}

// 4. Criar a função que atualiza o contador visual na página
function atualizarTela() {
    contadorTexto.innerText = aura;
}

// 5. Escutar o evento de clique no botão
botaoFarmar.addEventListener("click", farmarAura);