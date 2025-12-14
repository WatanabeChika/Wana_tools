<script setup>
import { ref, onMounted, watch, computed } from 'vue';
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

const SUB_CATEGORIES = [
  '通常怪兽', '效果怪兽', '仪式怪兽', '融合怪兽', '同调怪兽', '超量怪兽', '灵摆怪兽', '连接怪兽',
  '通常魔法', '仪式魔法', '速攻魔法', '永续魔法', '装备魔法', '场地魔法',
  '通常陷阱', '永续陷阱', '反击陷阱'
];

// --- 状态 ---
const quizMode = ref('fill'); // 'fill' | 'judge'
const guessMode = ref('race'); 
const rows = ref(3);
const cols = ref(4);
const useCommonCards = ref(false); 

// 判断题专用配置
const judgeTarget = ref(''); 
const judgeQuantity = ref(1); // 数量，默认为1
const judgeInvert = ref(false); // 是否反选（找“不是”的）

const loading = ref(false);
const dataLoading = ref(true);
const generated = ref(false);

const canvasVisible = ref(null); 
const canvasHidden = ref(null);  

let poolAll = [];
let commonCardIds = new Set();

// 监听 guessMode 变化，自动重置 judgeTarget
watch(guessMode, (newMode) => {
  if (newMode === 'race') judgeTarget.value = RACES[0];
  else if (newMode === 'attribute') judgeTarget.value = ATTRIBUTES[0];
  else if (newMode === 'category') judgeTarget.value = CATEGORIES[0];
  else if (newMode === 'subcategory') judgeTarget.value = SUB_CATEGORIES[0];
});

// 监听行列变化，确保 judgeQuantity 不越界
watch([rows, cols], ([newRows, newCols]) => {
  const max = newRows * newCols - 1;
  if (judgeQuantity.value > max) judgeQuantity.value = Math.max(1, max);
});

// 计算当前模式下的可用选项列表
const currentOptionsList = computed(() => {
  if (guessMode.value === 'race') return RACES;
  if (guessMode.value === 'attribute') return ATTRIBUTES;
  if (guessMode.value === 'category') return CATEGORIES;
  if (guessMode.value === 'subcategory') return SUB_CATEGORIES;
  return [];
});

const Font1 = new FontFaceObserver('KaiTi');
onMounted(async () => {
  const fontPromise = Font1.check();
  
  const dataPromise = fetch('cards/cards.json')
    .then(res => res.json())
    .then(raw => {
      const dataSource = raw.default || raw;
      poolAll = Object.values(dataSource);
    });

  const commonDataPromise = fetch('cards/common_cards.json')
    .then(res => res.json())
    .then(data => {
      const ids = data.default || data;
      commonCardIds = new Set(ids.map(id => Number(id)));
    })
    .catch(() => null);

  try {
    await Promise.all([fontPromise, dataPromise, commonDataPromise]);
    judgeTarget.value = RACES[0]; 
    dataLoading.value = false;
  } catch (err) {
    console.error("初始化失败", err);
    alert("数据加载发生错误，请刷新重试");
  }
});

