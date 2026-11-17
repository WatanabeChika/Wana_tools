<script setup>
import { ref, onMounted, watch } from 'vue';
import { loadFonts } from '../utils/resources';
import { useResource } from '../utils/useResource';
import ResourceStatus from '../components/ResourceStatus.vue';
import { fillCanvasText, getTextWidth } from './utils.js';

// -------变量声明-------
const canvas = ref(null)
const text1 = ref('');
const text2 = ref('');

const transparentBg = ref(false);
const centerText = ref(false);
const swapColor = ref(false);
const textStroke = ref(false);

const { ready: fontsReady, loading: fontLoading, error: fontError, retry: retryFonts } = useResource(() => loadFonts('LIST', 'FFMC'), () => updateCanvas());

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
let ctx;
const originWidth = 1000;
let bgColor = "white", fontColor = "#E4007F";


// -------主要功能-------
// 更新Canvas
function updateCanvas() {
  if (!canvas.value) return;
  ctx = canvas.value.getContext('2d');

  // 获取文本
  const text1Width = getTextWidth(text1.value || text1_ph, textfont1);
  const text2Width = getTextWidth(text2.value || text2_ph, textfont2);
  if (text1Width > originWidth - 36 || text2Width > (originWidth / 2 + text1Width / 2 - 36)) {
    canvas.value.width = Math.max(text1Width + 36, (text2Width + 36 - text1Width / 2) * 2);
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
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 - 30, text1.value || text1_ph);
    if (centerText.value) {
      fillCanvasText(ctx, fontColor, centerTextfont2, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 + 40, text2.value || text2_ph);
    } else {
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width / 2 + text1Width / 2 - text2Width / 2, canvas.value.height / 2 + 40, text2.value || text2_ph);
    }
    fontColor = temp;
  }
  else if (transparentBg.value && swapColor.value) {
    const temp = fontColor;
    fontColor = 'blue'; // 和背景不同
    ctx.globalCompositeOperation = 'destination-out';
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 - 30, text1.value || text1_ph);
    if (centerText.value) {
      fillCanvasText(ctx, fontColor, centerTextfont2, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 + 40, text2.value || text2_ph);
    } else {
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width / 2 + text1Width / 2 - text2Width / 2, canvas.value.height / 2 + 40, text2.value || text2_ph);
    }
    ctx.globalCompositeOperation = 'source-over';
    fontColor = temp;
  }
  else {
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 - 30, text1.value || text1_ph);
    if (centerText.value) {
      fillCanvasText(ctx, fontColor, centerTextfont2, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 + 40, text2.value || text2_ph);
    } else {
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width / 2 + text1Width / 2 - text2Width / 2, canvas.value.height / 2 + 40, text2.value || text2_ph);
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
onMounted(() => updateCanvas());

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
  <h1 class="tool-title">LoveLive!风格Logo生成器</h1>
  <ResourceStatus :loading="fontLoading" :error="fontError" label="字体" @retry="retryFonts" />
  <div id="canvas-container">
    <canvas id="art-canvas" ref="canvas" width="1000" height="500"></canvas>
  </div>
  <div id="input-container">
    <div id="canvas-settings">
      <label v-for="item in modeItems" :key="item.name" class="logo-option">
        <input v-model="item.mark" type="checkbox">{{ item.name }}
      </label>
    </div>
    <label class="logo-field" for="text-input1">上排文字<input v-model="text1" type="text" id="text-input1"
        :placeholder="text1_ph"></label>
    <label class="logo-field" for="text-input2">下排文字<input v-model="text2" type="text" id="text-input2"
        :placeholder="text2_ph"></label>
    <button @click="downloadImage" :disabled="!fontsReady" id="download-btn">下载图片</button>
  </div>
  <div id="notice">
    <p>注意：输入文字过长会导致图片崩坏。</p>
    <p>使用字体：Lido Bold Italic、FF Magda Clean Mono。无中文fallback字体。参考：
      <a href="https://zhuanlan.zhihu.com/p/20356949">链接</a>
    </p>
  </div>
</template>



<style scoped>
#canvas-container {
  width: 100%;
  margin-bottom: 24px;
}

#art-canvas {
  width: 100%;
  height: auto;
  display: block;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-sizing: border-box;
}

#input-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

#canvas-settings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
}

.logo-option {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
}

.logo-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  font-size: 14px;
  text-align: left;
  font-weight: 500;
}

.logo-field input {
  width: 100%;
}

#notice {
  width: 100%;
  text-align: left;
}
</style>
