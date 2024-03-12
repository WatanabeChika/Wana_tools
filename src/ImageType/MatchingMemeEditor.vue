<script setup>
import {onMounted, ref} from 'vue';
import FontFaceObserver from 'font-face-observer';
import { fillCanvasText, loadImage, shuffleArray } from './utils';

// -------变量声明-------
const canvas = ref(null)

const character_color = ref(true);

const Font1 = new FontFaceObserver('KaiTi');

const titleFont = 'bold 50px KaiTi';
const normalFont = '35px KaiTi';
const imgPath = 'images/character_icons/'

const bgColor = 'white';
const fontColor = 'black';
const titleText1 = '连线题：'
const titleText2 = '请将各角色连至其对应的'

const modeItems = ref([
  { name: '应援色', mark: character_color },
]);

const color_modes = ref([
  { label: '蓝色系', checked: false , char: [1,3,13,18,23,24,34,37,43,47]},
  { label: '红色系', checked: false , char: [5,12,27,39,49]},
  { label: '黄色系', checked: false , char: [0,4,9,15,22,25,33,38,45,46]},
  { label: '绿色系', checked: false , char: [7,11,28,30,36,40,48]},
  { label: '紫色系', checked: false , char: [6,16,26,42,44]},
  { label: '粉色系', checked: false , char: [8,10,17,21,32,35,41,50]},
  { label: '白色系', checked: false , char: [2,14,19,29,31,51]},
]);

