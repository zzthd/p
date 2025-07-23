// --- 全局变量 ---
let mic;
let vol = 0;
let smoothedVol = 0; // 用于平滑处理音量，减少抖动

// 存放三组动画的数组
let firstImages = []; // 开头待机动画
let guessImages = []; // 主交互动画（帘子）
let endImages = [];   // 结尾动画

// --- 新增：加载状态诊断变量 ---
let loadedCount = 0;
let totalImages = 19 + 15 + 9; // 所有图片的总数
let loadError = false; // 标记是否加载出错
let failedFiles = []; // 记录加载失败的文件名

// --- 状态控制变量 ---
let state = "intro"; // 可选状态: "intro", "main", "end"
let currentFrame = 0;
let lastFrameTime = 0;

// --- 动画速度控制 (数值越大，播放越慢) ---
const introFrameSpeed = 200; // 开头动画速度
const endFrameSpeed = 120;   // 结尾动画速度

// --- 麦克风灵敏度控制 ---
const micThreshold = 0.03;      // 判定交互开始的最低音量
const maxBlowVolume = 0.5;      // 吹气要达到这个音量才能把帘子吹到最高

function preload() {
  // 定义一个统一的加载函数，用于诊断错误
  const loadImageWithCallback = (path) => {
    return loadImage(path, 
      () => { loadedCount++; }, // 成功时，计数器+1
      () => { 
        loadError = true; 
        failedFiles.push(path); // 记录失败的文件名
        console.error(`错误：图片 "${path}" 加载失败！请仔细检查文件名和大小写。`); 
      }
    );
  };

  // 加载开头动画
  for (let i = 1; i <= 19; i++) {
    let filename = `first-${String(i).padStart(2, '0')}.png`;
    firstImages.push(loadImageWithCallback(filename));
  }

  // 加载主交互动画（帘子）
  for (let i = 1; i <= 15; i++) {
    let filename = `guess-${String(i).padStart(2, '0')}.png`;
    guessImages.push(loadImageWithCallback(filename));
  }

  // 加载结尾动画
  for (let i = 1; i <= 9; i++) {
    let filename = `end-${String(i).padStart(2, '0')}.png`;
    endImages.push(loadImageWithCallback(filename));
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  mic = new p5.AudioIn();
  mic.start();
  imageMode(CENTER);
}

function draw() {
  // 在所有图片加载完成前，一直显示加载画面
  if (loadedCount < totalImages) {
    background(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    
    if (loadError) {
      fill(255, 0, 0);
      // 在屏幕上明确指出错误
      text(`图片加载失败！\n请检查以下文件是否存在并且文件名正确：\n${failedFiles.join('\n')}`, width / 2, height / 2);
      noLoop(); // 出错了就停止
    } else {
      fill(0);
      text(`正在加载图片... (${loadedCount} / ${totalImages})`, width / 2, height / 2);
    }
    return; // 在加载完成前，不执行下面的交互代码
  }
  
  // --- 主程序逻辑 ---
  background(255);
  vol = mic.getLevel();
  smoothedVol = lerp(smoothedVol, vol, 0.2);
  let now = millis();

  if (state === "intro") {
    if (now - lastFrameTime > introFrameSpeed) {
      currentFrame = (currentFrame + 1) % firstImages.length;
      lastFrameTime = now;
    }
    showImage(firstImages[currentFrame]);

    if (smoothedVol > micThreshold) {
      state = "main";
      currentFrame = 0;
    }
  } 
  else if (state === "main") {
    let frameIndex = map(smoothedVol, micThreshold, maxBlowVolume, 0, guessImages.length - 1, true);
    currentFrame = floor(frameIndex);
    showImage(guessImages[currentFrame]);

    if (currentFrame >= guessImages.length - 1) {
      state = "end";
      currentFrame = 0;
      lastFrameTime = now;
    }
    
    if (smoothedVol < micThreshold) {
      state = "intro";
      currentFrame = 0;
    }
  } 
  else if (state === "end") {
    if (now - lastFrameTime > endFrameSpeed) {
      currentFrame++;
      lastFrameTime = now;
    }
    
    if (currentFrame >= endImages.length) {
      state = "intro";
      currentFrame = 0;
    } else {
      showImage(endImages[currentFrame]);
    }
  }
}

// 统一的图像显示函数
function showImage(img) {
  if (img && img.width > 0) {
    let scaleFactor = min(width / img.width, height / img.height);
    let w = img.width * scaleFactor;
    let h = img.height * scaleFactor;
    image(img, width / 2, height / 2, w, h);
  }
}
