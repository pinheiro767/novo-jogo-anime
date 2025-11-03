// --- JOGO DA MEMÓRIA DE ASSOCIAÇÃO (8 CARTAS / 4 PARES) ---

// DEFINIÇÃO DOS PARES DE ASSOCIAÇÃO (A: Pergunta, B: Resposta - A e B são parceiros)
const associationPairs = [
    { id: 1, img: 'img/2anime.jpg', partner: 'img/3anime.jpg' }, 
    { id: 2, img: 'img/3anime.jpg', partner: 'img/2anime.jpg' }, 
    
    { id: 3, img: 'img/4anime.jpg', partner: 'img/5anime.jpg' }, 
    { id: 4, img: 'img/5anime.jpg', partner: 'img/4anime.jpg' }, 
    
    { id: 5, img: 'img/6anime.jpg', partner: 'img/7anime.jpg' }, 
    { id: 6, img: 'img/7anime.jpg', partner: 'img/6anime.jpg' }, 
    
    { id: 7, img: 'img/8anime.jpg', partner: 'img/9anime.jpg' }, 
    { id: 8, img: 'img/9anime.jpg', partner: 'img/8anime.jpg' } 
];

// Variáveis do Jogo
let gameCards = []; 
let hasFlippedCard = false; 
let lockBoard = false; 
let firstCard = null; 
let secondCard = null; 
let matchesFound = 0; 
let gameStarted = false; 

// Variáveis de Modo 2P e Roleta
let gameMode = 'single';
let currentPlayer = 1;
let player1Score = 0;
let player2Score = 0;
let totalAttempts = 0;
let correctMatches = 0;
let gameStartTime = 0;
let gameTimer = null;

// Elementos DOM
const coverScreen = document.getElementById('cover-screen');
const introVideo = document.getElementById('intro-video'); 
const optionOverlay = document.getElementById('option-overlay');
const watchButton = document.getElementById('watch-video');
const skipButton = document.getElementById('skip-video');
const gameContainer = document.getElementById('game-container');
const cardGrid = document.getElementById('card-grid');
const messageElement = document.getElementById('message');
const roundElement = document.getElementById('round');
const sfxCoin = document.getElementById('sfx-coin');     
const sfxWin = document.getElementById('sfx-win');       
const sfxError = document.getElementById('sfx-error');   
const sfxMove = document.getElementById('sfx-move');    
const bgm = document.getElementById('bgm');              
const rouletteContainer = document.getElementById('roulette-container');
const player1Info = document.getElementById('player1-info');
const player2Info = document.getElementById('player2-info');

// --- Funções Auxiliares ---

function playSFX(audio) { audio.currentTime = 0; audio.play().catch(e => console.log("Erro ao tocar SFX:", e)); }
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
const getCardImagePath = (card) => {
    const fullValue = card.style.getPropertyValue('--card-face-image');
    return fullValue.replace(/url\(['"]?(.*?)['"]?\)/, '$1').trim();
};

// --- Funções de Estado e Display ---

function updatePerformanceDisplay() {
    document.getElementById('attempts-count').textContent = totalAttempts;
    const accuracy = totalAttempts === 0 ? 100 : Math.round((correctMatches / totalAttempts) * 100);
    document.getElementById('accuracy-rate').textContent = accuracy + '%';
    document.getElementById('round').textContent = matchesFound;
}

function updatePlayerDisplay() {
    if (gameMode === 'multiplayer') {
        document.getElementById('player1-score').textContent = player1Score;
        document.getElementById('player2-score').textContent = player2Score;
        player1Info.classList.toggle('active', currentPlayer === 1);
        player2Info.classList.toggle('active', currentPlayer === 2);
    }
}

function switchPlayer() {
    if (gameMode === 'multiplayer') {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updatePlayerDisplay();
        messageElement.textContent = `Jogador ${currentPlayer} - Sua vez!`;
    }
}

// --- Lógica Principal do Jogo ---

function createCards() {
    gameCards = [...associationPairs]; 
    shuffle(gameCards);
    cardGrid.innerHTML = '';
    
    gameCards.forEach((cardData, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        card.style.setProperty('--card-face-image', `url(${cardData.img})`);
        card.dataset.partner = cardData.partner;
        
        card.addEventListener('click', flipCard); 
        cardGrid.appendChild(card);
    });
}

function flipCard(event) {
    const card = event.currentTarget;

    // Se já está virada, permite o zoom
    if (card.classList.contains('face-up') && !card.classList.contains('zoomed-card')) {
        handleZoom(card);
        return; 
    }
    
    if (lockBoard || card.classList.contains('face-up') || card.classList.contains('match')) return; 
    
    // Animação de rotação 3D
    card.classList.add('face-up');
    playSFX(sfxCoin);

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = card;
        messageElement.textContent = "Segunda carta...";
        return;
    }

    secondCard = card;
    lockBoard = true;
    totalAttempts++;
    
    checkForMatch();
}

function checkForMatch() {
    const secondCardImgPath = getCardImagePath(secondCard);
    const isMatch = firstCard.dataset.partner === secondCardImgPath;
    
    if (isMatch) {
        setTimeout(askForConfirmation, 500); 
    } else {
        unflipCards();
    }
}

function askForConfirmation() {
    playSFX(sfxMove);
    
    const confirmation = confirm("As cartas são um par? Tem certeza disso?");

    if (confirmation) {
        correctMatches++;
        disableCards();
    } else {
        unflipCards(); 
    }
    updatePerformanceDisplay();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    firstCard.classList.add('match');
    secondCard.classList.add('match');
    playSFX(sfxWin); 
    
    matchesFound++;
    
    if (gameMode === 'multiplayer') {
        currentPlayer === 1 ? player1Score++ : player2Score++;
        updatePlayerDisplay();
        messageElement.textContent = `Par encontrado! Jogador ${currentPlayer} pontua!`;
    } else {
        messageElement.textContent = `Par encontrado!`;
    }
    
    if (matchesFound === 4) {
        setTimeout(winGame, 1000);
    } else {
        resetBoard();
    }
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('face-up');
        secondCard.classList.remove('face-up');
        playSFX(sfxError); 
        resetBoard();
        switchPlayer(); // Troca de jogador se for multiplayer
    }, 1200); 
    createExplosion();
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
    messageElement.textContent = "Encontre o próximo par!";
}