const characters = ref([
  { label: '高坂穗乃果'    , Eng: 'Honoka'   , checked: false, color: "#f38500" },
  { label: '绚濑绘里'      , Eng: 'Eli'      , checked: false, color: "#7aeeff" },
  { label: '南小鸟'        , Eng: 'Kotori'   , checked: false, color: "#cebfbf"},
  { label: '园田海未'      , Eng: 'Umi'      , checked: false, color: "#1769ff"},
  { label: '星空凛'        , Eng: 'Rin'      , checked: false, color: "#fff832"},
  { label: '西木野真姬'    , Eng: 'Maki'     , checked: false, color: "#ff503e"},
  { label: '东条希'        , Eng: 'Nozomi'   , checked: false, color: "#c455f6"},
  { label: '小泉花阳'      , Eng: 'Hanayo'   , checked: false, color: "#6ae673"},
  { label: '矢泽妮可'      , Eng: 'Nico'     , checked: false, color: "#ff4f91"},
  { label: '高海千歌'      , Eng: 'Chika'    , checked: false, color: "#ff9547"},
  { label: '樱内梨子'      , Eng: 'Riko'     , checked: false, color: "#ff9eac"},
  { label: '松浦果南'      , Eng: 'Kanan'    , checked: false, color: "#27c1b7"},
  { label: '黑泽黛雅'      , Eng: 'Dia'      , checked: false, color: "#db0839"},
  { label: '渡边曜'        , Eng: 'You'      , checked: false, color: "#66c0ff"},
  { label: '津岛善子'      , Eng: 'Yoshiko'  , checked: false, color: "#c1cad4"},
  { label: '国木田花丸'    , Eng: 'Hanamaru' , checked: false, color: "#ffd010"},
  { label: '小原鞠莉'      , Eng: 'Mari'     , checked: false, color: "#c252c6"},
  { label: '黑泽露比'      , Eng: 'Ruby'     , checked: false, color: "#ff6fbe"},
  { label: '鹿角圣良'      , Eng: 'Sarah'    , checked: false, color: "#00ccff"},
  { label: '鹿角理亚'      , Eng: 'Leah'     , checked: false, color: "#bbbbbb"},
  { label: '高咲侑'        , Eng: 'Yuu'      , checked: false, color: "#1d1d1d"},
  { label: '上原步梦'      , Eng: 'Ayumu'    , checked: false, color: "#ed7d95"},
  { label: '中须霞'        , Eng: 'Kasumi'   , checked: false, color: "#e7d600"},
  { label: '樱坂雫'        , Eng: 'Shizuku'  , checked: false, color: "#01b7ed"},
  { label: '朝香果林'      , Eng: 'Karin'    , checked: false, color: "#485ec6"},
  { label: '宫下爱'        , Eng: 'Ai'       , checked: false, color: "#ff5800"},
  { label: '近江彼方'      , Eng: 'Kanata'   , checked: false, color: "#a664a0"},
  { label: '优木雪菜'      , Eng: 'Setsuna'  , checked: false, color: "#d81c2f"},
  { label: '艾玛·维尔德'   , Eng: 'Verde'    , checked: false, color: "#84c36e"},
  { label: '天王寺璃奈'    , Eng: 'Rina'     , checked: false, color: "#9ca5b9"},
  { label: '三船栞子'      , Eng: 'Shiyoriko', checked: false, color: "#37b484"},
  { label: '米娅·泰勒'     , Eng: 'Taylor'   , checked: false, color: "#a9a898"},
  { label: '钟岚珠'        , Eng: 'Lanzhu'   , checked: false, color: "#f8c8c4"},
  { label: '涩谷香音'      , Eng: 'Kanon'    , checked: false, color: "#ff7f27"},
  { label: '唐可可'        , Eng: 'Keke'     , checked: false, color: "#a0fff9"},
  { label: '岚千砂都'      , Eng: 'Chisato'  , checked: false, color: "#ff6e90"},
  { label: '平安名堇'      , Eng: 'Sumire'   , checked: false, color: "#74f466"},
  { label: '叶月恋'        , Eng: 'Ren'      , checked: false, color: "#0000a0"},
  { label: '樱小路希奈子'  , Eng: 'Kinako'   , checked: false, color: "#fff442"},
  { label: '米女芽衣'      , Eng: 'Mei'      , checked: false, color: "#ff3535"},
  { label: '若菜四季'      , Eng: 'Shiki'    , checked: false, color: "#b2ffdd"},
  { label: '鬼冢夏美'      , Eng: 'Natsumi'  , checked: false, color: "#ff51c4"},
  { label: '薇恩·玛格丽特' , Eng: 'Margarete', checked: false, color: "#e49dfd"},
  { label: '鬼冢冬毬'      , Eng: 'Tomari'   , checked: false, color: "#4cd2e2"},
  { label: '柊摩央'        , Eng: 'Mao'      , checked: false, color: "#b05bd4"},
  { label: '圣泽悠奈'      , Eng: 'Yuna'     , checked: false, color: "#e7c030"},
  { label: '日野下花帆'    , Eng: 'Kaho'     , checked: false, color: "#f8b500"},
  { label: '村野沙耶香'    , Eng: 'Sayaka'   , checked: false, color: "#5383c3"},
  { label: '乙宗梢'        , Eng: 'Kozue'    , checked: false, color: "#68be8d"},
  { label: '夕雾缀理'      , Eng: 'Tsuzuri'  , checked: false, color: "#ba2636"},
  { label: '大泽瑠璃乃'    , Eng: 'Rurino'   , checked: false, color: "#e7609e"},
  { label: '藤岛慈'        , Eng: 'Megumi'   , checked: false, color: "#c8c2c6"},
]);

let ctx, originHeight;


// -------主要功能-------
// 更新Canvas
async function update_canvas() {
  // 获取选中的角色（以调整画布高度）
  let charList = [];
  for (let i = 0; i < characters.value.length; i++) {
    if (characters.value[i].checked) {
      charList.push(characters.value[i]);
    }
  }
  canvas.value.height = originHeight + charList.length * 175 + 50;

  // 白色背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // 标题 功能嵌入
  fillCanvasText(ctx, fontColor, titleFont, false, 520, 60, titleText1);
  fillCanvasText(ctx, fontColor, titleFont, false, 410, 135, titleText2);
  for (let i = 0; i < modeItems.value.length; i++) {
    if (modeItems.value[i].mark) {
      fillCanvasText(ctx, fontColor, titleFont, false, 760, 135, modeItems.value[i].name);
      break;
    }
  }

  // 角色绘制
  const basicX = 170;
  const basicY = 300;
  for (let i = 0; i < charList.length; i++) {
    // fillCanvasText(ctx, fontColor, normalFont, false, basicX, basicY + i * 175, charList[i].label);
    const img = await loadImage(imgPath + charList[i].Eng + '.png');
    ctx.drawImage(img, basicX - 80, basicY + i * 175 - 70, 130, 130);
  }

  // 色块绘制
  let colorList = charList;
  shuffleArray(colorList);
  for (let i = 0; i < colorList.length; i++) {
    ctx.fillStyle = colorList[i].color;
    ctx.fillRect(basicX + 570, basicY + i * 175 - 50, 180, 100);
  }
}

