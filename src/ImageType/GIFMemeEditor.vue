<script setup>
import { ref, onMounted } from 'vue'
import FontFaceObserver from 'font-face-observer';
import { createGIF } from 'gifshot'
import { fillCanvasText, loadImage, shuffleLogArray } from './utils';
import { LoveLive_characters, LoveLive_groups } from './data';

const canvas = ref(null);
const images = ref([]);
const loading = ref(false);

const anime = ref(true);
const seiyuu = ref(false);

const Font1 = new FontFaceObserver('KaiTi');

const titleFont = 'bold 50px KaiTi';
const normalFont = '35px KaiTi';
const basicPath = 'images/'

const bgColor = 'white';
const fontColor = 'black';
const titleText = '今天单推谁？'

const characters = ref(LoveLive_characters);
const school_modes = ref(LoveLive_groups);

const modeItems = ref([
  { name: '角色', mark: anime },
  // { name: '声优', mark: seiyuu },
]);

let ctx, imgPath;

async function update_canvas() {
  // 角色 or 声优
  if (anime.value) {
    imgPath = basicPath + 'character_icons/';
  } else {
    imgPath = basicPath + 'seiyuu_icons/';
  }

  // 标题
  fillCanvasText(ctx, fontColor, titleFont, false, 210, 75, titleText);
  if (document.getElementById("image-container").getElementsByTagName("img").length > 0){
    document.getElementById("image-container").removeChild(document.getElementById("image-container").getElementsByTagName("img")[0]);
  }
  images.value = [];
  loading.value = true;

  // 绘制角色/声优，添加到图片数组
  for (let i = 0; i < characters.value.length; i++) {
    if (characters.value[i].checked) {
      const char = characters.value[i];
      const img = await loadImage(imgPath + char.Eng + '.png');
      ctx.drawImage(img, 48, 130, 300, 300);

      const dataURL = canvas.value.toDataURL('image/png');
      images.value.push(dataURL);

      ctx.fillStyle = bgColor;
      ctx.fillRect(48, 130, canvas.value.width, canvas.value.height);
    }
  }
  create();
}

// 绘制GIF图
const create = () => {
  createGIF({
    'images': images.value,
    'gifWidth': canvas.value.width,
    'gifHeight': canvas.value.height,
    }, function(obj) {
    if(!obj.error) {
      var image = obj.image,
      animatedImage = document.createElement('img');
      animatedImage.src = image;
      loading.value = false;
      document.getElementById("image-container").appendChild(animatedImage);
    }
  })
};

// 下载图片
function downloadImage() {
  const dataURL = document.getElementById("image-container").getElementsByTagName("img")[0].src;
  const downloadLink = document.createElement('a');

  downloadLink.href = dataURL;
  downloadLink.download = `今天单推谁.gif`;

  downloadLink.click();
}


// -------事件侦听-------
// 初始化
onMounted(async () => {
  try {
    await Promise.all([Font1.check()]);
    ctx = canvas.value.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  } catch (error) {
    console.error(error);
  }
})

// 清空
const empty_char = () => {
  for (let i = 0; i < characters.value.length; i++) {
    characters.value[i].checked = false;
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
  for (let i = 0; i < school_modes.value.length; i++) {
    school_modes.value[i].checked = false;
  }
  char.checked = !char.checked;
};

</script>

<template>
    <h1>"今天单推谁"GIF生成器</h1>
    <div id="input-container">
      <div id="modes-settings">
        <span id="matching-hint">类型选择: </span>
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
        <div v-for="item in school_modes" :key="item.label">
          <label :for="item.label">{{ item.label }}</label>
          <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(school_modes)">
        </div>
      </div>
      <div id="button-container">
        <button @click="update_canvas" class="btns" style="background-color: cornflowerblue;">绘制GIF图</button>
        <button @click="empty_char" class="btns" style="background-color: gray;">清空选择</button>
        <button @click="downloadImage" class="btns">下载GIF图</button>
      </div>
    </div>
    <div id="image-container">
      <canvas id="GIF-canvas" ref="canvas" width="400" height="500" style="display: none;"></canvas>
      <span v-if="loading" style="text-align: center">生成中······</span>
    </div>
</template>

<style>

</style>