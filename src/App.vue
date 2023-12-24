<script setup>
import {ref} from 'vue';
import LoveLiveEditor from './LoveliveEditor.vue'

const navItems = ref([
  { name: 'LoveLive!', path: '/' },
  { name: 'LoveLive! Sunshine!!', path: '/' },
  { name: 'Contact', path: '/' },
]);

</script>



<template>
  <div style="display: flex;">
    <div id="navbar">
        <div class="container">
            <button class="navbutton" v-for="item in navItems" :key="item.name">
                {{ item.name }}
            </button>
        </div>
    </div>
    <div id="editor-container">
      <LoveLiveEditor />
    </div>
  </div>
</template>



<style>
/* 导航栏 */
#navbar {
  height: 100vh;
  width: 150px;
  z-index: 1;
  top: 0;
  left: 0;
  background-color: #F5F5DC;
  overflow-x: hidden;
  padding-top: 20px;
}
.container {
  padding: 10px;
  text-align: center;
}
.navbutton {
  margin: 10px 0px 10px 0px;
  background-color: #F5F5DC;
  color: black;
  padding: 16px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  width: 100%;
}
.navbutton:hover{
  background-color: #D9D99B;
}

/* 编辑器 */
#editor-container {
  width: 800px;
  margin-top: 50px;
  margin: auto;
  margin-top: 50px;
  text-align: center;
  background-color: #fff;
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