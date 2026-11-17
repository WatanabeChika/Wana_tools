<script setup>
import { ref, onMounted, onActivated, onDeactivated, onBeforeUnmount } from 'vue';

const morseCodeMap = {
  'A': '· -', 'B': '- · · ·', 'C': '- · - ·', 'D': '- · ·', 'E': '·', 'F': '· · - ·',
  'G': '- - ·', 'H': '· · · ·', 'I': '· ·', 'J': '· - - -', 'K': '- · -', 'L': '· - · ·',
  'M': '- -', 'N': '- ·', 'O': '- - -', 'P': '· - - ·', 'Q': '- - · -', 'R': '· - ·',
  'S': '· · ·', 'T': '-', 'U': '· · -', 'V': '· · · -', 'W': '· - -', 'X': '- · · -',
  'Y': '- · - -', 'Z': '- - · ·'
};

const words = [
  'ABOVE', 'ACTOR', 'ADULT', 'AFTER', 'AGENT', 'ALARM', 'APPLE', 'BEACH',
  'BEARD', 'BEAST', 'BECOME', 'BEGIN', 'BEING', 'BELOW', 'BIRTH', 'BLACK',
  'BLOCK', 'BOARD', 'BRAIN', 'BREAD', 'BRICK', 'BRING', 'BROWN', 'BUILD',
  'CANDY', 'CHAIR', 'CHEST', 'CHILD', 'CLEAN', 'CLEAR', 'CLOUD', 'COAST',
  'COLOR', 'COURT', 'COVER', 'CROWD', 'DANCE', 'DIRTY', 'DOUBT', 'DREAM',
  'DRINK', 'EARTH', 'EMPTY', 'ENJOY', 'ENTER', 'EVERY', 'FAITH', 'FALSE',
  'FAULT', 'FIELD', 'FIFTH', 'FINAL', 'FLOOR', 'FLOWER', 'FORCE', 'FRUIT',
  'GLASS', 'GRASS', 'GREEN', 'GROUP', 'GUIDE', 'HAPPY', 'HEART', 'HONEY',
  'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAL', 'INPUT', 'JELLY', 'JEWEL',
  'JUICE', 'KNIFE', 'LARGE', 'LAUGH', 'LEMON', 'LIGHT', 'MAGIC', 'MARCH',
  'MONEY', 'MONTH', 'MUSIC', 'NIGHT', 'NOISE', 'NORTH', 'OCEAN', 'PAPER',
  'PARTY', 'PEACE', 'PHONE', 'PIANO', 'PLANT', 'PLATE', 'RADIO', 'RAINY',
  'RIVER', 'ROBOT', 'ROUND', 'SALAD', 'SHAPE', 'SHARK', 'SHEEP', 'SHEET'
];

const currentWord = ref('');
const isLightOn = ref(false);
const userAnswer = ref('');
const result = ref('');

// 生成随机单词
const generateRandomWord = () => {
  return words[Math.floor(Math.random() * words.length)];
};

// 将单词转换为摩斯码序列
const wordToMorse = (word) => {
  return word.split('').map(char => {
    return morseCodeMap[char] || ''
  }).join('    '); // 字母间隔4个单位
};

// 开始摩斯码显示
let timer = null;
let resultTimer = null;
const stopMorseDisplay = () => { clearTimeout(timer); isLightOn.value = false; };
const stopTimers = () => { stopMorseDisplay(); clearTimeout(resultTimer); };
const startMorseDisplay = () => {
  stopMorseDisplay();
  let index = 0;
  const sequence = wordToMorse(currentWord.value).split('');

  const playNext = () => {
    if (index >= sequence.length) {
      index = 0;
      timer = setTimeout(playNext, 3000); // 单词间隔
      return;
    }

    const char = sequence[index];
    let duration = 0;

    if (char === '·') {
      isLightOn.value = true;
      duration = 300; // 点持续时间
    } else if (char === '-') {
      isLightOn.value = true;
      duration = 1000; // 横线持续时间
    } else {
      isLightOn.value = false;
      duration = 300; // 间隔时间
    }

    timer = setTimeout(() => {
      isLightOn.value = false;
      index++;
      timer = setTimeout(playNext, 0); // 符号间隔
    }, duration);
  };

  playNext();
};

// 检查答案
const checkAnswer = () => {
  const answer = userAnswer.value.toUpperCase().trim();
  result.value = answer === currentWord.value ? '正确！🎉' : '错误，再试试！';
  clearTimeout(resultTimer);
  resultTimer = setTimeout(() => result.value = '', 2000);
};

// 查看答案
const showAnswer = () => {
  result.value = `答案是：${currentWord.value}`;
  clearTimeout(resultTimer);
  resultTimer = setTimeout(() => result.value = '', 10000);
};

// 切换单词
const switchWord = () => {
  currentWord.value = generateRandomWord();
  userAnswer.value = '';
  result.value = '';
  stopTimers();
  startMorseDisplay();
};

const resumeDisplay = () => {
  if (!currentWord.value) currentWord.value = generateRandomWord();
  startMorseDisplay();
};
onMounted(resumeDisplay);
onActivated(resumeDisplay);
onDeactivated(stopTimers);
onBeforeUnmount(stopTimers);
</script>


<template>
  <h1 class="tool-title">摩斯电码</h1>
  <div class="container">
    <div class="main-area">
      <div class="morse-container">
        <div class="light" :class="{ on: isLightOn }"></div>
      </div>
      <div class="controls">
        <input v-model="userAnswer" placeholder="输入你看到的单词" @keyup.enter="checkAnswer">
        <div class="buttons">
          <button @click="checkAnswer">提交答案</button>
          <button @click="showAnswer" class="primary-btn">查看答案</button>
          <button @click="switchWord" class="neutral-button">切换单词</button>
        </div>
        <div class="result">{{ result }}</div>
      </div>
    </div>

    <div class="reference">
      <h3>摩斯密码表</h3>
      <div class="code-table">
        <div v-for="(value, key) in morseCodeMap" :key="key" class="code-item">
          <span>{{ key }}</span>
          <span>{{ value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
}

.container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 0;
}

.main-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.morse-container {
  height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--text);
  border-radius: var(--radius);
  order: 1;
}

.controls {
  order: 2;
  background: white;
  padding: 20px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.reference {
  text-align: left;
  background: white;
  padding: 20px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  min-width: 0;
}

.light {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #444;
  transition: background-color 0.1s;
}

.light.on {
  background-color: yellow;
  box-shadow: 0 0 18px #ffff0040;
}

.reference h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px;
}

.code-table {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.code-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--surface-soft);
  border-radius: var(--radius);
  font-size: 14px;
}

.code-item span:first-child {
  font-weight: 600;
  margin-right: 8px;
}

.code-item span:last-child {
  font-family: Consolas, monospace;
  font-size: 16px;
  white-space: nowrap;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.result {
  margin-top: 15px;
  min-height: 24px;
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 800px) {
  .container {
    grid-template-columns: 1fr;
  }

  .main-area {
    order: 1;
  }

  .reference {
    order: 2;
  }
}

@media (max-width: 768px) {
  .container {
    gap: 24px;
  }

  .morse-container {
    height: 200px;
  }

  .code-table {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {

  .main-area,
  .reference {
    min-width: auto;
  }

  .code-table {
    grid-template-columns: repeat(2, 1fr);
  }

  .buttons button {
    flex: 1 1 auto;
  }
}
</style>
