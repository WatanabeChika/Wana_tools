<script setup>
import {ref} from 'vue';
import LoveLiveEditor from './Logo/LoveLiveEditor.vue'
import LoveLiveSSEditor from './Logo/LoveLiveSSEditor.vue'
import Chinkana from './Text/Chinese_to_katakana.vue'

const currentPage = ref(LoveLiveEditor)

const logoItems = ref([
  { name: 'LoveLive', path: LoveLiveEditor },
  { name: 'LLSS', path: LoveLiveSSEditor },
]);

const textItems = ref([
  { name: 'Chinkana', path: Chinkana},
]);


const Items = ref([
  { type: 'Logo', apps: logoItems },
  { type: 'Text', apps: textItems },
]);

</script>



<template>
  <div id="navbar">
    <div class="container">
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
  align-items: center;
}
.container {
  padding: 10px;
  text-align: center;
}
.navbutton {
  margin: 0px 15px 0px 15px;
  background-color: #dceef5;
  color: black;
  padding: 16px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  height: 100%;
}
.dropdownbutton {
  margin: 0px 15px 0px 15px;
  background-color: #ffffff;
  color: black;
  padding: 16px;
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