// --- 核心逻辑 ---
const checkCardMatch = (card, target) => {
  if (!card || !card.text || !card.text.types) return false;
  const types = card.text.types;
  const mode = guessMode.value;

  if (mode === 'category') {
    if (target === '怪兽') return types.includes('怪兽');
    if (target === '魔法') return types.includes('魔法');
    if (target === '陷阱') return types.includes('陷阱');
  } 
  else if (mode === 'subcategory') {
    if (target === '通常怪兽') return types.includes('通常') && types.includes('怪兽');
    if (target === '效果怪兽') return !types.includes('通常') && types.includes('怪兽') && !types.includes('仪式') && !types.includes('融合') && !types.includes('同调') && !types.includes('超量') && !types.includes('连接') && !types.includes('灵摆');
    const keyword = target.replace('怪兽', '').replace('魔法', '').replace('陷阱', '');
    if (target === '通常魔法') return types.includes('魔法') && !['仪式','速攻','永续','装备','场地'].some(t => types.includes(t));
    if (target === '通常陷阱') return types.includes('陷阱') && !['永续','反击'].some(t => types.includes(t));
    return types.includes(keyword);
  }
  else if (mode === 'race') {
     // 种族匹配：必须精确匹配提取出的字段，防止"兽战士"包含"战士"，"海龙"包含"龙"
     const typeRegex = /](.*?)\/(.*?)(\n|$)/;
     const match = types.match(typeRegex);
     if (match) {
         const raceRaw = match[1].trim();
         return raceRaw === target;
     }
     // 兜底逻辑：如果正则失败，严格限制边界（虽然后面的 fallback 很少用到）
     return false; 
  }
  else if (mode === 'attribute') {
     const typeRegex = /](.*?)\/(.*?)(\n|$)/;
     const match = types.match(typeRegex);
     if (match) return match[2].trim() === target; // 属性也建议精确匹配
     return types.includes(target);
  }
  return false;
};

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
      // 优先：精确全等匹配 (解决 海龙 vs 龙 的问题)
      const exactRace = RACES.find(r => raceRaw === r);
      if (exactRace) return exactRace;

      // 兜底：按长度降序排列后包含匹配 (解决 兽战士 vs 战士 的问题)
      const sortedRaces = [...RACES].sort((a, b) => b.length - a.length);
      const foundRace = sortedRaces.find(r => raceRaw.includes(r));
      return foundRace || '未知';
    } 
    else if (guessMode.value === 'attribute') {
      const foundAttr = ATTRIBUTES.find(a => attrRaw === a || attrRaw.includes(a));
      return foundAttr || '未知';
    }
  }

  if (guessMode.value === 'attribute') {
     const found = ATTRIBUTES.find(a => types.includes('/' + a) || types.includes('/ ' + a));
     return found || '未知';
  } else {
     // 兜底逻辑同样需要按长度排序
     const sortedRaces = [...RACES].sort((a, b) => b.length - a.length);
     const found = sortedRaces.find(r => types.includes(r));
     return found || '未知';
  }
};

const getRandomCards = async () => {
  if (dataLoading.value) {
    alert("数据正在初始化，请稍后再试...");
    return [];
  }

  let sourcePool = poolAll;

  // 0. 基础过滤
  if (guessMode.value === 'race' || guessMode.value === 'attribute') {
    sourcePool = sourcePool.filter(c => c.text && c.text.types && c.text.types.includes('怪兽'));
  }

  // 1. 常用卡过滤
  if (useCommonCards.value) {
    sourcePool = sourcePool.filter(c => commonCardIds.has(Number(c.id)));
  }

  const totalSlots = rows.value * cols.value;

  // --- 逻辑分支：填空题 ---
  if (quizMode.value === 'fill') {
    const shuffled = shuffleLogArray([...sourcePool], false);
    return shuffled.slice(0, rows.value * cols.value);
  }

  // --- 逻辑分支：判断题 ---
  else {
    const target = judgeTarget.value;
    const countNeeded = Math.min(Math.max(1, judgeQuantity.value), totalSlots - 1);
    const isInvert = judgeInvert.value;

    const groupMatch = sourcePool.filter(c => checkCardMatch(c, target));
    const groupNonMatch = sourcePool.filter(c => !checkCardMatch(c, target));

    let cardsMatchNeeded = 0;
    let cardsNonMatchNeeded = 0;

    if (!isInvert) {
      // 找 "符合条件" 的 N 个 -> 需要 N 个 Match，(Total-N) 个 NonMatch
      cardsMatchNeeded = countNeeded;
      cardsNonMatchNeeded = totalSlots - countNeeded;
    } else {
      // 找 "不符合条件" 的 N 个 -> 需要 N 个 NonMatch, (Total-N) 个 Match
      cardsNonMatchNeeded = countNeeded;
      cardsMatchNeeded = totalSlots - countNeeded;
    }

    if (groupMatch.length < cardsMatchNeeded || groupNonMatch.length < cardsNonMatchNeeded) {
      alert(`卡池数量不足。\n需要符合卡：${cardsMatchNeeded}张 (现有${groupMatch.length})\n需要干扰卡：${cardsNonMatchNeeded}张 (现有${groupNonMatch.length})`);
      return [];
    }

    const pMatch = shuffleLogArray([...groupMatch], false);
    const pNonMatch = shuffleLogArray([...groupNonMatch], false);

    const selection = [
      ...pMatch.slice(0, cardsMatchNeeded),
      ...pNonMatch.slice(0, cardsNonMatchNeeded)
    ];

    return shuffleLogArray(selection, false);
  }
};

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

