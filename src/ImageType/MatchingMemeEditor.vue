<script setup>
import { ref } from 'vue';
import { loadFonts } from '../utils/resources';
import { useResource } from '../utils/useResource';
import ResourceStatus from '../components/ResourceStatus.vue';
import { fillCanvasText, loadImage, shuffleLogArray } from './utils';
import { LoveLive_characters, LoveLive_groups, LoveLive_support_colors, LoveLive_character_birthdays } from './data';

// -------变量声明-------
const canvas = ref(null);
const canvas_ans = ref(null);

const character_color = ref(true);
const character_birthday = ref(false);
const character_icon = ref(false);
const eye_color = ref(false);
const black_and_white = ref(false);

const { ready: fontsReady, loading: fontLoading, error: fontError, retry: retryFonts } = useResource(() => loadFonts('KaiTi'), () => update_canvas());

const baseFont = 'KaiTi';
const titleFont = `bold 50px ${baseFont}`;
const normalFont = `35px ${baseFont}`;
const basicPath = 'images/'

const bgColor = 'white';
const fontColor = 'black';
const titleText1 = '连线题：'
const titleText2 = '请将各角色连至其对应的'

const school_modes = ref(LoveLive_groups.map(item => ({ ...item })));
const color_modes = ref(LoveLive_support_colors.map(item => ({ ...item })));
const birthday_modes = ref(LoveLive_character_birthdays.map(item => ({ ...item })));
const characters = ref(LoveLive_characters.map(item => ({ ...item })));

const modeItems = ref([
  { name: '应援色', mark: character_color },
  { name: '生日', mark: character_birthday },
  { name: '图标', mark: character_icon },
  { name: '瞳色', mark: eye_color },
]);

const loading = ref(false);
const generated = ref(false);
const renderError = ref('');



