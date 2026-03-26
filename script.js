const mario = document.getElementById('mario');
const pipe = document.getElementById('pipe');
const cloud = document.getElementById('cloud');
const gameOverEl = document.getElementById('gameOver');
const gameBoard = document.getElementById('gameBoard');
const restartBtn = document.getElementById('restartButton');

const soundJump = new Audio('assets/sounds/jump.mp3');
const soundCoin = new Audio('assets/sounds/coin.mp3');
const soundGameOver = new Audio('assets/sounds/gameover.mp3');
const soundBgMusic = new Audio('assets/sounds/music.mp3');
soundBgMusic.loop = true;
soundBgMusic.volume = 0.4;

function playJump() { soundJump.currentTime = 0; soundJump.play().catch(() => { }); }
function playCoin() { soundCoin.currentTime = 0; soundCoin.play().catch(() => { }); }
function playGameOver() { soundGameOver.currentTime = 0; soundGameOver.play().catch(() => { }); }
function startBgMusic() { soundBgMusic.play().catch(() => { }); }
function stopBgMusic() { soundBgMusic.pause(); soundBgMusic.currentTime = 0; }

let score = 0;
let coins = 0;
let gameStarted = false;
let isGameRunning = false;
let isJumping = false;
let mainLoop = null;
let coinSpawnInterval = null;
let activeCoin = null;

function updateHUD() {
    document.getElementById('coinCount').textContent = 'x ' + coins;
    document.getElementById('scoreCount').textContent = score;
}

function spawnCoin() {
    if (!isGameRunning || activeCoin) return;

    const coin = document.createElement('img');
    coin.src = 'assets/imgs/coin.gif';
    coin.className = 'coin';

    const boardW = gameBoard.offsetWidth;
    let posX = boardW * (0.65 + Math.random() * 0.25);
    coin.dataset.x = posX;
    gameBoard.appendChild(coin);
    activeCoin = coin;

    const speed = boardW / 150;

    const coinLoop = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(coinLoop);
            removeCoin(coin);
            return;
        }

        posX -= speed;
        coin.dataset.x = posX;
        coin.style.setProperty('--coin-x', posX + 'px');

        const marioRect = mario.getBoundingClientRect();
        const coinRect = coin.getBoundingClientRect();

        const hit = !(
            coinRect.right < marioRect.left + 20 ||
            coinRect.left > marioRect.right - 20 ||
            coinRect.bottom < marioRect.top + 15 ||
            coinRect.top > marioRect.bottom - 10
        );

        if (hit && !coin.classList.contains('collected')) {
            coin.classList.add('collected');
            playCoin();
            coins++;
            score += 10;
            updateHUD();
            spawnScorePopup(coin);
            clearInterval(coinLoop);
            setTimeout(() => removeCoin(coin), 300);
            return;
        }

        if (posX < -70) {
            clearInterval(coinLoop);
            removeCoin(coin);
        }
    }, 10);
}

function removeCoin(coin) {
    if (coin.parentNode) coin.parentNode.removeChild(coin);
    if (activeCoin === coin) activeCoin = null;
}

function spawnScorePopup(coin) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+10';
    const coinRect = coin.getBoundingClientRect();
    const boardRect = gameBoard.getBoundingClientRect();
    popup.style.setProperty('--popup-x', (coinRect.left - boardRect.left + 10) + 'px');
    popup.style.setProperty('--popup-y', Math.max(10, coinRect.top - boardRect.top - 10) + 'px');
    gameBoard.appendChild(popup);
    setTimeout(() => { if (popup.parentNode) popup.parentNode.removeChild(popup); }, 800);
}

function jump() {
    if (!gameStarted) {
        gameStarted = true;
        startLoop();
        startBgMusic();
    }
    if (isJumping) return;
    isJumping = true;
    playJump();
    mario.classList.add('jump');
    setTimeout(() => {
        mario.classList.remove('jump');
        isJumping = false;
    }, 500);
}

function startLoop() {
    isGameRunning = true;
    coinSpawnInterval = setInterval(spawnCoin, 2500 + Math.random() * 2000);
    mainLoop = setInterval(() => {
        const marioRect = mario.getBoundingClientRect();
        const pipeRect = pipe.getBoundingClientRect();
        const margin = 18;

        const hit = !(
            marioRect.right - margin < pipeRect.left + margin ||
            marioRect.left + margin > pipeRect.right - margin ||
            marioRect.bottom - margin < pipeRect.top ||
            marioRect.top > pipeRect.bottom
        );

        if (hit) {
            triggerGameOver();
            return;
        }

        score++;
        if (score % 10 === 0) updateHUD();
    }, 10);
}

function stopLoop() {
    isGameRunning = false;
    clearInterval(mainLoop);
    clearInterval(coinSpawnInterval);
    mainLoop = null;
    coinSpawnInterval = null;
}

function triggerGameOver() {
    stopLoop();
    stopBgMusic();
    playGameOver();

    pipe.classList.add('frozen');
    mario.classList.add('dead');
    mario.classList.remove('jump');

    if (activeCoin) removeCoin(activeCoin);
    document.querySelectorAll('.score-popup').forEach(p => p.remove());

    document.getElementById('finalScore').textContent = 'PONTOS: ' + score;
    document.getElementById('finalCoins').textContent = 'MOEDAS: ' + coins;
    gameOverEl.classList.add('visible');
}

function restart() {
    gameOverEl.classList.remove('visible');

    score = 0;
    coins = 0;
    gameStarted = false;
    isJumping = false;
    updateHUD();

    pipe.classList.remove('frozen');
    mario.classList.remove('dead', 'jump');

    document.querySelectorAll('.coin').forEach(c => c.remove());
    document.querySelectorAll('.score-popup').forEach(p => p.remove());
    activeCoin = null;
}

updateHUD();

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
});

document.addEventListener('touchstart', (e) => {
    if (e.target === restartBtn) return;
    jump();
}, { passive: true });

restartBtn.addEventListener('click', restart);
