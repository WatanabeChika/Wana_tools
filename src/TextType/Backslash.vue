<script setup>
import { ref } from 'vue';

const inputText = ref('');
const outputText = ref('');

const update_output = () => {
  let input = inputText.value;

  // 去掉命令中的换行符、反斜杠，并将多个空格替换为一个空格
  let new_input = input.replace(/\n/g, ' ').replace(/\\/g, '').replace(/\s+/g, ' ').trim();

  outputText.value = new_input;
};

const update_input = () => {
  let input = outputText.value

  // 将多个空格替换为一个空格，并恢复换行符和反斜杠
  let new_input = input.replace(/\s+/g, ' ').trim().replace(/ /g, ' \\\n');

  inputText.value = new_input;
}

</script>



<template>
  <div id="m2kcontainer">
    <h1>反斜杠</h1>

    <label id="in-out">带反斜杠的命令: </label>
    <textarea type="text" id="inputBox" v-model="inputText" placeholder="sudo rm -rf \ &#10;I \ &#10;dont \ &#10;want \ &#10;backslash" @input="update_output"></textarea>
    
    <label id="in-out">不带反斜杠的命令: </label>
    <textarea type="text" id="outputBox" v-model="outputText" placeholder="sudo rm -rf I dont want backslash" @input="update_input"></textarea>
  </div>
</template>



<style scoped>

h1 {
  font-family: sans-serif;
  color: #333;
  text-align: center;
  margin-bottom: 50px;
}

label {
  display: inline-block;
  margin-bottom: 10px;
  margin-left: 10px;
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
  resize: none; 
  overflow-y: display; 
}

#m2kcontainer {
  width: 100%;
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
