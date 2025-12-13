<template>
  <div class="homepage">
    <img src="/images/logo.png" alt="Logo" class="logo">
    <div class="description">
      <h1>这里是 Wanakachi 的工具小站</h1>
      <p>这里集合了各种实用 (?) 工具，请通过上方导航栏进行选择。</p>
      <p>本项目的 Github 链接：
        <a href="https://github.com/WatanabeChika/Wana_tools">Wana_tools</a>
      </p>
      <p>我的博客：
        <a href="https://watanabechika.github.io/Wana_blog/">Wana_blog</a>
      </p>
    </div>
  </div>
</template>

<style scoped>

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

p {
  color: #666;
  line-height: 1.6;
  margin: 10px 0;
}

.homepage {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  text-align: center;
}

.logo {
  width: 100%;
  margin-bottom: 10px;
}

.description {
  max-width: 800px;
}
</style>