const handleGenerate = async () => {
  if (loading.value) return;
  loading.value = true;
  generated.value = false;

  try {
    const cards = await getRandomCards();
    if (cards.length === 0) {
        loading.value = false;
        if (useCommonCards.value) alert("未找到符合条件的常用卡数据");
        else alert("未找到数据");
        return;
    }
    
    const cardImages = await Promise.all(cards.map(async (card) => {
      const isPendulum = card.text.types.includes('灵摆');
      const suffix = isPendulum ? '!artp' : '!art'; 
      const originalUrl = `cdn.233.momobako.com/ygopro/pics/${card.id}.jpg${suffix}`;
      const url = `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&t=${new Date().getTime()}_${Math.random()}`;
      
      try {
        const img = await loadImage(url);
        // 计算该卡是否符合筛选条件
        const isMatchTarget = checkCardMatch(card, judgeTarget.value);
        
        return { 
          img, 
          isPendulum, 
          answer: getCardAnswer(card),
          isMatchTarget, // 是否符合当前目标（用于判断题逻辑）
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
        draw(canvasVisible.value, cardImages, false);
        draw(canvasHidden.value, cardImages, true);
        loading.value = false;
      }, 50);
    }, 0);

  } catch (error) {
    console.error(error);
    alert('生成过程中发生错误');
    loading.value = false;
  }
};

const draw = (canvas, cardImages, showAnswer) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const margin = 40;
  const cardW = 256;
  const cardH = 256; 
  const gapX = 20;
  const gapY = 60; 
  
  const baseFont = 'KaiTi';
  const headerFontSize = 48;
  const optionFontSize = 28;
  const bracketFontSize = 28;
  const indexFontSize = 24;

  let titleText = "";
  let optionStr = "";
  let optionBlockHeight = 0;

  // 根据模式生成标题
  if (quizMode.value === 'fill') {
    let modeName = '';
    if (guessMode.value === 'race') modeName = '种族';
    else if (guessMode.value === 'attribute') modeName = '属性';
    else if (guessMode.value === 'category') modeName = '卡片种类';
    else if (guessMode.value === 'subcategory') modeName = '细分种类';
    titleText = `看游戏王卡图猜${modeName}`;
    
    optionStr = currentOptionsList.value.map((opt, i) => `${i + 1}.${opt}`).join('  ');
  } 
  else {
    // 判断题标题
    const count = judgeQuantity.value;
    const invert = judgeInvert.value;
    
    let prefix = "";
    if (count === 1) {
      prefix = invert ? "唯一一个非" : "唯一一个";
    } else {
      prefix = invert ? `所有非` : `所有`;
    }
    
    let targetSuffix = "";
    if (guessMode.value === 'race') targetSuffix = `${judgeTarget.value}族的怪兽`;
    else if (guessMode.value === 'attribute') targetSuffix = `${judgeTarget.value}属性的怪兽`;
    else if (guessMode.value === 'category') targetSuffix = `${judgeTarget.value}卡`; 
    else if (guessMode.value === 'subcategory') targetSuffix = `${judgeTarget.value}卡`;

    titleText = `看游戏王卡图找出${prefix}${targetSuffix}`;
    optionStr = ""; 
  }

  const headerHeight = 100;

  // 1. 预先测量标题宽度
  ctx.font = `bold ${headerFontSize}px ${baseFont}`;
  const titleWidth = ctx.measureText(titleText).width;

  const gridWidth = (cardW * cols.value) + (gapX * (cols.value - 1));
  const minWidth = 800; 
  
  // 2. 计算总宽度：取 预设最小宽、矩阵所需宽、标题所需宽 中的最大值
  const totalWidth = Math.max(minWidth, gridWidth + margin * 2, titleWidth + margin * 2);
  const contentWidth = totalWidth - margin * 2;

  if (quizMode.value === 'fill') {
    ctx.font = `${optionFontSize}px ${baseFont}`;
    const lineHeight = optionFontSize + 15; 
    const calculatedTextHeight = calculateTextHeight(ctx, optionStr, contentWidth, lineHeight);
    
    let hintHeight = 0;
    if (guessMode.value === 'subcategory') hintHeight = 40; 
    optionBlockHeight = calculatedTextHeight + hintHeight;
  } else {
    optionBlockHeight = 0; 
    if (guessMode.value === 'subcategory') {
        optionBlockHeight += 40;
    }
  }

  const gridStartY = margin + headerHeight + optionBlockHeight;
  const totalHeight = gridStartY + rows.value * (cardH + gapY) + margin;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  ctx.fillStyle = 'black';
  ctx.font = `bold ${headerFontSize}px ${baseFont}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(titleText, totalWidth / 2, margin);

  if (quizMode.value === 'fill') {
    ctx.font = `${optionFontSize}px ${baseFont}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic'; 
    ctx.fillStyle = '#333';
    const optionsBottomY = drawTextWrapped(ctx, optionStr, margin, margin + headerHeight, contentWidth, optionFontSize + 15);

    if (guessMode.value === 'subcategory') {
      ctx.fillStyle = '#666'; 
      ctx.font = `20px ${baseFont}`; 
      const hintText = "“通常怪兽”/“效果怪兽”是非额外非灵摆怪兽，“灵摆怪兽”是非额外怪兽。";
      ctx.fillText(hintText, margin, optionsBottomY + 10);
    }
  }
  else if (guessMode.value === 'subcategory') {
      ctx.fillStyle = '#666'; 
      ctx.font = `20px ${baseFont}`; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      const hintText = "“通常怪兽”/“效果怪兽”是非额外非灵摆怪兽，“灵摆怪兽”是非额外怪兽。";
      ctx.fillText(hintText, totalWidth / 2, margin + headerHeight);
  }

  const actualGridWidth = cols.value * cardW + (cols.value - 1) * gapX;
  const startX = (totalWidth - actualGridWidth) / 2;

  for (let i = 0; i < cardImages.length; i++) {
    const item = cardImages[i];
    if (!item) continue; 

    const r = Math.floor(i / cols.value);
    const c = i % cols.value;

    const x = startX + c * (cardW + gapX);
    const y = gridStartY + r * (cardH + gapY);

    if (item.isPendulum) {
      const offset = (256 - 216) / 2;
      ctx.drawImage(item.img, x, y + offset, 256, 216);
    } else {
      ctx.drawImage(item.img, x, y, 256, 256);
    }

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 256, 256);

    // 分别处理填空题和判断题的文字绘制
    if (quizMode.value === 'fill') {
        // === 填空题模式：左侧编号，中间括号 ===
        
        // 1. 绘制左下角编号
        ctx.font = `bold ${indexFontSize}px ${baseFont}`;
        ctx.fillStyle = '#000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`#${i + 1}`, x + 5, y + cardH + 33);

        // 2. 绘制中间括号/答案
        const centerX = x + cardW / 2 + 13;
        const bracketY = y + cardH + 33; 

        ctx.font = `${bracketFontSize}px ${baseFont}`;
        ctx.textAlign = 'center';

        if (showAnswer) {
            const index = currentOptionsList.value.indexOf(item.answer);
            const indexText = index !== -1 ? `${index + 1}.` : '';
            ctx.fillText(`( ${indexText}${item.answer} )`, centerX, bracketY);
        } else {
            ctx.fillText('(          )', centerX, bracketY);
        }

    } else {
        // === 判断题模式：正下方居中 ===
        
        const centerX = x + cardW / 2;
        const textY = y + cardH + 33;

        ctx.font = `bold ${bracketFontSize}px ${baseFont}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        if (showAnswer) {
            // 答案模式：显示文字答案（带颜色/边框/遮罩）
            const invert = judgeInvert.value;
            const isTarget = item.isMatchTarget;
            const isCorrectAnswer = invert ? !isTarget : isTarget;

            if (isCorrectAnswer) {
                // 正确答案：红框 + 红字
                ctx.save();
                ctx.strokeStyle = '#dc3545'; 
                ctx.lineWidth = 6;
                ctx.strokeRect(x, y, 256, 256);
                ctx.restore();

                ctx.fillStyle = '#dc3545'; 
            } else {
                // 干扰项：遮罩 + 灰字
                ctx.save();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
                ctx.fillRect(x, y, 256, 256);
                ctx.restore();

                ctx.fillStyle = '#999';
            }
            
            // 直接显示答案，无括号，无编号
            ctx.fillText(item.answer, centerX, textY);
            ctx.fillStyle = 'black'; // 重置颜色

        } else {
            // 题目模式：只显示编号，无括号
            ctx.fillStyle = '#000';
            ctx.fillText(`#${i + 1}`, centerX, textY);
        }
    }

    // --- 通用：绘制卡名覆盖层 (仅在答案显示时) ---
    if (showAnswer && item.name) {
        ctx.save(); 

        const nameFontSize = 24;
        ctx.font = `bold ${nameFontSize}px ${baseFont}`;
        
        let textWidth = ctx.measureText(item.name).width;
        const maxNameWidth = cardW - 10; 
        let actualFontSize = nameFontSize;
        
        if (textWidth > maxNameWidth) {
           const ratio = maxNameWidth / textWidth;
           actualFontSize = Math.floor(nameFontSize * ratio);
           ctx.font = `bold ${actualFontSize}px ${baseFont}`; 
           textWidth = maxNameWidth;
        }

        const boxHeight = actualFontSize + 14; 
        const boxY = y + 256 - boxHeight; 
        
        // 背景透明度逻辑
        let bgAlpha = 0.65;
        if (quizMode.value === 'judge') {
           const invert = judgeInvert.value;
           const isTarget = item.isMatchTarget;
           const isCorrectAnswer = invert ? !isTarget : isTarget;
           if (!isCorrectAnswer) bgAlpha = 0.42;
        }
        
        ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
        ctx.fillRect(x, boxY, cardW, boxHeight);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; 
        ctx.fillText(item.name, x + cardW / 2, boxY + boxHeight / 2);

        ctx.restore(); 
    }
  }
  
  ctx.fillStyle = '#999';
  ctx.font = `14px ${baseFont}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Created by Wanakachi', totalWidth - 10, totalHeight - 10);
};

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
      <span id="matching-hint">题目形式: </span>
      <div class="radio-group">
        <label><input type="radio" v-model="quizMode" value="fill"> 填空题</label>
        <label><input type="radio" v-model="quizMode" value="judge"> 判断题</label>
      </div>
    </div>

    <div id="modes-settings">
      <span id="matching-hint">主题选择: </span>
      <div class="radio-group">
        <label><input type="radio" v-model="guessMode" value="race"> 种族</label>
        <label><input type="radio" v-model="guessMode" value="attribute"> 属性</label>
        <label><input type="radio" v-model="guessMode" value="category"> 卡片种类</label>
        <label><input type="radio" v-model="guessMode" value="subcategory"> 细分种类</label>
      </div>
    </div>

    <div id="modes-settings" v-if="quizMode === 'judge'">
      <span id="matching-hint">判断配置: </span>
      <div>
        <span style="font-size: 14px; margin: 0 5px;">找出</span>
        
        <input type="number" v-model.number="judgeQuantity" min="1" :max="rows * cols - 1" class="num-input" style="width: 60px;">
        
        <span style="font-size: 14px; margin: 0 5px 10px 5px;">个</span>

        <select v-model="judgeTarget" class="select-input">
          <option v-for="opt in currentOptionsList" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
        
        <label style="margin-left: 10px; font-weight: normal;">
          <input type="checkbox" v-model="judgeInvert"> 反选 (找“不是”的)
        </label>
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

    <div id="modes-settings">
      <span id="matching-hint">筛选设置: </span>
      <div>
        <label><input type="checkbox" v-model="useCommonCards"> 只看常用卡</label>
      </div>
    </div>

    <div id="button-container">
      <button @click="handleGenerate" :disabled="loading || dataLoading" class="btns primary-btn">
        {{ dataLoading ? '数据初始化...' : (loading ? '生成中...' : '绘制图片') }}
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
    <p>卡图及卡片数据来源：
      <a href="https://ygocdb.com">百鸽</a>
    </p>
    <p>常用卡统计来源：
      <a href="https://mycard.world/ygopro/arena/index.html">MCPro 决斗数据库</a>
    </p>
    <p>种族/属性/种类信息摘自：
      <a href="https://zh.wikipedia.org/wiki/%E9%81%8A%E6%88%B2%E7%8E%8B%E9%9B%86%E6%8F%9B%E7%B4%99%E7%89%8C%E9%81%8A%E6%88%B2">游戏王中文维基</a>
    </p>
    <p>注意：数据更新有延迟。请查看
      <a href="https://github.com/WatanabeChika/Wana_tools/blob/main/README.md"> README </a>
      获取最近更新时间。
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

input[type="checkbox"] {
  display: inline-block;
  margin-right: 5px;
  vertical-align: middle;
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

.select-input {
  padding: 5px;
  margin-left: 5px;
  margin-right: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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