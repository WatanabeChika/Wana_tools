<script setup>
import { ref } from 'vue';
import { pinyin } from 'pinyin-pro';
import { fin_conv, fin_ini_conv, fin2_conv } from './utils.js';

const inputText = ref('');
const outputText = ref('');
const empty = ref(true);
const space = ref(false);
const dot = ref(false);

const modeItems = ref([
  { name: '不分隔', mark: empty},
  { name: '以空格分隔', mark: space},
  { name: '以点分隔', mark: dot}
])


function convert(ini, finh, finb, fint) {
  // 没有声母
  if (ini == '') {
    // 特殊：er音
    if (finh == '' && finb == 'e' && fint == 'r') 
      return 'ア';
    else
      return fin_conv(finh) + fin_conv(finb) + fin_conv(fint);
  }
  // 有韵头
  else if (finh != '') {
    return fin_ini_conv(ini, finh, true) + fin2_conv(finb+fint);
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
  const message = pinyin(inputText.value, { type: 'array' });
  const initial = pinyin(inputText.value, { pattern: 'initial', type: 'array' });
  const finalhead = pinyin(inputText.value, { pattern: 'finalHead', toneType: 'none', v: true, type: 'array' });
  const finalbody = pinyin(inputText.value, { pattern: 'finalBody', toneType: 'none', v: true, type: 'array' });
  const finaltail = pinyin(inputText.value, { pattern: 'finalTail', toneType: 'none', v: true, type: 'array' });
  console.log(message, initial, finalhead, finalbody, finaltail);
  console.log(empty.value, space.value, dot.value)
  for (let i = 0; i < finalbody.length; ++i) {
    if (finalbody[i] == '') {
      res.push(message[i]);
      continue;
    }
    if (i > 0 && finalbody[i-1] != '') {
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
    <h1>汉字片假名转换器</h1>
    <label id="in-out">汉字: </label>
    <textarea type="text" id="inputBox" v-model="inputText" placeholder="输入汉字就可以得到对应读音的假名啦！" @input="update_output"></textarea>
    <div v-for="item in modeItems" :key="item.name" id="settings">
          <label :for="item.name">{{ item.name }}</label>
          <input type="radio" name="check" :checked="item.mark" :value="item.mark" :id="item.name" @change="update_format(item)">
    </div>
    <label id="in-out">片假名: </label>
    <textarea type="text" id="outputBox" v-model="outputText" placeholder="シュルハンズジウクイドダオドイインドインドジアミンラ！" readonly></textarea>
  </div>
</template>



<style>
#m2kcontainer {
  width: 100%;
}
#settings {
  display: inline-block;
  margin-right: 20px;
  margin-top: 30px;
}
h1 {
  color: #333;
  text-align: center;
  margin-bottom: 50px;
}
label#in-out{
  display: block;
  text-align: left;
  margin-top: 30px;
  margin-bottom: 10px;
  margin-left: 5px;
  font-weight: 600;
}
textarea {
  width: 100%;
  height: 230px;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  resize: none; /* 禁止用户手动调整大小 */
  overflow-y: display; /* 隐藏滚动条 */
}


</style>