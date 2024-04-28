<script setup>
import {onMounted, ref} from 'vue';
import FontFaceObserver from 'font-face-observer';
import { fillCanvasText, loadImage, shuffleLogArray } from './utils';
import { LoveLive_characters, LoveLive_groups } from './data';

// -------变量声明-------
const canvas = ref(null);
const canvas_ans = ref(null);

const character_color = ref(true);
const character_birthday = ref(false);
const eye_color = ref(false);

const Font1 = new FontFaceObserver('KaiTi');

const titleFont = 'bold 50px KaiTi';
const normalFont = '35px KaiTi';
const basicPath = 'images/'

const bgColor = 'white';
const fontColor = 'black';
const titleText1 = '连线题：'
const titleText2 = '请将各角色连至其对应的'

const school_modes = ref(LoveLive_groups);
const characters = ref(LoveLive_characters);

const modeItems = ref([
  { name: '应援色', mark: character_color },
  { name: '生日'  , mark: character_birthday },
  { name: '瞳色'  , mark: eye_color },
]);

const color_modes = ref([
  { label: '蓝色系', checked: false , char: [1,3,13,18,23,24,34,37,43,47,52]},
  { label: '红色系', checked: false , char: [5,12,27,39,49]},
  { label: '黄色系', checked: false , char: [0,4,9,15,22,25,33,38,45,46,53]},
  { label: '绿色系', checked: false , char: [7,11,28,30,36,40,48]},
  { label: '紫色系', checked: false , char: [6,16,26,42,44,54]},
  { label: '粉色系', checked: false , char: [8,10,17,21,32,35,41,50]},
  { label: '白色系', checked: false , char: [2,14,19,29,31,51]},
]);

const birthday_modes = ref ([
  { label: '1月' , checked: false , char: [7,12,22,42,47] },
  { label: '2月' , checked: false , char: [11,28,32,35,53] },
  { label: '3月' , checked: false , char: [3,15,21] },
  { label: '4月' , checked: false , char: [5,13,23,38] },
  { label: '5月' , checked: false , char: [18,25,33,46] },
  { label: '6月' , checked: false , char: [6,16,24,40,48] },
  { label: '7月' , checked: false , char: [8,14,34] },
  { label: '8月' , checked: false , char: [0,9,27,41,50] },
  { label: '9月' , checked: false , char: [2,10,17,36,54] },
  { label: '10月', checked: false , char: [1,30,39,52] },
  { label: '11月', checked: false , char: [4,29,37,49] },
  { label: '12月', checked: false , char: [19,26,31,43,51] },
]);

