<script setup>
import { shallowRef } from 'vue';
import { asyncPage } from './utils/asyncPage';

import Homepage from './Homepage.vue';

const baseUrl = import.meta.env.BASE_URL;
const currentPage = shallowRef(Homepage);

const loveliveItems = [
  { name: 'LoveLive', path: asyncPage(() => import('./ImageType/LoveLiveEditor.vue')) },
  { name: 'LLSS', path: asyncPage(() => import('./ImageType/LoveLiveSSEditor.vue')) },
  { name: 'Matching', path: asyncPage(() => import('./ImageType/MatchingMemeEditor.vue')) },
  { name: 'OshiGIF', path: asyncPage(() => import('./ImageType/GIFMemeEditor.vue')) },
];

const ygoItems = [
  { name: 'TypeGuess', path: asyncPage(() => import('./ImageType/YGOGuessingEditor.vue')) },
  { name: 'NameSentence', path: asyncPage(() => import('./ImageType/YGONameSentenceEditor.vue')) },
];

const textItems = [
  { name: 'Chinkana', path: asyncPage(() => import('./TextType/Chinese_to_katakana.vue')) },
  { name: 'Leetspeak', path: asyncPage(() => import('./TextType/Leetspeak.vue')) },
  { name: 'Backslash', path: asyncPage(() => import('./TextType/Backslash.vue')) },
  { name: 'Deepseek', path: asyncPage(() => import('./TextType/Deepseek.vue')) },
];

const CalcItems = [
  { name: 'Decomposition', path: asyncPage(() => import('./CalcType/SudokuComb.vue')) },
];

const gameItems = [
  { name: 'Morse', path: asyncPage(() => import('./GameType/Morse.vue')) },
  { name: '24', path: asyncPage(() => import('./GameType/24points.vue')) },
  { name: '1-stroke', path: asyncPage(() => import('./GameType/Onestroke.vue')) }
];


const Items = [
  { type: 'LoveLive', apps: loveliveItems },
  { type: 'Yu-Gi-Oh', apps: ygoItems },
  { type: 'Text', apps: textItems },
  { type: 'Calculation', apps: CalcItems },
  { type: 'Game', apps: gameItems },
];

</script>



<template>
  <header class="site-header">
    <nav id="navbar" aria-label="工具分类">
      <button class="home-button" aria-label="返回首页" @click="currentPage = Homepage">
        <img :src="`${baseUrl}images/home.png`" alt="" width="32" height="32" />
      </button>
      <el-dropdown v-for="item in Items" :key="item.type" trigger="click" popper-class="tool-menu">
        <el-button class="navbutton" :class="{ 'category-active': item.apps.some(page => currentPage === page.path) }">
          {{ item.type }}
          <svg class="nav-chevron" viewBox="0 0 12 12" aria-hidden="true">
            <path d="m3 4.5 3 3 3-3" />
          </svg>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="page in item.apps" :key="page.name" @click="currentPage = page.path"
              :class="['dropdownbutton', { active: currentPage === page.path }]">
              {{ page.name }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </nav>
  </header>

  <main id="editor-container">
    <KeepAlive>
      <component :is="currentPage" />
    </KeepAlive>
  </main>
</template>



<style>
#editor-container>* {
  min-width: 0;
}

.site-header {
  background: #eaf1f7;
  border-bottom: 1px solid #d8e2ec;
}

#navbar {
  max-width: 1080px;
  min-height: 64px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  white-space: nowrap;
  align-items: center;
}

.home-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 5px;
  margin-right: 14px;
  background: transparent;
}

.home-button:hover:not(:disabled) {
  background: #dce7f1;
}

#navbar .navbutton {
  height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #485665;
  font: inherit;
  font-size: 14px;
  box-shadow: inset 0 -2px transparent;
}

#navbar .navbutton:hover,
#navbar .navbutton:focus-visible,
#navbar .navbutton.category-active {
  color: var(--accent);
  background: #dfeaf4;
}

#navbar .navbutton.category-active {
  box-shadow: inset 0 -2px var(--accent);
}

.nav-chevron {
  width: 12px;
  height: 12px;
  margin-left: 7px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
}

.tool-menu.el-popper {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 4px 16px #23344812;
}

.tool-menu .el-dropdown-menu {
  padding: 5px;
}

.tool-menu .dropdownbutton {
  margin: 0;
  padding: 9px 14px;
  min-height: 38px;
  color: var(--text);
  font-size: 14px;
  border-radius: 3px;
}

.tool-menu .dropdownbutton.active,
.tool-menu .dropdownbutton:not(.is-disabled):focus,
.tool-menu .dropdownbutton:not(.is-disabled):hover {
  background: var(--accent-soft);
  color: var(--accent);
}

#editor-container {
  width: calc(100% - 40px);
  max-width: 1080px;
  box-sizing: border-box;
  margin: 28px auto 48px;
  text-align: center;
  background: var(--surface);
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

@media (max-width: 600px) {
  #navbar {
    padding: 0 12px;
    gap: 2px;
    min-height: 58px;
  }

  .home-button {
    margin-right: 4px;
  }

  #navbar .navbutton {
    padding: 0 11px;
  }

  #editor-container {
    width: calc(100% - 24px);
    margin: 16px auto 28px;
    padding: 22px 16px;
  }
}
</style>
