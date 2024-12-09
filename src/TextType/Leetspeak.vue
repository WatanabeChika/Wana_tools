<script setup>
import { ref } from 'vue';
import { isLetter } from './utils';

const inputText = ref('');
const outputText = ref('');
const empty = ref(true);
const space = ref(false);

const modeItems = ref([
  { name: '保持原格式', mark: empty},
  { name: '下划线格式', mark: space},
])

const update_output = () => {
    let input = inputText.value;
    // 基本替换
    let new_input = input.replace(/A|a/g, '4').replace(/E|e/g, '3').replace(/I|i/g, '1')
                    .replace(/O|o/g, '0').replace(/Z|z/g, '2');
    // 特殊替换（s,t和l）
    for (let i = 0; i < new_input.length; i++) {
      switch (new_input[i]) {
        case 's':
        case 'S':
            if (Math.random() < 0.33) {
                new_input = new_input.slice(0, i) + '5' + new_input.slice(i+1);
            } else if (Math.random() < 0.66) {
                new_input = new_input.slice(0, i) + '$' + new_input.slice(i+1);
            }
            break;
        case 't':
        case 'T':
            if (Math.random() < 0.5) {
                new_input = new_input.slice(0, i) + '7' + new_input.slice(i+1);
            }
            break;
        case 'l':
            if (i > 0 && i < new_input.length-1 && isLetter(new_input[i-1]) && isLetter(new_input[i+1])) {
                    new_input = new_input.slice(0, i) + '1' + new_input.slice(i+1);
                }
            break;
        default:
            break;
      }
    }
    // 字符大小写随机化
    for (let i = 0; i < new_input.length; i++) {
        if (Math.random() > 0.75) {
            new_input = new_input.slice(0, i) + new_input[i].toUpperCase() + new_input.slice(i+1);
        }
    }
    // 下划线输出模式
    if (space.value) {
        new_input = new_input.replace(/[^A-Za-z0-9|$]/g, '_');
        // 去掉头尾下划线，连续下划线合并
        new_input = new_input.replace(/_+/g, '_').replace(/^_|_$/g, '');
    }
    outputText.value = new_input;
}

const update_format = (item) => {
  if (item.name == '保持原格式') {
    empty.value = true;
    space.value = false;
  }
  else if (item.name == '下划线格式') {
    empty.value = false;
    space.value = true;
  }
  update_output();
}

</script>



<template>
  <div id="m2kcontainer">
    <h1>Leetspeak转换器</h1>
    <label id="in-out">英文文段: </label>
    <textarea type="text" id="inputBox" v-model="inputText" placeholder="I love leetspeak!" @input="update_output"></textarea>
    <div v-for="item in modeItems" :key="item.name" id="settings">
      <label :for="item.name">{{ item.name }}</label>
      <input type="radio" name="check" :checked="item.mark" :value="item.mark" :id="item.name" @change="update_format(item)">
    </div>
    <label id="in-out">Leetspeak文段: </label>
    <textarea type="text" id="outputBox" v-model="outputText" placeholder="1 l0v3 l337$p34k!" readonly></textarea>
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
#in-out{
  display: block;
  text-align: left;
  margin-top: 30px;
  margin-bottom: 10px;
  margin-left: 5px;
  font-weight: 600;
}

</style>


