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

// 17种细分种类
const SUB_CATEGORIES = [
  '通常怪兽', '效果怪兽', '仪式怪兽', '融合怪兽', '同调怪兽', '超量怪兽', '灵摆怪兽', '连接怪兽',
  '通常魔法', '仪式魔法', '速攻魔法', '永续魔法', '装备魔法', '场地魔法',
  '通常陷阱', '永续陷阱', '反击陷阱'
];

// --- 状态 ---
const guessMode = ref('race'); 
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
  
  if (guessMode.value === 'subcategory') {
    if (types.includes('魔法')) {
      if (types.includes('仪式')) return '仪式魔法';
      if (types.includes('速攻')) return '速攻魔法';
      if (types.includes('永续')) return '永续魔法';
      if (types.includes('装备')) return '装备魔法';
      if (types.includes('场地')) return '场地魔法';
      return '通常魔法'; 
    }
    else if (types.includes('陷阱')) {
      if (types.includes('永续')) return '永续陷阱';
      if (types.includes('反击')) return '反击陷阱';
      return '通常陷阱'; 
    }
    else {
      if (types.includes('仪式')) return '仪式怪兽';
      if (types.includes('融合')) return '融合怪兽';
      if (types.includes('同调')) return '同调怪兽';
      if (types.includes('超量')) return '超量怪兽';
      if (types.includes('连接')) return '连接怪兽';

      if (types.includes('灵摆')) return '灵摆怪兽';

      if (types.includes('通常')) return '通常怪兽';
      
      return '效果怪兽'; 
    }
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
  const cardDataRaw = await (await fetch('cards.json')).json();
  const dataSource = cardDataRaw.default || cardDataRaw;
  const allCards = Object.values(dataSource);

  let filtered = [];
  
  if (guessMode.value === 'category' || guessMode.value === 'subcategory') {
    filtered = allCards;
  } else {
    filtered = allCards.filter(c => c.text && c.text.types && c.text.types.includes('怪兽'));
  }

  const shuffled = shuffleLogArray([...filtered]);
  return shuffled[0].slice(0, rows.value * cols.value);
};

