<script setup>
import { ref, defineAsyncComponent } from 'vue';

import Homepage from './Homepage.vue';

const currentPage = ref(Homepage);

const imageItems = ref([
  { name: 'LoveLive', path: defineAsyncComponent(() => import('./ImageType/LoveLiveEditor.vue')) },
  { name: 'LLSS', path: defineAsyncComponent(() => import('./ImageType/LoveLiveSSEditor.vue')) },
]);

const textItems = ref([
  { name: 'Chinkana', path: defineAsyncComponent(() => import('./TextType/Chinese_to_katakana.vue')) },
  { name: 'Leetspeak', path: defineAsyncComponent(() => import('./TextType/Leetspeak.vue')) },
  { name: 'Backslash', path: defineAsyncComponent(() => import('./TextType/Backslash.vue')) },
  { name: 'Deepseek', path: defineAsyncComponent(() => import('./TextType/Deepseek.vue')) },
]);

const CalcItems = ref([
  { name: 'Decomposition', path: defineAsyncComponent(() => import('./CalcType/SudokuComb.vue')) },
]);

const memeItems = ref([
  { name: 'Matching', path: defineAsyncComponent(() => import('./ImageType/MatchingMemeEditor.vue')) },
  { name: 'OshiGIF', path: defineAsyncComponent(() => import('./ImageType/GIFMemeEditor.vue')) },
]);

const gameItems = ref([
  { name: 'Morse', path: defineAsyncComponent(() => import('./GameType/Morse.vue')) },
]);


const Items = ref([
  { type: 'Image', apps: imageItems },
  { type: 'Text', apps: textItems },
  { type: 'Calculation', apps: CalcItems },
  { type: 'Meme', apps: memeItems },
  { type: 'Game', apps: gameItems },
]);

</script>



<template>
  <div id="navbar">
      <img src="../public/favicon.ico" alt="logo" width="50" height="50" style="margin-right: 10px; margin-left: 10px;"
        @click="currentPage = Homepage" />
      <el-dropdown v-for="item in Items" :key="item.type">
          <el-button class="navbutton">
            {{ item.type }}
          </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="page in item.apps" :key="page.name" @click="currentPage = page.path"
              :class="['dropdownbutton', {active: currentPage === page.path}]">
              {{ page.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
  </div>

  <div id="editor-container">
    <component :is="currentPage"></component>
  </div>
</template>



<style>
/* 导航栏 */
#navbar {
  height: 60px;
  background-color: #dceef5;
  padding: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  overflow-x: auto; /* Enable horizontal scrolling */
  white-space: nowrap; /* Prevent wrapping */
  align-items: center;
}
.navbutton {
  display: inline-block;
  margin: 0px 5px 0px 5px;
  background-color: #dceef5;
  color: black;
  padding: 18px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  height: 100%;
}
.dropdownbutton {
  margin: 2px 10px 2px 10px;
  background-color: #ffffff;
  color: black;
  padding: 13px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  height: 100%;
}
.dropdownbutton.active{
  background-color: #d5cccc;
}

/* 编辑器 */
#editor-container {
  max-width: 1000px;
  margin: auto;
  margin-top: 20px;
  text-align: center;
  background-color: #f5f5f5;
  padding: 20px;
  border: 1px solid #e1e4e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

</style>