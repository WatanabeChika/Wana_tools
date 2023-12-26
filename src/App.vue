<script setup>
import {ref} from 'vue';
import LoveLiveEditor from './LoveLiveEditor.vue'
import LoveLiveSSEditor from './LoveLiveSSEditor.vue'

const currentPage = ref(LoveLiveEditor)

const navItems = ref([
  { name: 'LoveLive', path: LoveLiveEditor },
  { name: 'LLSS', path: LoveLiveSSEditor },
  // { name: 'Contact', path: LoveLiveEditor },
]);

</script>



<template>
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
</template>



<style>
/* 导航栏 */
#navbar {
  height: 60px;
  background-color: #F5F5DC;
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
  background-color: #F5F5DC;
  color: black;
  padding: 16px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  height: 100%;
}
.navbutton:hover{
  background-color: #D9D99B;
}
.navbutton.active{
  background-color: #D9D99B;
}

/* 编辑器 */
#editor-container {
  max-width: 800px;
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