// 组件内部的自动换行文本绘制函数
const drawTextWrapped = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split('  '); 
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
  let lineCount = 1; 

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + '  ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      line = words[n] + '  ';
      lineCount++; 
    } else {
      line = testLine;
    }
  }
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
    
    let optionsList = [];
    if (guessMode.value === 'race') optionsList = RACES;
    else if (guessMode.value === 'attribute') optionsList = ATTRIBUTES;
    else if (guessMode.value === 'category') optionsList = CATEGORIES;
    else if (guessMode.value === 'subcategory') optionsList = SUB_CATEGORIES;

    // 预加载图片
    const cardImages = await Promise.all(cards.map(async (card) => {
      const isPendulum = card.text.types.includes('灵摆');
      const suffix = isPendulum ? '!artp' : '!art'; 
      const originalUrl = `cdn.233.momobako.com/ygopro/pics/${card.id}.jpg${suffix}`;
      const url = `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&t=${new Date().getTime()}_${Math.random()}`;
      
      try {
        const img = await loadImage(url);
        return { 
          img, 
          isPendulum, 
          answer: getCardAnswer(card),
          // 新增：优先使用中文名，其次日文名
          name: card.cn_name || card.jp_name || '未知卡名'
        };
      } catch (e) {
        console.warn(`Failed to load image for card ${card.id}`, e);
        return null; 
      }
    }));

    setTimeout(() => {
      generated.value = true;
      setTimeout(() => {
        draw(canvasVisible.value, cardImages, optionsList, false);
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
  
  // 保持 KaiTi 字体
  const baseFont = 'KaiTi';
  const headerFontSize = 48;
  const optionFontSize = 28;
  const bracketFontSize = 28;
  const indexFontSize = 24;

  // 1. 计算画布尺寸
  let modeName = '';
  if (guessMode.value === 'race') modeName = '种族';
  else if (guessMode.value === 'attribute') modeName = '属性';
  else if (guessMode.value === 'category') modeName = '卡片种类';
  else if (guessMode.value === 'subcategory') modeName = '细分种类';

  const titleText = `看游戏王卡图猜${modeName}`;
  const headerHeight = 100;

  const optionStr = optionsList.map((opt, i) => `${i + 1}.${opt}`).join('  ');
  const gridWidth = (cardW * cols.value) + (gapX * (cols.value - 1));
  const minWidth = 800; 
  const totalWidth = Math.max(minWidth, gridWidth + margin * 2);
  const contentWidth = totalWidth - margin * 2;

  // 1. 字体设置
  ctx.font = `${optionFontSize}px ${baseFont}`;
  const lineHeight = optionFontSize + 15; 

  // 2. 计算选项区域高度
  const calculatedTextHeight = calculateTextHeight(ctx, optionStr, contentWidth, lineHeight);
  
  let hintHeight = 0;
  if (guessMode.value === 'subcategory') {
    hintHeight = 40; 
  }

  // 3. 计算总选项块高度
  const optionBlockHeight = calculatedTextHeight + 20 + hintHeight;

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
  ctx.textBaseline = 'alphabetic'; // 显式重置基线
  ctx.fillStyle = '#333';
  const optionsBottomY = drawTextWrapped(ctx, optionStr, margin, margin + headerHeight, contentWidth, optionFontSize + 15);

  // 绘制细分种类提示
  if (guessMode.value === 'subcategory') {
    ctx.fillStyle = '#666'; 
    ctx.font = `20px ${baseFont}`; 
    const hintText = "“通常怪兽”/“效果怪兽”是非额外非灵摆怪兽，“灵摆怪兽”是非额外怪兽。";
    ctx.fillText(hintText, margin, optionsBottomY + 10);
  }

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
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`#${i + 1}`, x + 5, y + cardH + 33);

    // 绘制括号和答案
    const centerX = x + cardW / 2 + 13;
    const bracketY = y + cardH + 33; 

    ctx.font = `${bracketFontSize}px ${baseFont}`;
    ctx.textAlign = 'center';
    
    if (showAnswer) {
      const index = optionsList.indexOf(item.answer);
      const indexText = index !== -1 ? `${index + 1}.` : '';
      ctx.fillText(`( ${indexText}${item.answer} )`, centerX, bracketY);

      // 绘制卡名覆盖层
      if (item.name) {
        ctx.save(); // 保存当前状态，防止影响下一次循环

        const nameFontSize = 24;
        // 必须先设置字体，measureText 才能准确计算
        ctx.font = `bold ${nameFontSize}px ${baseFont}`;
        
        let textWidth = ctx.measureText(item.name).width;
        const maxNameWidth = cardW - 10; // 左右留5px padding
        let actualFontSize = nameFontSize;
        
        // 自动缩放字体
        if (textWidth > maxNameWidth) {
           const ratio = maxNameWidth / textWidth;
           actualFontSize = Math.floor(nameFontSize * ratio);
           ctx.font = `bold ${actualFontSize}px ${baseFont}`; // 应用新字体大小
           textWidth = maxNameWidth;
        }

        const boxHeight = actualFontSize + 14; 
        const boxY = y + 256 - boxHeight; 
        
        // 绘制半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(x, boxY, cardW, boxHeight);

        // 绘制白色文字
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; 
        ctx.fillText(item.name, x + cardW / 2, boxY + boxHeight / 2);

        ctx.restore(); // 恢复状态
      }

    } else {
      ctx.fillText('(          )', centerX, bracketY);
    }
  }
  
  // 底部水印
  ctx.fillStyle = '#999';
  ctx.font = `14px ${baseFont}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
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
        <label><input type="radio" v-model="guessMode" value="category"> 卡片种类</label>
        <label><input type="radio" v-model="guessMode" value="subcategory"> 细分种类</label>
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
    <p>种族/属性/种类信息摘自：
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