<script setup>
const baseUrl = import.meta.env.BASE_URL;
</script>

<template>
  <div class="homepage">
    <img :src="`${baseUrl}images/logo.png`" alt="Logo" class="logo">
    <div class="description">
      <h1>Wanakachi 的工具小站</h1>
      <p>这里集合了各种实用 (?) 工具，请通过上方导航栏进行选择。</p>
      <div class="home-links">
        <a href="https://github.com/WatanabeChika/Wana_tools">GitHub 项目</a>
        <a href="https://watanabechika.github.io/Wana_blog/">我的博客</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  color: var(--text);
  font-size: 26px;
  line-height: 1.5;
  font-weight: 600;
  margin: 0 0 14px;
}

p {
  color: var(--muted);
  line-height: 1.8;
  margin: 10px 0;
}

.homepage {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: 24px 0 36px;
  text-align: center;
}

.logo {
  width: min(100%, 520px);
  height: auto;
  margin-bottom: 28px;
}

.description {
  max-width: 640px;
}

.home-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid var(--border);
  font-size: 14px;
}

@media (max-width: 600px) {
  .homepage {
    padding: 8px 0 18px;
  }

  h1 {
    font-size: 22px;
  }

  .logo {
    margin-bottom: 20px;
  }
}
</style>
