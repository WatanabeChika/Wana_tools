<script setup>
import {ref, onMounted, watch} from 'vue';
import FontFaceObserver from 'font-face-observer';
import {fillCanvasText, getTextWidth, loadImage} from './utils.js';

// -------变量声明-------
const canvas = ref(null)
const image = ref(null)
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

const font1 = new FontFaceObserver('LIST');
const font2 = new FontFaceObserver('FFMC');

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
let imgMode = '';
let manualImg = false;
let ctx, originWidth;
let bgColor, fontColor;


// -------主要功能-------
// 更新Canvas
async function updateCanvas(swapImage, manualImg) {
  ctx = canvas.value.getContext('2d');
  
  // 获取文本
  const text1Width = getTextWidth(text1.value || text1_ph, textfont1);
  const text2Width = getTextWidth(text2.value || text2_ph, textfont2);
  const text3Width = getTextWidth(text3.value || text3_ph, textfont3);
  
  if (text1Width > originWidth-36 || text2Width > (originWidth/2 + text1Width/2 - 25 - 36) || text3Width > (originWidth/2 + text1Width/2 - 30 - 36)) {
    canvas.value.width = Math.max(text1Width+36, (text2Width+36+25 - text1Width/2)*2, (text3Width+36+30 - text1Width/2)*2);
    maxWidth.value = canvas.value.width;
  } else {
    canvas.value.width = originWidth;
    maxWidth.value = canvas.value.width;
  }
  
  // 绘制背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // 用于确定图片位置
  const [text3_x, text3_y] = [canvas.value.width/2 + text1Width/2 - text3Width/2 - 30, canvas.value.height/2+63];
  
  // 选择图片
  if (textStroke.value) {
    imgMode = '_stroke';
  } else if (swapColor.value) {
    imgMode = '_white';
  }

  // 图片位置和大小
  const img = await loadImage(imgSrc+imgMode+'.png');
  const [x, y, w, h] = swapImage 
                      ? [manualImg?imageX.value-62.5:text3_x-248, manualImg?imageY.value-55:text3_y-75, img.width/4, img.height/4] 
                      : [manualImg?imageX.value-125:text3_x-310, manualImg?imageY.value-110:text3_y-145, img.width/2, img.height/2];
  [imageX.value, imageY.value]= [x, y];

  // 绘制文本和图像
  if (!transparentBg.value && swapColor.value && textStroke.value) {
    const temp = fontColor;
    fontColor = bgColor;
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-50, text1.value || text1_ph);
    fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2 - 25, canvas.value.height/2+16, text2.value || text2_ph);
    fillCanvasText(ctx, fontColor, textfont3, textStroke.value, text3_x, text3_y, text3.value || text3_ph);
    fontColor = temp;
    if(imgExist.value) ctx.drawImage(img, x, y, w, h);
  } 
  else if (transparentBg.value && swapColor.value) {
    const temp = fontColor;
    fontColor = 'blue'; // 和背景不同
    ctx.globalCompositeOperation = 'destination-out';
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-50, text1.value || text1_ph);
    fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2 - 25, canvas.value.height/2+16, text2.value || text2_ph);
    fillCanvasText(ctx, fontColor, textfont3, textStroke.value, text3_x, text3_y, text3.value || text3_ph);
    if(imgExist.value) ctx.drawImage(img, x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
    fontColor = temp;
    if (textStroke.value) {
      const img2 = await loadImage(imgSrc+'_empty.png');
      if(imgExist.value) ctx.drawImage(img2, x, y, w, h);
    }
  } 
  else {
    fillCanvasText(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-50, text1.value || text1_ph);
    fillCanvasText(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2 - 25, canvas.value.height/2+16, text2.value || text2_ph);
    fillCanvasText(ctx, fontColor, textfont3, textStroke.value, text3_x, text3_y, text3.value || text3_ph);
    if(imgExist.value) ctx.drawImage(img, x, y, w, h);
  }
  
  imgMode = '';
  image.value.src = canvas.value.toDataURL('image/png'); 
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
onMounted(async () => {
  try {
    // 加载字体
    await Promise.all([font1.check(), font2.check()]);

    ctx = canvas.value.getContext('2d');
    originWidth = canvas.value.width;
    maxWidth.value = canvas.value.width;
    maxHeight.value = canvas.value.height;
    // 设置 Canvas 初始样式
    bgColor = "white";
    fontColor = "#E4007F";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

    const text1Width = getTextWidth(text1_ph, textfont1);
    const text2Width = getTextWidth(text2_ph, textfont2);
    const text3Width = getTextWidth(text3_ph, textfont3);
    // 用于确定图片位置
    const [text3_x, text3_y] = [canvas.value.width/2 + text1Width/2 - text3Width/2 - 30, canvas.value.height/2+63];

    // 初始化显示的文本
    fillCanvasText(ctx, fontColor, textfont1, false, canvas.value.width/2, canvas.value.height/2-50, text1_ph);
    fillCanvasText(ctx, fontColor, textfont2, false, canvas.value.width/2 + text1Width/2 - text2Width/2 - 25, canvas.value.height/2+16, text2_ph);
    fillCanvasText(ctx, fontColor, textfont3, false, text3_x, text3_y, text3_ph);

    // 初始化图像
    const img = await loadImage(imgSrc+'.png');
    [imageX.value, imageY.value]= [text3_x-310, text3_y-145];
    ctx.drawImage(img, imageX.value, imageY.value, img.width/2, img.height/2);

    // 更新图片
    image.value.src = canvas.value.toDataURL('image/png'); 
  } catch (error) {
    console.error(error);
  }
});

