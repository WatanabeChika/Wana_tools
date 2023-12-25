<script setup>
import {ref, onMounted, watch} from 'vue';
import FontFaceObserver from 'font-face-observer';
import {fillCanvas, getTextWidth, loadImage} from './utils.js';

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

const font1 = new FontFaceObserver('LIST');
const font2 = new FontFaceObserver('FFMC');

const textfont1 = 'bold italic 120px LIST';
const textfont2 = 'italic 25px FFMC';
const textfont3 = 'bold italic 66px LIST';

const modeItems = ref([
  { name: '透明背景', mark: transparentBg },
  { name: 'Superstar', mark: swapImage },
  { name: '互换底色', mark: swapColor },
  { name: '文字描边', mark: textStroke },
]);

let text1_ph = 'LoveLive!';
let text2_ph = 'School idol project';
let text3_ph = 'Sunshine!!';
let imgSrc = '../static/images/LLSS_star.png';
let ctx, originWidth;
let bgColor, fontColor;


// -------主要功能-------
// 更新Canvas
// async function updateCanvas() {
//   ctx = canvas.value.getContext('2d');
  
//   // 获取文本
//   const text1Width = getTextWidth(text1.value || text1_ph, textfont1);
//   const text2Width = getTextWidth(text2.value || text2_ph, textfont2);
//   const text3Width = getTextWidth(text3.value || text3_ph, textfont3);
  
//   if (text1Width > originWidth-36 || text2Width > (originWidth/2 + text1Width/2 - 36) || text3Width > (originWidth/2 + text1Width/2 - 36)) {
//     canvas.value.width = Math.max(text1Width+36, (text2Width+36 - text1Width/2)*2, (text3Width+36 - text1Width/2)*2);
//   } else {
//     canvas.value.width = originWidth;
//   }
  
//   // 绘制背景
//   ctx.fillStyle = bgColor;
//   ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

//   // 用于确定图片位置
//   const [text3_x, text3_y] = [canvas.value.width/2 + text1Width/2 - text3Width/2 - 30, canvas.value.height/2+63];
  
//   // 绘制文本
//   if (!transparentBg.value && swapColor.value && textStroke.value) {
//     const temp = fontColor;
//     fontColor = bgColor;
//     fillCanvas(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-35, text1.value || text1_ph);
//     fillCanvas(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2, canvas.value.height/2+18, text2.value || text2_ph);
//     fillCanvas(ctx, fontColor, textfont2, textStroke.value, text3_x, text3_y, text3.value || text2_ph);
//     fontColor = temp;
//   } else {
//     fillCanvas(ctx, fontColor, textfont1, textStroke.value, canvas.value.width/2, canvas.value.height/2-35, text1.value || text1_ph);
//     fillCanvas(ctx, fontColor, textfont2, textStroke.value, canvas.value.width/2 + text1Width/2 - text2Width/2, canvas.value.height/2+18, text2.value || text2_ph);
//     fillCanvas(ctx, fontColor, textfont2, textStroke.value, text3_x, text3_y, text3.value || text2_ph);
//   }

//   // 绘制图像
//   const img = await loadImage(imgSrc);
//   ctx.drawImage(img, text3_x-240, text3_y-88, img.width/2.1, img.height/2.1);
  
//   const dataURL = canvas.value.toDataURL('image/png');
//   image.value.src = dataURL; 
// }



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

    const text1Width = getTextWidth(text1_ph, textfont1);
    const text2Width = getTextWidth(text2_ph, textfont2);
    const text3Width = getTextWidth(text3_ph, textfont3);
    // 用于确定图片位置
    const [text3_x, text3_y] = [canvas.value.width/2 + text1Width/2 - text3Width/2 - 30, canvas.value.height/2+63];

    // 初始化显示的文本
    fillCanvas(ctx, fontColor, textfont1, false, canvas.value.width/2, canvas.value.height/2-50, text1_ph);
    fillCanvas(ctx, fontColor, textfont2, false, canvas.value.width/2 + text1Width/2 - text2Width/2 - 25, canvas.value.height/2+13, text2_ph);
    fillCanvas(ctx, fontColor, textfont3, false, text3_x, text3_y, text3_ph);

    // 初始化图像
    const img = await loadImage(imgSrc);
    ctx.drawImage(img, text3_x-245, text3_y-90, img.width/2, img.height/2);

    // 更新图片
    const dataURL = canvas.value.toDataURL('image/png');
    image.value.src = dataURL; 
  } catch (error) {
    console.error(error);
  }
});

// // 文本输入
// watch([text1, text2, text3], () => {
//   updateCanvas();
// });

// // 模式切换
// watch(transparentBg, () => {
//   if (!swapColor.value) {
//     if (transparentBg.value) {
//       bgColor = 'black';
//     } else {
//       bgColor = 'white';
//     }
//   } else {
//     if (transparentBg.value) {
//       fontColor = 'black';
//     } else {
//       fontColor = 'white';
//     }
//   }
//   updateCanvas();
// });

// watch(swapImage, () => {
//   if (swapImage.value) {
//     text3_ph = 'Superstar!!';
//     imgSrc = '../static/images/LLSP_star.png';
//   } else {
//     text3_ph = 'Sunshine!!';
//     imgSrc = '../static/images/LLSS_star.png';
//   }
//   updateCanvas();
// });

// watch(swapColor, () => {
//   const temp = bgColor;
//   bgColor = fontColor;
//   fontColor = temp;
//   updateCanvas();
// });

// watch(textStroke, () => {
//   updateCanvas();
// });

</script>



<template>
    <div id="canvas-container">
      <canvas id="art-canvas" ref="canvas" width="1000" height="500"></canvas>
      <img id="art-image" ref="image" width="1000" height="500" />
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

</style>