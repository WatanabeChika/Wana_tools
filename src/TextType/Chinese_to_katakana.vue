<script setup>
import { ref } from 'vue';
import { pinyin } from 'pinyin-pro';
import { fin_conv, fin_ini_conv, fin2_conv, num_conv } from './utils.js';

const inputText = ref('');
const outputText = ref('');
const empty = ref(true);
const space = ref(false);
const dot = ref(false);
const number = ref(false);

const modeItems = ref([
  { name: '不分隔', mark: empty },
  { name: '以空格分隔', mark: space },
  { name: '以点分隔', mark: dot }
])

// 数字预处理
function numconv(str) {
  // 匹配数字并转换
  const regex = /([+-]?\b\d+(\.\d+)?\b)/g;
  const res = str.replace(regex, (match) => {
    return num_conv(match);
  });
  return res;
}

// 拼音转片假名
function convert(ini, finh, finb, fint) {
  // 无声母
  if (ini == '') {
    // 特殊：er音
    if (finh == '' && finb == 'e' && fint == 'r')
      return 'ア';
    else
      return fin_conv(finh) + fin_conv(finb) + fin_conv(fint);
  }
  // 有韵头
  else if (finh != '') {
    return fin_ini_conv(ini, finh, true) + fin2_conv(finb + fint);
  }
  // 无韵尾
  else if (fint == '') {
    return fin_ini_conv(ini, finb, false);
  }
  else {
    return fin_ini_conv(ini, finb, true) + fin_conv(fint);
  }
}

const update_output = () => {
  let res = [];
  let input = inputText.value;

  if (!number.value) input = numconv(inputText.value);

  const message = pinyin(input, { type: 'array' });
  const initial = pinyin(input, { pattern: 'initial', type: 'array' });
  const finalhead = pinyin(input, { pattern: 'finalHead', toneType: 'none', v: true, type: 'array' });
  const finalbody = pinyin(input, { pattern: 'finalBody', toneType: 'none', v: true, type: 'array' });
  const finaltail = pinyin(input, { pattern: 'finalTail', toneType: 'none', v: true, type: 'array' });

  for (let i = 0; i < finalbody.length; ++i) {
    if (finalbody[i] == '') {
      res.push(message[i]);
      continue;
    }
    if (i > 0 && finalbody[i - 1] != '') {
      if (space.value) res.push(' ');
      if (dot.value) res.push('・');
      if (empty.value) res.push('');
    }
    res.push(convert(initial[i], finalhead[i], finalbody[i], finaltail[i]));
  }
  outputText.value = res.join('');
};

const update_format = (item) => {
  if (item.name == '不分隔') {
    empty.value = true;
    space.value = false;
    dot.value = false;
  }
  else if (item.name == '以空格分隔') {
    empty.value = false;
    space.value = true;
    dot.value = false;
  }
  else {
    empty.value = false;
    space.value = false;
    dot.value = true;
  }
  update_output();
}

</script>



<template>
  <div id="m2kcontainer">
    <h1 class="tool-title">汉字片假名转换器</h1>
    <label class="field-label" for="inputBox">汉字: </label>
    <textarea id="inputBox" v-model="inputText" placeholder="输入汉字就可以得到对应读音的假名啦！" @input="update_output"></textarea>
    <div class="text-options">
      <label v-for="item in modeItems" :key="item.name" class="option-label">
        <input type="radio" name="kana-format" :checked="item.mark" @change="update_format(item)">{{ item.name }}
      </label>
      <label class="option-label"><input type="checkbox" v-model="number" @change="update_output">保留数字</label>
    </div>
    <label class="field-label" for="outputBox">片假名: </label>
    <textarea id="outputBox" v-model="outputText" placeholder="シュルハンズジウクイドダオドイインドインドジアミンラ！" readonly></textarea>
  </div>
  <div id="notice">
    <p>注意：英文保留原样，将“2”一律读作“二”。</p>
  </div>
</template>



<style scoped>
#m2kcontainer {
  width: 100%;
}

.field-label {
  display: block;
  text-align: left;
  margin: 24px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

textarea {
  display: block;
  width: 100%;
  height: 210px;
  padding: 12px 14px;
  resize: vertical;
  overflow-y: auto;
}

.text-options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin: 18px 0;
  text-align: left;
}

.option-label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
}

.convert-btn {
  margin-left: auto;
}

#notice {
  width: 100%;
  text-align: left;
}

@media (max-width: 600px) {
  textarea {
    height: 180px;
  }

  .convert-btn {
    margin-left: 0;
  }
}
</style>