// 手动调整图片位置
function manualAdjust() {
  manualImg = true;
  updateCanvas(swapImage.value, manualImg);
}

// 文本输入
watch([text1, text2, text3], () => {
  updateCanvas(swapImage.value, manualImg);
});

// 图片位置
watch([imageX, imageY], () => {
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
  const temp = bgColor;
  bgColor = fontColor;
  fontColor = temp;
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
    <div id="canvas-container">
      <canvas id="art-canvas" ref="canvas" width="1000" height="500"></canvas>
      <img id="art-image" ref="image"/>
    </div>
    <div id="input-container">
      <div id="canvas-settings">
        <div v-for="item in modeItems" :key="item.name">
          <label :for="item.name">{{ item.name }}</label>
          <input v-model="item.mark" type="checkbox" :id="item.name">
        </div>
        <div v-if="imgExist" id="imgExist">
          <div class="image-manual">
            <label for="imageX">X</label>
            <input type="range" id="imageX" min="0" :max="maxWidth" step="1" v-model="imageX" @change="manualAdjust">
            <input type="number" id="imageX" v-model="imageX" @input="manualAdjust">
          </div>
          <div class="image-manual">
            <label for="imageY">Y</label>
            <input type="range" id="imageY" min="0" :max="maxHeight" step="1" v-model="imageY" @change="manualAdjust">
            <input type="number" id="imageX" v-model="imageY" @input="manualAdjust">
          </div>
        </div>
      </div>
      <br>
      <input v-model="text1" type="text" id="text-input1" :placeholder="text1_ph">
      <br>
      <input v-model="text2" type="text" id="text-input2" :placeholder="text2_ph">
      <br>
      <input v-model="text3" type="text" id="text-input3" :placeholder="text3_ph">
      <br>
      <button @click="downloadImage" id="download-btn">下载图片</button>
    </div>
</template>



<style>
#canvas-container {
  position: relative;
  margin-bottom: 20px;
}

#art-canvas {
  display: none;
}

#art-image {
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
  flex-wrap: wrap;
  flex-direction: row;
}

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

#button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

button {
  background-color: #28a745;
  color: #fff;
  padding: 10px 15px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #218838;
}

#imgExist {
  display: flex; 
  flex-direction: column; 
  align-items: center;
}

.image-manual {
  display: flex;
  flex-direction: row;
  align-items: center;
}

input[type="range"] {
  width: 150px;
  margin-left: 15px;
  margin-right: 10px;
}

input[type="number"] {
  width: 60px;
  margin-right: 15px;
}

</style>