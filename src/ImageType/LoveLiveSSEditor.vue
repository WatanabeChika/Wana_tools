<script setup>
import { ref, onMounted, watch } from 'vue';
import { loadFonts } from '../utils/resources';
import { useResource } from '../utils/useResource';
import ResourceStatus from '../components/ResourceStatus.vue';
import { fillCanvasText, getTextWidth, loadImage } from './utils.js';

// -------变量声明-------
const canvas = ref(null)
const text1 = ref('');
const text2 = ref('');
const text3 = ref('');

const transparentBg = ref(false);
const swapImage = ref(false);
const swapColor = ref(false);
const textStroke = ref(false);
const imgExist = ref(true);
const imageX = ref(0);
const imageY = ref(0);
const maxWidth = ref(0);
const maxHeight = ref(0);

const { ready: fontsReady, loading: fontLoading, error: fontError, retry: retryFonts } = useResource(() => loadFonts('LIST', 'FFMC'), () => updateCanvas(swapImage.value, manualImg));

const textfont1 = 'bold italic 120px LIST';
const textfont2 = 'italic 25px FFMC';
const textfont3 = 'bold italic 66px LIST';

const modeItems = ref([
  { name: '透明背景', mark: transparentBg },
  { name: '超级新星', mark: swapImage },
  { name: '互换底色', mark: swapColor },
  { name: '文字描边', mark: textStroke },
  { name: '图片组件', mark: imgExist },
]);

let text1_ph = 'LoveLive!';
let text2_ph = 'School idol project';
let text3_ph = 'Sunshine!!';
let imgSrc = 'images/LLSS_star';
const rendering = ref(false);
const renderError = ref('');
let renderId = 0;
let manualImg = false;
let ctx;
const originWidth = 1000;
let bgColor = "white", fontColor = "#E4007F";


// -------主要功能-------
// 更新Canvas
async function updateCanvas(swapImage, manualImg) {
  if (!canvas.value) return;
  const id = ++renderId;
  rendering.value = true;
  renderError.value = '';
  try {
    const imgMode = textStroke.value ? '_stroke' : swapColor.value ? '_white' : '';
    const [img, img2] = imgExist.value ? await Promise.all([
      loadImage(imgSrc + imgMode + '.png'),
      transparentBg.value && swapColor.value && textStroke.value ? loadImage(imgSrc + '_empty.png') : null,
    ]) : [{ width: 0, height: 0 }, null];
    if (id !== renderId || !canvas.value) return;
    ctx = canvas.value.getContext('2d');
    // 获取文本
    const text1Width = getTextWidth(text1.value || text1_ph, textfont1);
    const text2Width = getTextWidth(text2.value || text2_ph, textfont2);
    const text3Width = getTextWidth(text3.value || text3_ph, textfont3);

    if (text1Width > originWidth - 36 || text2Width > (originWidth / 2 + text1Width / 2 - 25 - 36) || text3Width > (originWidth / 2 + text1Width / 2 - 30 - 36)) {
      canvas.value.width = Math.max(text1Width + 36, (text2Width + 36 + 25 - text1Width / 2) * 2, (text3Width + 36 + 30 - text1Width / 2) * 2);
      maxWidth.value = canvas.value.width;
    } else {
      canvas.value.width = originWidth;
      maxWidth.value = canvas.value.width;
    }

    // 绘制背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

    // 用于确定图片位置
    const [text3_x, text3_y] = [canvas.value.width / 2 + text1Width / 2 - text3Width / 2 - 30, canvas.value.height / 2 + 63];

    // 图片位置和大小
    const [x, y, w, h] = swapImage
      ? [manualImg ? imageX.value - 62.5 : text3_x - 248, manualImg ? imageY.value - 55 : text3_y - 75, img.width / 4, img.height / 4]
      : [manualImg ? imageX.value - 125 : text3_x - 310, manualImg ? imageY.value - 110 : text3_y - 145, img.width / 2, img.height / 2];
    if (!manualImg) [imageX.value, imageY.value] = [swapImage ? x + 62.5 : x + 125, swapImage ? y + 55 : y + 110];

    // 绘制文本和图像
    if (!transparentBg.value && swapColor.value && textStroke.value) {
      const temp = fontColor;
      fontColor = bgColor;
      fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 - 50, text1.value || text1_ph);
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width / 2 + text1Width / 2 - text2Width / 2 - 25, canvas.value.height / 2 + 16, text2.value || text2_ph);
      fillCanvasText(ctx, fontColor, textfont3, textStroke.value, text3_x, text3_y, text3.value || text3_ph);
      fontColor = temp;
      if (imgExist.value) ctx.drawImage(img, x, y, w, h);
    }
    else if (transparentBg.value && swapColor.value) {
      const temp = fontColor;
      fontColor = 'blue'; // 和背景不同
      ctx.globalCompositeOperation = 'destination-out';
      fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 - 50, text1.value || text1_ph);
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width / 2 + text1Width / 2 - text2Width / 2 - 25, canvas.value.height / 2 + 16, text2.value || text2_ph);
      fillCanvasText(ctx, fontColor, textfont3, textStroke.value, text3_x, text3_y, text3.value || text3_ph);
      if (imgExist.value) ctx.drawImage(img, x, y, w, h);
      ctx.globalCompositeOperation = 'source-over';
      fontColor = temp;
      if (textStroke.value) {
        if (imgExist.value) ctx.drawImage(img2, x, y, w, h);
      }
    }
    else {
      fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width / 2, canvas.value.height / 2 - 50, text1.value || text1_ph);
      fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width / 2 + text1Width / 2 - text2Width / 2 - 25, canvas.value.height / 2 + 16, text2.value || text2_ph);
      fillCanvasText(ctx, fontColor, textfont3, textStroke.value, text3_x, text3_y, text3.value || text3_ph);
      if (imgExist.value) ctx.drawImage(img, x, y, w, h);
    }

  } catch (error) {
    if (id === renderId) renderError.value = error.message;
  } finally {
    if (id === renderId) rendering.value = false;
  }
}

