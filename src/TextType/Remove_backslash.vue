<script setup>
import { ref } from 'vue';

const inputText = ref('');
const outputText = ref('');

const update_output = () => {
  let input = inputText.value;

  // 去掉命令中的换行符和反斜杠
  let new_input = input.replace(/\\\n/g, '').replace(/\n/g, ' ').trim();

  outputText.value = new_input;
};

</script>

<template>
  <div id="m2kcontainer">
    <h1>去掉反斜杠</h1>

    <label id="in-out">命令输入: </label>
    <textarea type="text" id="inputBox" v-model="inputText" placeholder="sudo rm -rf&#10;I \ &#10;dont \ &#10;want \ &#10;backslash" @input="update_output"></textarea>
    
    <label id="in-out">转换后的命令: </label>
    <textarea type="text" id="outputBox" v-model="outputText" placeholder="sudo rm -rf I dont want backslash" readonly></textarea>
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
