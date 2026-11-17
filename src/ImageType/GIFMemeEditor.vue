<script setup>
import { ref, onMounted } from 'vue'
import { loadFonts } from '../utils/resources';
import { useResource } from '../utils/useResource';
import ResourceStatus from '../components/ResourceStatus.vue';
import { createGIF } from 'gifshot'
import { fillCanvasText, loadImage } from './utils';
import { LoveLive_characters, LoveLive_groups } from './data';

// ------- 变量声明 -------
const canvas = ref(null);
const renderError = ref('');
const loading = ref(false);
const resultGif = ref(null);

const anime = ref(true);
const seiyuu = ref(false);

const { ready: fontsReady, loading: fontLoading, error: fontError, retry: retryFonts } = useResource(() => loadFonts('KaiTi'));
const titleFont = 'bold 50px KaiTi';
const basicPath = 'images/'

const bgColor = 'white';
const fontColor = 'black';
const titleText = '今天单推谁？'

const characters = ref(LoveLive_characters.map(item => ({ ...item })));
const school_modes = ref(LoveLive_groups.map(item => ({ ...item })));

const modeItems = ref([
  { name: '角色', mark: anime },
  // { name: '声优', mark: seiyuu },
]);

let ctx;

// ------- 主要逻辑 -------

async function update_canvas() {
  if (loading.value || !fontsReady.value) return;
  const selected = characters.value.filter(char => char.checked);
  if (!selected.length) { renderError.value = '请至少选择一个角色'; return; }
  const imgPath = basicPath + (anime.value ? 'characters/' : 'seiyuus/');
  loading.value = true;
  renderError.value = '';
  try {
    const frames = [];
    for (const char of selected) {
      const img = await loadImage(imgPath + char.Eng + '.png');
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
      fillCanvasText(ctx, fontColor, titleFont, false, 210, 75, titleText);
      ctx.drawImage(img, 48, 130, 300, 300);
      frames.push(canvas.value.toDataURL('image/png'));
    }
    resultGif.value = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('GIF 生成超时')), 90000);
      try {
        createGIF({ images: frames, gifWidth: 400, gifHeight: 500 }, result => {
          clearTimeout(timer);
          if (result.error) reject(new Error(result.errorMsg || 'GIF 生成失败'));
          else resolve(result.image);
        });
      } catch (error) { clearTimeout(timer); reject(error); }
    });
  } catch (error) {
    renderError.value = error.message || 'GIF 生成失败';
  } finally {
    loading.value = false;
  }
}

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
onMounted(() => {
  ctx = canvas.value.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
});

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
    <ResourceStatus :loading="fontLoading" :error="fontError" label="楷体字体" @retry="retryFonts" />
    <p v-if="renderError" class="operation-error" role="alert">{{ renderError }}，可点击绘制按钮重试。</p>
    <h1 class="tool-title">"今天单推谁"GIF生成器</h1>
    <div id="input-container">

      <div id="modes-settings">
        <span id="matching-hint">类型选择: </span>
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
          <div v-for="item in school_modes" :key="item.label" class="checkbox-item">
            <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(school_modes)">
            <label :for="item.label">{{ item.label }}</label>
          </div>
        </div>
      </div>

      <div id="button-container">
        <button @click="update_canvas" :disabled="loading || !fontsReady" class="btns primary-btn">绘制GIF图</button>
        <button @click="empty_char" :disabled="loading" class="btns reset-btn">清空选择</button>
        <button @click="downloadImage" :disabled="loading || !resultGif" class="btns download-btn">下载GIF图</button>
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
.operation-error {
  color: #b42318;
  text-align: left;
}

/* 全局容器 */
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

/* 输入控件样式 */
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

/* 按钮样式 */
#button-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 10px;
  margin-bottom: 30px;
}

/* 结果展示区关键样式 */
#image-container-wrapper {
  width: 100%;
  text-align: center;
  padding-bottom: 12px;
}

.result-box {
  display: inline-block;
  max-width: 100%;
}

.generated-gif {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--border);
  border-radius: 4px;
}
</style>