// 下载图片
function downloadImage() {
  const dataURL = canvas.value.toDataURL(transparentBg.value ? 'image/png' : 'image/jpeg');
  const downloadLink = document.createElement('a');

  downloadLink.href = dataURL;
  downloadLink.download = transparentBg.value ? `${text1.value || text3_ph}.png` : `${text1.value || text3_ph}.jpg`;

  downloadLink.click();
}

// -------事件侦听-------
// 初始化
onMounted(() => {
  maxWidth.value = originWidth;
  maxHeight.value = canvas.value.height;
  updateCanvas(swapImage.value, manualImg);
});

// 手动调整图片位置
function manualAdjust(m) {
  manualImg = m;
  updateCanvas(swapImage.value, manualImg);
}

// 文本输入
watch([text1, text2, text3], () => {
  updateCanvas(swapImage.value, manualImg);
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
  updateCanvas(swapImage.value, manualImg);
});

watch(swapImage, () => {
  if (swapImage.value) {
    text3_ph = 'Superstar!!';
    imgSrc = 'images/LLSP_star';
  } else {
    text3_ph = 'Sunshine!!';
    imgSrc = 'images/LLSS_star';
  }
  updateCanvas(swapImage.value, manualImg);
});

watch(swapColor, () => {
  [bgColor, fontColor] = [fontColor, bgColor];
  updateCanvas(swapImage.value, manualImg);
});

watch(textStroke, () => {
  updateCanvas(swapImage.value, manualImg);
});

watch(imgExist, () => {
  updateCanvas(swapImage.value, manualImg);
});

</script>



<template>
  <h1 class="tool-title">LoveLive!Sunshine!!风格Logo生成器</h1>
  <ResourceStatus :loading="fontLoading" :error="fontError" label="字体" @retry="retryFonts" />
  <ResourceStatus :loading="rendering" :error="renderError" label="图片" @retry="updateCanvas(swapImage, manualImg)" />
  <div id="canvas-container">
    <canvas id="art-canvas" ref="canvas" width="1000" height="500"></canvas>
  </div>
  <div id="input-container">
    <div id="canvas-settings">
      <label v-for="item in modeItems" :key="item.name" class="logo-option">
        <input v-model="item.mark" type="checkbox">{{ item.name }}
      </label>
    </div>
    <div v-if="imgExist" id="image-settings">
      <div id="imgExist">
        <div class="image-manual">
          <label for="imageX">X</label>
          <input type="range" id="imageX" min="0" :max="maxWidth" step="1" v-model="imageX" @input="manualAdjust(true)">
          <input type="number" aria-label="图片 X 坐标" v-model="imageX" @input="manualAdjust(true)">
        </div>
        <div class="image-manual">
          <label for="imageY">Y</label>
          <input type="range" id="imageY" min="0" :max="maxHeight" step="1" v-model="imageY"
            @input="manualAdjust(true)">
          <input type="number" aria-label="图片 Y 坐标" v-model="imageY" @input="manualAdjust(true)">
        </div>
      </div>
      <div class="image-manual">
        <button @click="manualAdjust(false)" id="autoAdjust-btn">恢复默认</button>
      </div>
    </div>
    <label class="logo-field" for="text-input1">上排文字<input v-model="text1" type="text" id="text-input1"
        :placeholder="text1_ph"></label>
    <label class="logo-field" for="text-input2">下排文字<input v-model="text2" type="text" id="text-input2"
        :placeholder="text2_ph"></label>
    <label class="logo-field" for="text-input3">副标题<input v-model="text3" type="text" id="text-input3"
        :placeholder="text3_ph"></label>
    <button @click="downloadImage" :disabled="!fontsReady || rendering || !!renderError" id="download-btn">下载图片</button>
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

#image-settings {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  width: 100%;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

#imgExist {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-manual {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.image-manual input[type="range"] {
  width: 150px;
  max-width: 100%;
}

.image-manual input[type="number"] {
  width: 78px;
}
</style>
