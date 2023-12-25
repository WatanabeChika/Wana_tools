<script setup>
import {ref} from 'vue';
import LoveLiveEditor from './LoveliveEditor.vue'
import LoveliveSSEditor from './LoveliveSSEditor.vue'

const currentPage = ref(LoveLiveEditor)

const navItems = ref([
  { name: 'LoveLive', path: LoveLiveEditor },
  { name: 'LLSS', path: LoveliveSSEditor },
  // { name: 'Contact', path: LoveLiveEditor },
]);

</script>



<template>
  <div style="display: flex;">
    <div id="navbar">
        <div class="container">
            <button v-for="item in navItems" :key="item.name" @click="currentPage = item.path"
               :class="['navbutton', {active: currentPage === item.path}]">
                {{ item.name }}
            </button>
        </div>
    </div>
    <div id="editor-container">
      <component :is="currentPage"></component>
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
.navbutton.active{
  background-color: #D9D99B;
}

/* 编辑器 */
#editor-container {
  width: 800px;
  margin-top: 50px;
  margin: auto;
  margin-top: 50px;
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