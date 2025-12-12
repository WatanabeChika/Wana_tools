<script setup>
import { ref, onMounted } from 'vue';
import FontFaceObserver from 'font-face-observer';
import { loadImage, shuffleLogArray } from './utils';

// --- 常量定义 ---
const RACES = [
  '龙', '魔法师', '不死', '战士', '兽战士', '兽', '鸟兽', '恶魔', '天使', '昆虫',
  '恐龙', '爬虫类', '鱼', '海龙', '机械', '雷', '水', '炎', '岩石', '植物',
  '念动力', '幻龙', '电子界', '幻想魔', '幻神兽', '创造神'
];

const ATTRIBUTES = ['暗', '光', '地', '水', '炎', '风', '神'];
const CATEGORIES = ['怪兽', '魔法', '陷阱'];

// --- 状态 ---
const guessMode = ref('race'); // 'race' | 'attribute' | 'category'
const rows = ref(3);
const cols = ref(4);
const loading = ref(false);
const generated = ref(false);

const canvasVisible = ref(null); // 可见的画布（题目）
const canvasHidden = ref(null);  // 隐藏的画布（答案）
// 字体加载
const Font1 = new FontFaceObserver('KaiTi');

onMounted(async () => {
  await Promise.all([Font1.check()]);
});

// --- 核心逻辑 ---

// 解析单张卡的答案
const getCardAnswer = (card) => {
  if (!card || !card.text || !card.text.types) return '未知';
  const types = card.text.types;

  if (guessMode.value === 'category') {
    if (types.includes('魔法')) return '魔法';
    if (types.includes('陷阱')) return '陷阱';
    if (types.includes('怪兽')) return '怪兽';
    return '未知';
  } 
  
  const typeRegex = /](.*?)\/(.*?)(\n|$)/;
  const match = types.match(typeRegex);

  if (match) {
    const raceRaw = match[1].trim();     
    const attrRaw = match[2].trim();     

    if (guessMode.value === 'race') {
      const foundRace = RACES.find(r => raceRaw === r || raceRaw.includes(r));
      return foundRace || '未知';
    } else if (guessMode.value === 'attribute') {
      const foundAttr = ATTRIBUTES.find(a => attrRaw === a || attrRaw.includes(a));
      return foundAttr || '未知';
    }
  }

  if (guessMode.value === 'attribute') {
     const found = ATTRIBUTES.find(a => types.includes('/' + a) || types.includes('/ ' + a));
     return found || '未知';
  } else {
     const sortedRaces = [...RACES].sort((a, b) => b.length - a.length);
     const found = sortedRaces.find(r => types.includes(r));
     return found || '未知';
  }
};

// 获取符合条件的随机卡片
const getRandomCards = async () => {
  // 从 public/cards.json 中获取数据
  const cardDataRaw = await (await fetch('cards.json')).json();
  
  // 将字典对象转换为数组
  const allCards = Object.values(cardDataRaw);

  let filtered = [];
  if (guessMode.value === 'category') {
    filtered = allCards;
  } else {
    // 筛选怪兽卡
    filtered = allCards.filter(c => c.text && c.text.types && c.text.types.includes('怪兽'));
  }

  // 随机打乱
  const shuffled = shuffleLogArray([...filtered]);
  // 注意：此处保留您提供的逻辑 shuffled[0]
  return shuffled[0].slice(0, rows.value * cols.value);
};

// 组件内部的自动换行文本绘制函数
const drawTextWrapped = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split('  '); // 按双空格分割选项
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + '  ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + '  ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
};

// 精确计算文本高度
const calculateTextHeight = (ctx, text, maxWidth, lineHeight) => {
  const words = text.split('  ');
  let line = '';
  // 只需要计算行数
  let lineCount = 1; 

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + '  ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      line = words[n] + '  ';
      lineCount++; // 增加一行
    } else {
      line = testLine;
    }
  }
  // 返回总高度 = 行数 * 行高
  return lineCount * lineHeight;
};

