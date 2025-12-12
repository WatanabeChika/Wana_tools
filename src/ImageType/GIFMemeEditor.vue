<script setup>
import { ref, onMounted } from 'vue'
import FontFaceObserver from 'font-face-observer';
import { createGIF } from 'gifshot'
import { fillCanvasText, loadImage } from './utils';
import { LoveLive_characters, LoveLive_groups } from './data';

// ------- 变量声明 -------
const canvas = ref(null);
const images = ref([]);
const loading = ref(false);
const resultGif = ref(null);

const anime = ref(true);
const seiyuu = ref(false);

const Font1 = new FontFaceObserver('KaiTi');
const titleFont = 'bold 50px KaiTi';
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

// ------- 主要逻辑 -------

async function update_canvas() {
  // 角色 or 声优
  if (anime.value) {
    imgPath = basicPath + 'characters/';
  } else {
    imgPath = basicPath + 'seiyuus/';
  }

  // 标题
  fillCanvasText(ctx, fontColor, titleFont, false, 210, 75, titleText);
  
  // 清空之前的图片状态
  resultGif.value = null; 
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
  
  if (images.value.length === 0) {
    loading.value = false;
    alert("请至少选择一个角色！");
    return;
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
      loading.value = false;
      // 修改点：直接将生成的 Base64 赋值给响应式变量，而非操作 DOM
      resultGif.value = obj.image; 
    }
  })
};

// 下载图片
function downloadImage() {
  if (!resultGif.value) return;

  const downloadLink = document.createElement('a');
  downloadLink.href = resultGif.value;
  downloadLink.download = `今天单推谁.gif`;
  downloadLink.click();
}


// ------- 事件侦听 -------
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
  resultGif.value = null; // 同时清空结果图
};

// 快捷勾选
const modesAdjust = (modes) => {
  // 先清空
  for (let i = 0; i < characters.value.length; i++) {
    characters.value[i].checked = false;
  }
  // 再勾选
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

// 角色表格选择
const toggleCheck = (char) => {
  // 点击单个角色时，取消所有快捷分组的勾选状态，避免逻辑冲突
  for (let i = 0; i < school_modes.value.length; i++) {
    school_modes.value[i].checked = false;
  }
  char.checked = !char.checked;
};

</script>

<template>
  <div class="page-container">
    <h1>"今天单推谁"GIF生成器</h1>
    <div id="input-container">
      
      <div id="modes-settings">
        <span id="matching-hint">类型选择: </span>
        <div class="radio-group">
          <div v-for="item in modeItems" :key="item.name" class="radio-item">
            <input type="radio" name="check" :checked="item.mark" :value="item.mark" :id="item.name" @change="update_settings(item)">
            <label :for="item.name">{{ item.name }}</label>
          </div>
        </div>
      </div>

      <div class="character-grid">
        <div 
          v-for="char in characters" 
          :key="char.label" 
          class="grid-item"
          :class="{ character_selected: char.checked }" 
          @click="toggleCheck(char)"
        >
          {{ char.label }}
        </div>
      </div>

      <div id="modes-settings">
        <span id="matching-hint">快捷选项: </span>
        <div class="checkbox-group">
          <div v-for="item in school_modes" :key="item.label" class="checkbox-item">
            <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(school_modes)">
            <label :for="item.label">{{ item.label }}</label>
          </div>
        </div>
      </div>

      <div id="button-container">
        <button @click="update_canvas" class="btns primary-btn">绘制GIF图</button>
        <button @click="empty_char" class="btns reset-btn">清空选择</button>
        <button @click="downloadImage" class="btns download-btn">下载GIF图</button>
      </div>
    </div>

    <div id="image-container-wrapper">
      <canvas id="GIF-canvas" ref="canvas" width="400" height="500" style="display: none;"></canvas>
      
      <span v-if="loading" style="text-align: center; display: block; margin: 20px 0;">生成中······</span>
      
      <div v-if="resultGif" class="result-box">
        <img :src="resultGif" class="generated-gif" alt="Result GIF" />
      </div>
    </div>

  </div>
</template>

<style scoped>
/* 全局容器 */
.page-container {
  padding: 10px;
  max-width: 100%;
  box-sizing: border-box;
}

h1 {
  font-family: sans-serif;
  color: #333;
  text-align: center;
  margin-bottom: 50px;
}

/* 角色网格布局 */
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
  grid-auto-rows: 55px; 
  gap: 0;
  width: 100%;
  margin-bottom: 30px;
  border-top: 1px solid #ddd;
  border-left: 1px solid #ddd;
  
  background-image: repeating-linear-gradient(
    to bottom,
    #f9f9f9 0px,
    #f9f9f9 55px, 
    #ffffff 55px,
    #ffffff 110px  
  );
}

.grid-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  line-height: 1.2; 
  user-select: none;
  background-color: transparent; 
}

.character_selected {
  background-color: aquamarine !important;
}

/* 输入控件样式 */
label {
  display: inline-block;
  margin-left: 5px;
  font-weight: 500;
}

input[type="radio"], input[type="checkbox"] {
  vertical-align: middle;
}

#input-container {
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
}

#modes-settings {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

@media (min-width: 600px) {
  #modes-settings {
    flex-direction: row;
    align-items: flex-start;
  }
}

#matching-hint {
  font-weight: bold;
  margin-bottom: 10px;
  margin-right: 5px;
  min-width: 80px;
}

.radio-group, .checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.radio-item, .checkbox-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
  margin-bottom: 5px;
}

/* 按钮样式 */
#button-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 20px;
  margin-bottom: 30px;
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
.reset-btn { background-color: gray; }
.download-btn { background-color: #28a745; }

/* 结果展示区关键样式 */
#image-container-wrapper {
  width: 100%;
  text-align: center;
  padding-bottom: 50px;
}

.result-box {
  display: inline-block;
  max-width: 100%;
}

.generated-gif {
  max-width: 100%;
  height: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border-radius: 4px;
}

</style>