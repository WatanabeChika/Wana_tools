<script setup>
import {ref} from 'vue';
import LoveLive from './ImageType/LoveLiveEditor.vue'
import LLSS from './ImageType/LoveLiveSSEditor.vue'
import MatchingMeme from './ImageType/MatchingMemeEditor.vue'
import GIFMeme from './ImageType/GIFMemeEditor.vue'
import Chinkana from './TextType/Chinese_to_katakana.vue'
import Leetspeak from './TextType/Leetspeak.vue';
import Backslash from './TextType/Backslash.vue';
import Decomposition from './CalcType/SudokuComb.vue';
import Morse from './GameType/Morse.vue';

const currentPage = ref(Morse)

const imageItems = ref([
  { name: 'LoveLive', path: LoveLive },
  { name: 'LLSS', path: LLSS },
]);

const textItems = ref([
  { name: 'Chinkana', path: Chinkana },
  { name: 'Leetspeak', path: Leetspeak },
  { name: 'Backslash', path: Backslash },
]);

const CalcItems = ref([
  { name: 'Decomposition', path: Decomposition },
]);

const memeItems = ref([
  { name: 'Matching', path: MatchingMeme },
  { name: 'OshiGIF', path: GIFMeme },
]);

const gameItems = ref([
  { name: 'Morse', path: Morse },
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