// -------主要功能-------
// 更新Canvas
async function update_canvas() {
  if (loading.value || !fontsReady.value) return;
  loading.value = true;
  renderError.value = '';
  // Render offscreen and commit only a complete question/answer pair.
  const question = document.createElement('canvas');
  const answer = document.createElement('canvas');
  question.width = answer.width = 1000;
  const ctx = question.getContext('2d');
  const ctxAns = answer.getContext('2d');
  const originHeight = 200;
  const eyeMode = eye_color.value;
  const colorMode = character_color.value;
  const birthdayMode = character_birthday.value;
  const iconMode = character_icon.value;
  const grayscale = black_and_white.value;
  const themeName = modeItems.value.find(item => item.mark)?.name || '';
  try {
    // 获取选中的角色（以调整画布高度）
    let charList = [];
    for (let i = 0; i < characters.value.length; i++) {
      if (characters.value[i].checked) {
        charList.push(characters.value[i]);
      }
    }
    question.height = originHeight + charList.length * 175 + 50;
    answer.height = originHeight + charList.length * 175 + 50;

    // 白色背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, question.width, question.height);

    // 标题 功能嵌入
    fillCanvasText(ctx, fontColor, titleFont, false, 520, 60, titleText1);
    fillCanvasText(ctx, fontColor, titleFont, false, 410, 135, titleText2);
    fillCanvasText(ctx, fontColor, titleFont, false, 760, 135, themeName);

    // 左半部分
    const basicX = 170;
    const basicY = 300;
    for (let i = 0; i < charList.length; i++) {
      // 瞳色连线写角色名
      if (eyeMode) {
        fillCanvasText(ctx, fontColor, normalFont, false, basicX - 30, basicY + i * 175, charList[i].label);
      }
      // 其余情况绘制角色头像
      else {
        const img = await loadImage(basicPath + 'characters/' + charList[i].Eng + '.png');
        ctx.drawImage(img, basicX - 80, basicY + i * 175 - 70, 130, 130);
      }
    }

    // 右半部分
    const [themeList, relation] = shuffleLogArray(charList, true);
    // 应援色 -> 色块
    if (colorMode) {
      for (let i = 0; i < themeList.length; i++) {
        ctx.fillStyle = themeList[i].color;
        ctx.fillRect(basicX + 570, basicY + i * 175 - 50, 180, 100);
      }
    }
    // 生日 -> 文字
    else if (birthdayMode) {
      for (let i = 0; i < themeList.length; i++) {
        fillCanvasText(ctx, fontColor, normalFont, false, basicX + 640, basicY + i * 175, themeList[i].birthday);
      }
    }
    // 图标 -> 图片
    else if (iconMode) {
      // 调整图片路径

      for (let i = 0; i < themeList.length; i++) {
        const img = await loadImage(basicPath + (iconMode ? 'character_icons/' : 'eye_color/') + themeList[i].Eng + '.png');
        if (grayscale) {
          ctx.filter = 'grayscale(100%)';
        }
        ctx.drawImage(img, basicX + 570, basicY + i * 175 - 70, 130, 130);
        ctx.filter = 'none';
      }

    }
    // 瞳色 -> 图片
    else if (eyeMode) {
      // 调整图片路径

      for (let i = 0; i < themeList.length; i++) {
        const img = await loadImage(basicPath + (iconMode ? 'character_icons/' : 'eye_color/') + themeList[i].Eng + '.png');
        ctx.drawImage(img, basicX + 570, basicY + i * 175 - 70, 130, 130);
      }

    }

    // 底部水印
    ctx.fillStyle = '#999';
    ctx.font = `14px ${baseFont}`;
    ctx.textAlign = 'right';
    ctx.fillText('Created by Wanakachi', question.width - 8, question.height - 10);

    // 连线（答案）
    ctxAns.drawImage(question, 0, 0);
    for (let i = 0; i < relation.length; i++) {
      ctxAns.beginPath();
      ctxAns.moveTo(basicX + 75, basicY + relation[i][0] * 175);
      ctxAns.lineTo(basicX + 550, basicY + relation[i][1] * 175);
      ctxAns.strokeStyle = 'black';
      ctxAns.lineWidth = 3;
      ctxAns.stroke();
    }
    if (!canvas.value || !canvas_ans.value) return;
    canvas.value.height = question.height;
    canvas_ans.value.height = answer.height;
    canvas.value.getContext('2d').drawImage(question, 0, 0);
    canvas_ans.value.getContext('2d').drawImage(answer, 0, 0);
    generated.value = true;
  } catch (error) {
    renderError.value = error.message || '图片绘制失败';
  } finally {
    loading.value = false;
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
        if (character_icon.value && (!characters.value[index].icon)) {
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
    renderError.value = "该角色暂无生日信息！";  // 高咲侑暂无生日信息
    return;
  }
  if (character_icon.value && (!char.icon)) {
    renderError.value = "该角色暂无图标信息！";  // 高咲侑暂无图标信息
    return;
  }
  if (eye_color.value && (!char.eye)) {
    renderError.value = "该角色暂无瞳色信息！";  // 薇恩、冬毬、莲104期暂无瞳色信息
    return;
  }
  char.checked = !char.checked;
};


</script>



<template>
  <div class="page-container">
    <ResourceStatus :loading="fontLoading" :error="fontError" label="楷体字体" @retry="retryFonts" />
    <p v-if="renderError" class="operation-error" role="alert">{{ renderError }}可点击绘制按钮重试。</p>
    <h1 class="tool-title">LoveLive!连线梗图制作器</h1>
    <div id="input-container">
      <div id="modes-settings">
        <span id="matching-hint">主题选择: </span>
        <div class="radio-group">
          <div v-for="item in modeItems" :key="item.name" class="radio-item">
            <input type="radio" name="check" :checked="item.mark" :value="item.mark" :id="item.name"
              @change="update_settings(item)">
            <label :for="item.name">{{ item.name }}</label>
          </div>
        </div>
      </div>

      <div class="character-grid">
        <div v-for="char in characters" :key="char.label" class="grid-item"
          :class="{ character_selected: char.checked }" role="button" tabindex="0" :aria-pressed="char.checked"
          @keydown.enter="toggleCheck(char)" @keydown.space.prevent="toggleCheck(char)" @click="toggleCheck(char)">
          {{ char.label }}
        </div>
      </div>

      <div id="modes-settings">
        <span id="matching-hint">快捷选项: </span>
        <div class="checkbox-group">
          <div v-if="character_color" v-for="item in color_modes" :key="item.label" class="checkbox-item">
            <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(color_modes)">
            <label :for="item.label">{{ item.label }}</label>
          </div>
          <div v-if="character_birthday" v-for="item in birthday_modes" :key="item.label" class="checkbox-item">
            <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(birthday_modes)">
            <label :for="item.label">{{ item.label }}</label>
          </div>
          <div v-if="eye_color || character_icon" v-for="item in school_modes" :key="item.label" class="checkbox-item">
            <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(school_modes)">
            <label :for="item.label">{{ item.label }}</label>
          </div>
        </div>
      </div>

      <div id="modes-settings" v-if="character_icon">
        <span id="matching-hint">难度调整: </span>
        <div>
          <input v-model="black_and_white" type="checkbox" id="black-and-white">
          <label for="black-and-white">黑白图标</label>
        </div>
      </div>

      <div id="button-container">
        <button @click="update_canvas" :disabled="loading || !fontsReady" class="btns primary-btn">绘制图片</button>
        <button @click="empty_char" class="btns reset-btn">清空选择</button>
        <button @click="downloadImage" :disabled="!generated || loading" class="btns download-btn">下载图片</button>
        <button @click="downloadAnswer" :disabled="!generated || loading" class="btns download-btn">下载答案</button>
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
  </div>
</template>



<style scoped>
.operation-error {
  color: #b42318;
  text-align: left;
}

.page-container {
  padding: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* 角色网格布局 */
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
  grid-auto-rows: 46px;
  gap: 0;
  width: 100%;
  margin-bottom: 30px;
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);


}

.grid-item {
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0 4px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  cursor: pointer;

  line-height: 1.2;
  user-select: none;
  background-color: transparent;
}

.grid-item:hover {
  background: var(--surface-soft);
}

.grid-item {
  font-size: 14px;
  transition: background-color 150ms;
}

.character_selected {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
  box-shadow: inset 0 0 0 1px var(--accent);
}

label {
  display: inline-block;
  margin-left: 5px;
  font-weight: 500;
}

input[type="radio"],
input[type="checkbox"] {
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
  font-weight: 600;
  margin-bottom: 10px;
  margin-right: 5px;
  min-width: 80px;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.radio-item,
.checkbox-item {
  display: flex;
  align-items: center;
  margin-right: 8px;
  margin-bottom: 5px;
}

#button-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 10px;
  margin-bottom: 30px;
}

#canvas-container {
  width: 100%;
  text-align: center;
  overflow: hidden;
}

canvas {
  max-width: 100%;
  height: auto !important;
}

#notice {
  width: 100%;
  text-align: left;
  margin-top: 30px;
  font-size: 12px;
}

p {
  font-family: inherit;
  color: var(--muted);
  margin: 5px 0;
}
</style>
