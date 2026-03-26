const mario = document.getElementById('mario');
const pipe = document.getElementById('pipe');
const cloud = document.getElementById('cloud');
const gameOver = document.getElementById('gameOver');
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
let isGameRunning = false;
let mainLoop = null;
let coinSpawnInterval = null;
let activeCoin = null;
let firstInteraction = false;

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
    coin.style.left = posX + 'px';

    gameBoard.appendChild(coin);
    activeCoin = coin;

    const speed = boardW / 150;

    const coinLoop = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(coinLoop);
            if (coin.parentNode) coin.parentNode.removeChild(coin);
            if (activeCoin === coin) activeCoin = null;
            return;
        }

        posX -= speed;
        coin.style.left = posX + 'px';

        const marioRect = mario.getBoundingClientRect();
        const coinRect = coin.getBoundingClientRect();

        const overlap = !(
            coinRect.right < marioRect.left + 20 ||
            coinRect.left > marioRect.right - 20 ||
            coinRect.bottom < marioRect.top + 15 ||
            coinRect.top > marioRect.bottom - 10
        );

        if (overlap && !coin.classList.contains('collected')) {
            coin.classList.add('collected');
            playCoin();
            coins++;
            score += 10;
            updateHUD();

            const boardRect = gameBoard.getBoundingClientRect();
            showScorePopup(coinRect.left - boardRect.left, coinRect.top - boardRect.top);

            clearInterval(coinLoop);
            setTimeout(() => {
                if (coin.parentNode) coin.parentNode.removeChild(coin);
                if (activeCoin === coin) activeCoin = null;
            }, 350);
            return;
        }

        if (posX < -70) {
            clearInterval(coinLoop);
            if (coin.parentNode) coin.parentNode.removeChild(coin);
            if (activeCoin === coin) activeCoin = null;
        }
    }, 10);
}

function showScorePopup(x, y) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+10';
    popup.style.left = (x + 10) + 'px';
    popup.style.top = Math.max(10, y - 10) + 'px';
    gameBoard.appendChild(popup);
    setTimeout(() => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 800);
}

const jump = () => {
    if (!firstInteraction) {
        firstInteraction = true;
        startBgMusic();
    }
    if (mario.classList.contains('jump')) return;
    playJump();
    mario.classList.add('jump');
    setTimeout(() => mario.classList.remove('jump'), 500);
};

function startLoop() {
    isGameRunning = true;

    coinSpawnInterval = setInterval(() => {
        spawnCoin();
    }, 2500 + Math.random() * 2000);

    mainLoop = setInterval(() => {
        const pipePosition = pipe.offsetLeft;
        const marioBottom = +window.getComputedStyle(mario).bottom.replace('px', '');

        if (pipePosition <= 95 && pipePosition > 0 && marioBottom < 55) {
            triggerGameOver(pipePosition, marioBottom);
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

function triggerGameOver(pipePos, marioBottom) {
    stopLoop();
    stopBgMusic();
    playGameOver();

    pipe.style.animation = 'none';
    pipe.style.left = pipePos + 'px';

    mario.style.animation = 'none';
    mario.style.bottom = marioBottom + 'px';
    mario.src = 'assets/imgs/game-over.png';
    mario.style.width = '75px';
    mario.style.marginLeft = '30px';

    if (activeCoin && activeCoin.parentNode) {
        activeCoin.parentNode.removeChild(activeCoin);
        activeCoin = null;
    }

    document.querySelectorAll('.score-popup').forEach(p => p.remove());

    document.getElementById('finalScore').textContent = 'PONTOS: ' + score;
    document.getElementById('finalCoins').textContent = 'MOEDAS: ' + coins;
    gameOver.style.visibility = 'visible';
}

function restart() {
    gameOver.style.visibility = 'hidden';

    score = 0;
    coins = 0;
    updateHUD();

    pipe.style.animation = 'pipe-animations 1.5s infinite linear';
    pipe.style.left = '';

    mario.src = 'assets/imgs/mario.gif';
    mario.style.width = '130px';
    mario.style.bottom = '0px';
    mario.style.marginLeft = '';
    mario.style.animation = '';

    cloud.style.left = '';

    document.querySelectorAll('.coin').forEach(c => c.remove());
    document.querySelectorAll('.score-popup').forEach(p => p.remove());
    activeCoin = null;

    startBgMusic();
    startLoop();
}

startLoop();
updateHUD();

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
});
document.addEventListener('touchstart', jump, { passive: true });
restartBtn.addEventListener('click', restart);