// 生成流程
const handleGenerate = async () => {
  if (loading.value) return;
  loading.value = true;
  generated.value = false;

  try {
    const cards = await getRandomCards();
    if (cards.length === 0) {
        loading.value = false;
        alert("未找到数据");
        return;
    }
    
    const optionsList = guessMode.value === 'race' ? RACES : (guessMode.value === 'attribute' ? ATTRIBUTES : CATEGORIES);

    // 预加载图片
    const cardImages = await Promise.all(cards.map(async (card) => {
      const isPendulum = card.text.types.includes('灵摆');
      const suffix = isPendulum ? '!artp' : '!art'; 
      const originalUrl = `cdn.233.momobako.com/ygopro/pics/${card.id}.jpg${suffix}`;
      // 使用 wsrv.nl 代理解决 CORS 问题
      const url = `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}`;
      
      try {
        const img = await loadImage(url);
        return { 
          img, 
          isPendulum, 
          answer: getCardAnswer(card) 
        };
      } catch (e) {
        console.warn(`Failed to load image for card ${card.id}`, e);
        return null; 
      }
    }));

    // 绘制
    setTimeout(() => {
      generated.value = true;
      setTimeout(() => {
        // 可见画布：不显示答案
        draw(canvasVisible.value, cardImages, optionsList, false);
        // 隐藏画布：显示答案（用于下载）
        draw(canvasHidden.value, cardImages, optionsList, true);
        loading.value = false;
      }, 50);
    }, 0);

  } catch (error) {
    console.error(error);
    alert('生成过程中发生错误');
    loading.value = false;
  }
};

// 绘制主函数
const draw = (canvas, cardImages, optionsList, showAnswer) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // --- 布局参数 ---
  const margin = 40;
  const cardW = 256;
  const cardH = 256; 
  const gapX = 20;
  const gapY = 60; 
  
  // 字体统一改为 KaiTi
  const baseFont = 'KaiTi';
  const headerFontSize = 48;
  const optionFontSize = 28;
  const bracketFontSize = 32;
  const indexFontSize = 24;

  // 1. 计算画布尺寸
  const modeName = guessMode.value === 'race' ? '种族' : (guessMode.value === 'attribute' ? '属性' : '种类');
  const titleText = `看游戏王卡图猜${modeName}`;
  const headerHeight = 100;

  const optionStr = optionsList.map((opt, i) => `${i + 1}.${opt}`).join('  ');
  const gridWidth = (cardW * cols.value) + (gapX * (cols.value - 1));
  const minWidth = 800; 
  const totalWidth = Math.max(minWidth, gridWidth + margin * 2);
  const contentWidth = totalWidth - margin * 2;

  // 1. 设置字体，确保测量准确
  ctx.font = `${optionFontSize}px ${baseFont}`;
  const lineHeight = optionFontSize + 15; // 定义行高

  // 2. 使用新函数准确计算选项区域所需高度
  // 以前是估算： const estLines = Math.ceil(measure.width / contentWidth);
  const calculatedTextHeight = calculateTextHeight(ctx, optionStr, contentWidth, lineHeight);
  
  // 3. 加上一些上下边距 (padding)
  const optionBlockHeight = calculatedTextHeight + 20;

  const gridStartY = margin + headerHeight + optionBlockHeight;
  const totalHeight = gridStartY + rows.value * (cardH + gapY) + margin;

  // 2. 设置画布
  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // 3. 绘制背景 (纯白)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // 4. 绘制标题
  ctx.fillStyle = 'black';
  ctx.font = `bold ${headerFontSize}px ${baseFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(titleText, totalWidth / 2, margin);

  // 5. 绘制选项列表
  ctx.font = `${optionFontSize}px ${baseFont}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#333';
  drawTextWrapped(ctx, optionStr, margin, margin + headerHeight, contentWidth, optionFontSize + 15);

  // 6. 绘制卡图矩阵
  const actualGridWidth = cols.value * cardW + (cols.value - 1) * gapX;
  const startX = (totalWidth - actualGridWidth) / 2;

  for (let i = 0; i < cardImages.length; i++) {
    const item = cardImages[i];
    if (!item) continue; 

    const r = Math.floor(i / cols.value);
    const c = i % cols.value;

    const x = startX + c * (cardW + gapX);
    const y = gridStartY + r * (cardH + gapY);

    // 绘制卡图
    if (item.isPendulum) {
      const offset = (256 - 216) / 2;
      ctx.drawImage(item.img, x, y + offset, 256, 216);
    } else {
      ctx.drawImage(item.img, x, y, 256, 256);
    }

    // 描边框
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 256, 256);

    // 绘制编号
    ctx.font = `bold ${indexFontSize}px ${baseFont}`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.fillText(`#${i + 1}`, x + 5, y + cardH + 15);

    // 绘制括号和答案
    const centerX = x + cardW / 2 + 10;
    const bracketY = y + cardH + 10; 

    ctx.font = `${bracketFontSize}px ${baseFont}`;
    ctx.textAlign = 'center';
    
    if (showAnswer) {
      const index = optionsList.indexOf(item.answer);
      const indexText = index !== -1 ? `${index + 1}.` : '';
      ctx.fillText(`( ${indexText}${item.answer} )`, centerX, bracketY);
    } else {
      ctx.fillText('(          )', centerX, bracketY);
    }
  }
  
  // 底部水印
  ctx.fillStyle = '#999';
  ctx.font = `14px ${baseFont}`;
  ctx.textAlign = 'right';
  ctx.fillText('Created by Wanakachi', totalWidth - 10, totalHeight - 18);
};