// 下载图片
function downloadImage() {
  const dataURL = canvas.value.toDataURL('image/png');
  const downloadLink = document.createElement('a');

  downloadLink.href = dataURL;
  downloadLink.download = `连线题.png`;

  downloadLink.click();
}

// -------事件侦听-------
// 初始化
onMounted(async () => {
  try {
    await Font1.check();

    ctx = canvas.value.getContext('2d');
    originHeight = canvas.value.height;

    update_canvas();

  } catch (error) {
    console.error(error);
  }
})

// 清空
const empty_char = () => {
  for (let i = 0; i < characters.value.length; i++) {
    characters.value[i].checked = false;
  }
  for (let i = 0; i < color_modes.value.length; i++) {
    color_modes.value[i].checked = false;
  }
  update_canvas();
};

// 快捷勾选
const modesAdjust = () => {
  // 清空
  for (let i = 0; i < characters.value.length; i++) {
    characters.value[i].checked = false;
  }
  // 勾选
  for (let i = 0; i < color_modes.value.length; i++) {
    if (color_modes.value[i].checked) {
      for (let j = 0; j < color_modes.value[i].char.length; j++) {
        characters.value[color_modes.value[i].char[j]].checked = true;
      }
    }
  }
  update_canvas();
};

// 角色表格相关
const chunkedOptions = () => {
  const chunked = [];
  for (let i = 0; i < characters.value.length; i += 7) {
    chunked.push(characters.value.slice(i, i + 7));
  }
  return chunked;
};
const toggleCheck = (char) => {
  for (let i = 0; i < color_modes.value.length; i++) {
    color_modes.value[i].checked = false;
  }
  char.checked = !char.checked;
  update_canvas();
};

</script>



<template>
  <h1>LoveLive!连线梗图制作器</h1>
  <div id="input-container">
    <div v-for="item in modeItems" :key="item.name" id="settings">
      <label :for="item.name">{{ item.name }}</label>
      <input type="radio" name="check" :checked="item.mark" :value="item.mark" :id="item.name" @change="update_canvas()">
    </div>
    <table>
      <tr v-for="row in chunkedOptions()" :key="row[0].label">
        <td v-for="char in row" :key="char.label" :class="{ character_selected: char.checked }" @click="toggleCheck(char)">
          {{ char.label }}
        </td>
      </tr>
    </table>
    <div id="modes-settings">
      <span style="margin-right: 25px;">快捷选项: </span>
      <div v-for="item in color_modes" :key="item.label" v-if="character_color">
        <label :for="item.label">{{ item.label }}</label>
        <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust()">
      </div>
    </div>
    <div id="button-container">
      <button @click="empty_char" class="btns">清空选择</button>
      <button @click="downloadImage" class="btns">下载图片</button>
    </div>
  </div>
  <div id="canvas-container">
    <canvas id="art-canvas" ref="canvas" width="1000" height="200"></canvas>
  </div>
</template>



<style>
/* 全局 */
table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  margin-top: 30px;
  margin-bottom: 30px;
}

td {
  width: 14.28%;
  padding: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
}

tr:nth-child(even) {
  background-color: #f2f2f2;
}

/* 局部 */
#settings {
  display: flex;
  flex-wrap: wrap;
  margin-right: 20px;
  margin-top: 30px;
}

#button-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  
}

.btns {
  margin-right: 20px;
}

#modes-settings {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.character_selected {
  background-color: green;
}

</style>