let ctx, ctxAns, originHeight;
let imgPath = basicPath + 'character_icons/';


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
  canvas_ans.value.height = originHeight + charList.length * 175 + 50;

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

  // 左半部分
  const basicX = 170;
  const basicY = 300;
  for (let i = 0; i < charList.length; i++) {
    // 瞳色连线写角色名
    if (eye_color.value) {
      fillCanvasText(ctx, fontColor, normalFont, false, basicX - 30, basicY + i * 175, charList[i].label);
    }
    // 其余情况绘制角色头像
    else {
      const img = await loadImage(imgPath + charList[i].Eng + '.png');
      ctx.drawImage(img, basicX - 80, basicY + i * 175 - 70, 130, 130);
    }
  }

  // 右半部分
  const [themeList, relation] = shuffleLogArray(charList);
  // 应援色 -> 色块
  if (character_color.value) {
    for (let i = 0; i < themeList.length; i++) {
      ctx.fillStyle = themeList[i].color;
      ctx.fillRect(basicX + 570, basicY + i * 175 - 50, 180, 100);
    }
  }
  // 生日 -> 文字
  else if (character_birthday.value) {
    for (let i = 0; i < themeList.length; i++) {
      fillCanvasText(ctx, fontColor, normalFont, false, basicX + 640, basicY + i * 175, themeList[i].birthday);
    }
  }
  // 瞳色 -> 图片
  else if (eye_color.value) {
    // 调整图片路径
    imgPath = basicPath + 'eye_color/';
    for (let i = 0; i < themeList.length; i++) {
      const img = await loadImage(imgPath + themeList[i].Eng + '.png');
      ctx.drawImage(img, basicX + 570, basicY + i * 175 - 70, 130, 130);
    }
  }
  

  // 连线（答案）
  ctxAns.drawImage(canvas.value, 0, 0);
  for (let i = 0; i < relation.length; i++) {
    ctxAns.beginPath();
    ctxAns.moveTo(basicX + 75, basicY + relation[i][0] * 175);
    ctxAns.lineTo(basicX + 550, basicY + relation[i][1] * 175);
    ctxAns.strokeStyle = 'black';
    ctxAns.lineWidth = 3;
    ctxAns.stroke();
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

// 下载答案
function downloadAnswer() {
  const dataURL = canvas_ans.value.toDataURL('image/png');
  const downloadLink = document.createElement('a');

  downloadLink.href = dataURL;
  downloadLink.download = `答案.png`;

  downloadLink.click();
}


// -------事件侦听-------
// 初始化
onMounted(async () => {
  try {
    await Promise.all([Font1.check()]);

    ctx = canvas.value.getContext('2d');
    ctxAns = canvas_ans.value.getContext('2d');
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
  for (let i = 0; i < birthday_modes.value.length; i++) {
    birthday_modes.value[i].checked = false;
  }
  for (let i = 0; i < school_modes.value.length; i++) {
    school_modes.value[i].checked = false;
  }
};

// 快捷勾选
const modesAdjust = (modes) => {
  // 清空
  for (let i = 0; i < characters.value.length; i++) {
    characters.value[i].checked = false;
  }
  // 勾选
  for (let i = 0; i < modes.length; i++) {
    if (modes[i].checked) {
      for (let j = 0; j < modes[i].char.length; j++) {
        const index = modes[i].char[j];
        // 排除无数据的情况
        if (character_birthday.value && characters.value[index].birthday == "暂无") {
          continue;
        }
        if (eye_color.value && (!characters.value[index].eye)) {
          continue;
        }
        characters.value[index].checked = true;
      }
    }
  }
};

// 更改主题
const update_settings = (item) => {
  for (let i = 0; i < modeItems.value.length; i++) {
    if (modeItems.value[i].name != item.name) {
      modeItems.value[i].mark = false;
    } else {
      modeItems.value[i].mark = true;
    }
  }
  empty_char();
};

// 角色表格填充
const chunkedOptions = () => {
  const chunked = [];
  for (let i = 0; i < characters.value.length; i += 7) {
    chunked.push(characters.value.slice(i, i + 7));
  }
  return chunked;
};

// 角色表格选择
const toggleCheck = (char) => {
  for (let i = 0; i < color_modes.value.length; i++) {
    color_modes.value[i].checked = false;
  }
  for (let i = 0; i < birthday_modes.value.length; i++) {
    birthday_modes.value[i].checked = false;
  }
  for (let i = 0; i < school_modes.value.length; i++) {
    school_modes.value[i].checked = false;
  }
  if (character_birthday.value && char.birthday == "暂无") {
    alert("该角色暂无生日信息！");
    return;
  }
  if (eye_color.value && (!char.eye)) {
    alert("该角色暂无瞳色信息！");  // 薇恩、冬毬、莲104期暂无瞳色信息
    return;
  }
  char.checked = !char.checked;
};


</script>



<template>
  <h1>LoveLive!连线梗图制作器</h1>
  <div id="input-container">
    <div id="modes-settings">
      <span id="matching-hint">主题选择: </span>
      <div v-for="item in modeItems" :key="item.name">
        <label :for="item.name">{{ item.name }}</label>
        <input type="radio" name="check" :checked="item.mark" :value="item.mark" :id="item.name" @change="update_settings(item)">
      </div>
    </div>
    <table>
      <tr v-for="row in chunkedOptions()" :key="row[0].label">
        <td v-for="char in row" :key="char.label" :class="{ character_selected: char.checked }" @click="toggleCheck(char)">
          {{ char.label }}
        </td>
      </tr>
    </table>
    <div id="modes-settings">
      <span id="matching-hint">快捷选项: </span>
      <div v-if="character_color" v-for="item in color_modes" :key="item.label">
        <label :for="item.label">{{ item.label }}</label>
        <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(color_modes)">
      </div>
      <div v-if="character_birthday" v-for="item in birthday_modes" :key="item.label">
        <label :for="item.label">{{ item.label }}</label>
        <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(birthday_modes)">
      </div>
      <div v-if="eye_color" v-for="item in school_modes" :key="item.label">
        <label :for="item.label">{{ item.label }}</label>
        <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(school_modes)">
      </div>
    </div>
    <div id="button-container">
      <button @click="update_canvas" class="btns" style="background-color: cornflowerblue;">绘制图片</button>
      <button @click="empty_char" class="btns" style="background-color: gray;">清空选择</button>
      <button @click="downloadImage" class="btns">下载图片</button>
      <button @click="downloadAnswer" class="btns">下载答案</button>
    </div>
  </div>
  <div id="canvas-container">
    <canvas id="art-canvas" ref="canvas" width="1000" height="200"></canvas>
    <canvas id="art-canvas-ans" ref="canvas_ans" width="1000" height="200" style="display: none"></canvas>
  </div>
  <div id="notice">
    <p>注意：某些角色数据有相应缺失，选择时会做提醒。</p>
    <p>应援色和生日数据来源：
      <a href="https://llwiki.org/">LLWiki</a>
    </p>
    <p>瞳色数据来源：
      <a href="https://twitter.com/makoteau/status/1704457996808437882">@makoteau</a>
    </p>
  </div>
</template>



<style>
/* 全局 */
table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
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

input[type="radio"] {
  display: inline-block;
  margin-right: 30px;
}

/* 局部 */
#matching-hint {
  margin-right: 25px;
  margin-bottom: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
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
  background-color: aquamarine;
}

</style>
