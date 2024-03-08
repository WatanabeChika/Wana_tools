<script setup>
import {ref, onMounted, watch} from 'vue';
import FontFaceObserver from 'font-face-observer';
import {fillCanvasText, getTextWidth} from './utils.js';

// -------变量声明-------
const canvas = ref(null)
const text1 = ref('');
const text2 = ref('');

const transparentBg = ref(false);
const centerText = ref(false);
const swapColor = ref(false);
const textStroke = ref(false);

const font1 = new FontFaceObserver('LIST');
const font2 = new FontFaceObserver('FFMC');

const textfont1 = 'bold italic 120px LIST';
const textfont2 = '30px FFMC';
const centerTextfont2 = '32px FFMC';

const modeItems = ref([
  { name: '透明背景', mark: transparentBg },
  { name: '下排居中', mark: centerText },
  { name: '互换底色', mark: swapColor },
  { name: '文字描边', mark: textStroke },
]);

let text1_ph = 'LoveLive!';
let text2_ph = 'School idol project';
let ctx, originWidth;
let bgColor, fontColor;


// -------主要功能-------
// 更新Canvas
function updateCanvas() {
  ctx = canvas.value.getContext('2d');
  
  // 获取文本
  const text1Width = getTextWidth(text1.value || text1_ph, textfont1);
  const text2Width = getTextWidth(text2.value || text2_ph, textfont2);
  if (text1Width > originWidth-36 || text2Width > (originWidth/2 + text1Width/2 - 36)) {
    canvas.value.width = Math.max(text1Width+36, (text2Width+36 - text1Width/2)*2);
  } else {
    canvas.value.width = originWidth;
  }
  
  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  
  // 绘制文本
  if (!transparentBg.value && swapColor.value && textStroke.value) {
    const temp = fontColor;
    fontColor = bgColor;
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-30, text1.value || text1_ph);
    if (centerText.value) {
      fillCanvasText(ctx, fontColor, centerTextfont2, textStroke.value, canvas.value.width/2, canvas.value.height/2+40, text2.value || text2_ph);
    } else {
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2, canvas.value.height/2+40, text2.value || text2_ph);
    }
    fontColor = temp;
  } 
  else if (transparentBg.value && swapColor.value) {
    const temp = fontColor;
    fontColor = 'blue'; // 和背景不同
    ctx.globalCompositeOperation = 'destination-out';
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-30, text1.value || text1_ph);
    if (centerText.value) {
      fillCanvasText(ctx, fontColor, centerTextfont2, textStroke.value, canvas.value.width/2, canvas.value.height/2+40, text2.value || text2_ph);
    } else {
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2, canvas.value.height/2+40, text2.value || text2_ph);
    }
    ctx.globalCompositeOperation = 'source-over';
    fontColor = temp;
  } 
  else {
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-30, text1.value || text1_ph);
    if (centerText.value) {
      fillCanvasText(ctx, fontColor, centerTextfont2, textStroke.value, canvas.value.width/2, canvas.value.height/2+40, text2.value || text2_ph);
    } else {
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2, canvas.value.height/2+40, text2.value || text2_ph);
    }
  }
}

// 下载图片
function downloadImage() {
  const dataURL = canvas.value.toDataURL(transparentBg.value ? 'image/png' : 'image/jpeg');
  const downloadLink = document.createElement('a');

  downloadLink.href = dataURL;
  downloadLink.download = transparentBg.value ? `${text1.value || text1_ph}.png` : `${text1.value || text1_ph}.jpg`;

  downloadLink.click();
}


// -------事件侦听-------
// 初始化
onMounted(async () => {
  try {
    // 加载字体
    await Promise.all([font1.check(), font2.check()]);

    ctx = canvas.value.getContext('2d');
    originWidth = canvas.value.width;
    // 设置 Canvas 初始样式
    bgColor = "white";
    fontColor = "#E4007F";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

    // 初始化显示的文本
    const text1Width = getTextWidth(text1_ph, textfont1);
    const text2Width = getTextWidth(text2_ph, textfont2);

    fillCanvasText(ctx, fontColor, textfont1, false, canvas.value.width/2, canvas.value.height/2-30, text1_ph);
    fillCanvasText(ctx, fontColor, textfont2, false, canvas.value.width/2 + text1Width/2 - text2Width/2, canvas.value.height/2+40, text2_ph);

  } catch (error) {
    console.error(error);
  }
});

// 文本输入
watch([text1, text2], () => {
  updateCanvas();
});

// 模式切换
watch(transparentBg, () => {
  if (!swapColor.value) {
    if (transparentBg.value) {
      bgColor = 'transparent';
    } else {
      bgColor = 'white';
    }
  } else {
    if (transparentBg.value) {
      fontColor = 'transparent';
    } else {
      fontColor = 'white';
    }
  }
  updateCanvas();
});

watch(centerText, () => {
  if (centerText.value) {
    text2_ph = 'School idol project series';
  } else {
    text2_ph = 'School idol project';
  }
  updateCanvas();
});

watch(swapColor, () => {
  [bgColor, fontColor] = [fontColor, bgColor];
  updateCanvas();
});

watch(textStroke, () => {
  updateCanvas();
});

</script>



<template>
    <h1>LoveLive!风格Logo生成器</h1>
    <div id="canvas-container">
      <canvas id="art-canvas" ref="canvas" width="1000" height="500"></canvas>
    </div>
    <div id="input-container">
      <div id="canvas-settings">
        <div v-for="item in modeItems" :key="item.name">
          <label :for="item.name">{{ item.name }}</label>
          <input v-model="item.mark" type="checkbox" :id="item.name">
        </div>
      </div>
      <br>
      <input v-model="text1" type="text" id="text-input1" :placeholder="text1_ph">
      <br>
      <input v-model="text2" type="text" id="text-input2" :placeholder="text2_ph">
      <br>
      <button @click="downloadImage" id="download-btn">下载图片</button>
    </div>
    <div id="notice">
      <p>使用字体：Lido Bold Italic、FF Magda Clean Mono。无中文fallback字体。参考：
        <a href="https://zhuanlan.zhihu.com/p/20356949">链接</a>
      </p>
    </div>
</template>



<style>
/* 全局 */
label {
  display: inline-block;
  margin-bottom: 10px;
  margin-left: 10px;
  font-weight: 600;
}

input[type="checkbox"] {
  display: inline-block;
  margin-bottom: 10px;
  margin-right: 30px;
}

input[type="text"] {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #d1d5da;
  border-radius: 4px;
  margin-bottom: 10px;
  width: 100%;
  box-sizing: border-box;
}
button {
  background-color: #28a745;
  color: #fff;
  padding: 9px 13px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #218838;
}

/* 局部 */
#canvas-container {
  position: relative;
  margin-bottom: 20px;
}

#art-canvas {
  max-width: 100%;
  height: auto;
  display: block;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  margin-bottom: 20px;
}

#input-container {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

#canvas-settings {
  display: flex;
  flex-direction: row;
}

#notice {
  width: 100%;
  text-align: left;
  margin-top: 30px;
}
#button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

</style>