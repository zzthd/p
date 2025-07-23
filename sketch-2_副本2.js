let mic;
let vol = 0;

let firstImages = [];
let guessImages = [];
let endImages = [];

let state = 'idle'; // 可为 'idle'（待机）| 'guess'（主图）| 'end'（结尾）
let idleIndex = 0;
let endIndex = 0;
let lastFrameTime = 0;
let currentGuessIndex = 0;

const idleSpeed = 150; // 每帧间隔 ms
const endSpeed = 150;
const micThreshold = 0.03;
const activeThreshold = 3;
let activeCount = 0;
let idleToEndTimer = 0;
const idleToEndDelay = 1000; // 停止吹气后 1 秒触发结束动画

function preload() {
  for (let i = 1; i <= 19; i++) {
    let filename = `first-${String(i).padStart(2, '0')}.png`;
    firstImages.push(loadImage(filename));
  }
  for (let i = 1; i <= 15; i++) {
    let filename = `guess-${String(i).padStart(2, '0')}.png`;
    guessImages.push(loadImage(filename));
  }
  for (let i = 1; i <= 9; i++) {
    let filename = `end-${String(i).padStart(2, '0')}.png`;
    endImages.push(loadImage(filename));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  mic = new p5.AudioIn();
  mic.start();
  imageMode(CENTER);
  frameRate(30);
}

function draw() {
  background(255);
  vol = mic.getLevel();

  // 检测持续吹气
  if (vol > micThreshold) {
    activeCount++;
    idleToEndTimer = millis(); // 重置不吹气计时器
  } else {
    activeCount = 0;
  }

  const now = millis();

  // ================== 状态控制 ==================
  if (state === 'idle') {
    if (now - lastFrameTime > idleSpeed) {
      idleIndex = (idleIndex + 1) % firstImages.length;
      lastFrameTime = now;
    }

    if (activeCount >= activeThreshold) {
      state = 'guess';
    }
  }

  else if (state === 'guess') {
    // 计算当前音量对应的 guess 图索引
    let guessIndex = floor(map(vol, 0.01, 0.3, 0, 14, true));
    currentGuessIndex = guessIndex;

    // 若 1 秒内没吹，切到 end 动画
    if (now - idleToEndTimer > idleToEndDelay) {
      state = 'end';
      endIndex = 0;
      lastFrameTime = now;
    }
  }

  else if (state === 'end') {
    if (now - lastFrameTime > endSpeed) {
      endIndex++;
      lastFrameTime = now;

      if (endIndex >= endImages.length) {
        state = 'idle';
        idleIndex = 0;
      }
    }
  }

  // ================== 显示图像 ==================
  let img;
  if (state === 'idle') {
    img = firstImages[idleIndex];
  } else if (state === 'guess') {
    img = guessImages[currentGuessIndex];
  } else if (state === 'end') {
    img = endImages[endIndex];
  }

  if (img && img.width > 0) {
    let scaleFactor = min(width / img.width, height / img.height) * 0.9;
    image(img, width / 2, height / 2, img.width * scaleFactor, img.height * scaleFactor);
  }
}