// --- Lógica de Zoom ---

function handleZoom(card) {
    if (card.classList.contains('zoomed-card')) {
        handleZoomOff(card);
    } else {
        handleZoomOn(card);
    }
}
function handleZoomOn(card) {
    card.classList.add('zoomed-card');
    playSFX(sfxMove); 
    card.removeEventListener('click', flipCard);
    lockBoard = true;
    document.body.addEventListener('click', closeZoomGlobal);
}
function handleZoomOff(card) {
    card.classList.remove('zoomed-card');
    card.addEventListener('click', flipCard);
    lockBoard = false;
    document.body.removeEventListener('click', closeZoomGlobal);
}
function closeZoomGlobal(event) {
    const zoomedCard = document.querySelector('.zoomed-card');
    if (zoomedCard && !zoomedCard.contains(event.target)) {
        handleZoomOff(zoomedCard);
    }
}

// --- Lógica da Roleta ---

function showRoulette() {
    const rouletteContainer = document.getElementById('roulette-container');
    rouletteContainer.style.display = 'flex';
    
    const wheel = document.querySelector('.roulette-wheel');
    wheel.style.animation = 'none';
    setTimeout(() => {
        wheel.style.animation = 'spin 3s ease-out';
    }, 10);
    
    setTimeout(() => {
        const results = [
            { text: "🎉 Parabéns! +5 segundos de tempo extra!", action: () => addTimeBonus() },
            { text: "⭐ Incrível! Seu próximo par vale 2 pontos!", action: () => setDoublePoints() },
            { text: "🔄 Tente novamente! A sorte está do seu lado!", action: () => {} }
        ];
        
        const randomResult = results[Math.floor(Math.random() * results.length)];
        
        setTimeout(() => {
            messageElement.textContent = randomResult.text;
            randomResult.action();
            rouletteContainer.style.display = 'none';
        }, 500);
    }, 3000);
}

// --- Lógica de Início e Fim ---

function startGameLogic() {
    coverScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // Reinicializa o painel de desempenho
    document.getElementById('performance-panel').classList.remove('hidden');

    startNewGame();
}

function startNewGame() {
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    matchesFound = 0;
    currentPlayer = 1;
    player1Score = 0;
    player2Score = 0;
    totalAttempts = 0;
    correctMatches = 0;
    gameStartTime = Date.now();
    
    startGameTimer();
    
    createCards();
    updatePlayerDisplay();
    updatePerformanceDisplay();
    messageElement.textContent = gameMode === 'single' ? "Encontre o primeiro par!" : "Jogador 1 - Sua vez!";
    roundElement.textContent = "0";
}

function winGame() {
    messageElement.textContent = "🎉 PARABÉNS! Você encontrou todos os pares!";
    if (gameTimer) clearInterval(gameTimer);
    bgm.pause();
    endGame(true);
}

function setGameMode(mode, btn) {
    gameMode = mode;
    
    document.querySelectorAll('#game-mode-selector .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const playersPanel = document.getElementById('players-panel');
    playersPanel.classList.toggle('hidden', mode === 'single');
    
    startNewGame();
}

// --- Inicialização e Atribuição de Eventos ---

createCards();
const watchButton = document.getElementById('watch-video');
const skipButton = document.getElementById('skip-video');
watchButton.addEventListener('click', startVideo);
skipButton.addEventListener('click', skipVideoAndStartGame);

// Funções de Efeito (Mantidas aqui para evitar a duplicação no corpo principal do código)
function createCoinRain() { /* Implementação de Efeito */ }
function createExplosion() { /* Implementação de Efeito */ }
function addTimeBonus() { /* Implementação de Efeito da Roleta */ }
function setDoublePoints() { /* Implementação de Efeito da Roleta */ }
function startGameTimer() { /* Implementação de Efeito do Timer */ }
function endGame(won) { /* Implementação de Efeito de Fim de Jogo */ }

// ... (Resto do Código) ...