// 下载功能
const download = (isAnswer) => {
    const canvas = isAnswer ? canvasHidden.value : canvasVisible.value;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = isAnswer ? `游戏王卡图猜猜杯_答案.png` : `游戏王卡图猜猜杯_题目.png`;
    link.click();
}

</script>


<template>
  <h1>游戏王卡图猜猜杯制作器</h1>
  <div id="input-container">
    <div id="modes-settings">
      <span id="matching-hint">主题选择: </span>
      <div class="radio-group">
        <label><input type="radio" v-model="guessMode" value="race"> 种族</label>
        <label><input type="radio" v-model="guessMode" value="attribute"> 属性</label>
        <label><input type="radio" v-model="guessMode" value="category"> 种类</label>
      </div>
    </div>

    <div id="modes-settings">
      <span id="matching-hint">矩阵大小: </span>
      <div>
        <input type="number" v-model.number="rows" min="1" max="10" class="num-input"> 行
        ×
        <input type="number" v-model.number="cols" min="1" max="10" class="num-input"> 列
      </div>
    </div>

    <div id="button-container">
      <button @click="handleGenerate" :disabled="loading" class="btns primary-btn">
        {{ loading ? '生成中...' : '绘制图片' }}
      </button>
      <button @click="download(false)" :disabled="!generated" class="btns download-btn">下载图片</button>
      <button @click="download(true)" :disabled="!generated" class="btns download-btn">下载答案</button>
    </div>
  </div>

  <div id="canvas-container">
    <canvas ref="canvasVisible" v-if="generated"></canvas>
    <canvas ref="canvasHidden" style="display: none;"></canvas>
  </div>

  <div id="notice">
    <p>注意：数据更新至 2025.12.11。</p>
    <p>图片及数据来源：
      <a href="https://ygocdb.com">百鸽</a>
    </p>
    <p>种族/属性信息摘自：
      <a href="https://zh.wikipedia.org/wiki/%E9%81%8A%E6%88%B2%E7%8E%8B%E9%9B%86%E6%8F%9B%E7%B4%99%E7%89%8C%E9%81%8A%E6%88%B2">游戏王中文维基</a>
    </p>
  </div>
</template>


<style scoped>
h1 {
  font-family: sans-serif;
  color: #333;
  text-align: center;
  margin-bottom: 50px;
}

label {
  display: inline-block;
  margin-bottom: 10px;
  margin-left: 10px;
  font-weight: 500;
  cursor: pointer;
}

input[type="radio"] {
  display: inline-block;
  margin-right: 5px;
}

.radio-group label {
  margin-right: 10px;
}

.num-input {
  width: 50px;
  padding: 5px;
  margin-bottom: 10px;
  margin-left: 5px;
  margin-right: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  flex: 0 0 auto;
  color: #fff;
  padding: 9px 13px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.primary-btn { background-color: cornflowerblue; }
.download-btn { background-color: #28a745; }

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

p {
  font-family: sans-serif;
  color: rgba(128,128,128,0.75);
  text-align: left;
}

#input-container {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

#modes-settings {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
  align-items: center;
}

#matching-hint {
  margin-right: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

#button-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 20px;
  margin-bottom: 30px;
}

#canvas-container {
  position: relative;
  margin-bottom: 20px;
  width: 100%;
  text-align: center;
}

canvas {
  border: 1px solid #eee;
  max-width: 100%;
  height: auto;
}

#notice {
  width: 100%;
  text-align: left;
  margin-top: 30px;
  font-size: 12px;
}
</style>