<script setup>
import { ref, onMounted } from 'vue';
import { AES, enc } from 'crypto-js';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 代码高亮主题样式

const userInput = ref('');
const key = ref('');
const checked = ref(false);
const messages = ref([]);
const fileInput = ref(null);
const tokenUsage = ref(0);
const showToken = ref(false);
const models = ref({
  'GLM-4-9B-0414 (free)': 'THUDM/GLM-4-9B-0414',
  'DeepSeek-R1-0528-Qwen3-8B (free, inference)': 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
  'Qwen3-8B (free, inference)': 'Qwen/Qwen3-8B',

  'Pro-DeepSeek-R1 (¥16/M, inference, MoE, No bonus)': 'Pro/deepseek-ai/DeepSeek-R1',
  'Pro-DeepSeek-V3.1-Terminus (¥12/M, inference, MoE, No bonus)': 'Pro/deepseek-ai/DeepSeek-V3.1-Terminus',
  'DeepSeek-R1 (¥16/M, inference, MoE)': 'deepseek-ai/DeepSeek-R1',
  'DeepSeek-V3.1-Terminus (¥12/M, inference, MoE)': 'deepseek-ai/DeepSeek-V3.1-Terminus',

  'GLM-4.6 (¥14/M, inference, MoE)': 'zai-org/GLM-4.6',

  'Qwen3-Next-80B-A3B-Instruct (¥4/M, MoE)': 'Qwen/Qwen3-Next-80B-A3B-Instruct',
  'Qwen3-Next-80B-A3B-Thinking (¥4/M, inference, MoE)': 'Qwen/Qwen3-Next-80B-A3B-Thinking',
})

const selectedModel = ref(Object.values(models.value)[0]);

const cyphertext = 'U2FsdGVkX19d05skwimaUS7YGmfulfNHtLFRg6M0FRy2VGel4iH+IXZDHugqvbGwCu9vRRfat4LJoPcZWv4lsMGCp0Mk7tSVCRjf8Lstjug=';

// Markdown 解析 + 代码高亮
function renderMarkdown(text) {
  let md = marked.parse(text);
  const codeBlocks = md.match(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g) || [];
  codeBlocks.forEach(block => {
    const language = block.match(/<code class="language-(\w+)">/)[1];
    const codeContent = block.match(/<code class="language-\w+">([\s\S]*?)<\/code>/)[1];
    const highlightedCode = hljs.highlight(codeContent, { language }).value;
    md = md.replace(block, `<pre><code class="language-${language}">${highlightedCode}</code></pre>`);
  });
  return md;
}

// 发送请求
async function sendMessage() {
  if (!userInput.value.trim()) return;

  // 记录用户消息
  messages.value.push({ role: 'user', content: userInput.value });
  userInput.value = '';

  // 发起 API 调用
  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: AES.decrypt(cyphertext, key.value).toString(enc.Utf8),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: selectedModel.value,
      stream: true,
      messages: messages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })
  });

  // 读取流数据
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let token_til_now;
  let assistantMessage = { 
    role: 'assistant', 
    content: '', 
    reasoningContent: '', 
    isCollapsed: false };
  messages.value.push(assistantMessage);

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // 指示用了多少 token
      tokenUsage.value = token_til_now;
      break;
    }

    const jsonData = decoder.decode(value)
      .match(/data: (.*)/g)
      ?.map(item => item.replace('data: ', '')) || [];

    for (const item of jsonData) {
      if (item === '[DONE]') break;
      const json = JSON.parse(item);

      if (json.choices && json.choices.length > 0) {
        const reasoningContent = json.choices[0].delta?.reasoning_content;
        const content = json.choices[0].delta?.content;

        if (reasoningContent) {
          messages.value[messages.value.length - 1].reasoningContent += reasoningContent;
        }
        if (content) {
          messages.value[messages.value.length - 1].content += content;
          messages.value[messages.value.length - 1].isCollapsed = true;
        }
      }

      if (json.usage) {
        token_til_now = parseInt(json.usage.total_tokens);
      }
    }
  }
}

function keyCheck() {
  // 检查密钥前几位是否正确
  if (AES.decrypt(cyphertext, key.value).toString(enc.Utf8).startsWith('Bearer sk-')) {
    checked.value = true;
  } else {
    alert('密钥错误，请重新输入！');
  }
}

// 导出历史记录
function exportHistory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dataStr = JSON.stringify(messages.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat_history_${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 导入历史记录
function importHistory() {
  fileInput.value.click();
}

// 处理文件上传
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (validateHistory(importedData)) {
        messages.value = importedData;
        alert('导入成功！');
      } else {
        alert('文件格式不正确！');
      }
    } catch (error) {
      alert('文件解析失败！');
    }
    // 清空输入以便重复选择同一文件
    event.target.value = null;
  };
  reader.readAsText(file);
}

// 验证历史记录格式
function validateHistory(data) {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' &&
    ['user', 'assistant'].includes(item.role) &&
    typeof item.content === 'string'
  );
}

// 确保 Vue 加载后应用代码高亮
onMounted(() => {
  hljs.highlightAll();
});
</script>


<template>
  <div id="m2kcontainer">
    <h1>对话AI</h1>
    <div v-if="!checked" class="action-buttons">
      <input type="text" v-model="key" @keydown.enter.prevent="keyCheck" placeholder="请输入密钥">
      <button @click="keyCheck" class="export-btn">提交密钥</button>
    </div>
    <div v-if="checked" class="chat-container">
      <div class="model-selector">
        <label>选择模型（更换模型后不清除历史对话）：</label>
        <select v-model="selectedModel">
          <option v-for="(value, key) in models" :key="value" :value="value">
            {{ key }}
          </option>
        </select>
      </div>
      <div class="token-indicator" @click="showToken = !showToken">
        <span v-if="showToken">消耗Token：{{ tokenUsage }}</span>
        <span v-else>点击显示Token用量</span>
        <transition name="fade">
          <span v-if="tokenUsage > 0" class="update-badge">实时</span>
        </transition>
      </div>
      <div class="chat-box">
        <div v-for="(msg, index) in messages" :key="index" class="chat-message">
          <div v-if="msg.role === 'user'" class="user-message">
            <strong>用户：</strong>
            <div v-html="renderMarkdown(msg.content)"></div>
          </div>
          <div v-else class="assistant-message">
            <strong>助手：</strong>
            <div v-if="msg.reasoningContent" 
                class="thinking" 
                @click="msg.isCollapsed = !msg.isCollapsed">
              <div class="toggle-header">
                <span>思考过程（点击{{ msg.isCollapsed ? '展开' : '折叠' }}）</span>
                <span>{{ msg.isCollapsed ? '▶' : '▼' }}</span>
              </div>
              <div v-show="!msg.isCollapsed" 
                  v-html="renderMarkdown(msg.reasoningContent)"></div>
            </div>
            <div class="answer" v-html="renderMarkdown(msg.content)"></div>
          </div>
        </div>
      </div>
      <div class="input-area">
        <textarea v-model="userInput" @keydown.enter.prevent="sendMessage" placeholder="输入您的问题..." rows="2"></textarea>
        <button @click="sendMessage">发送</button>
      </div>
      <div class="action-buttons">
        <button @click="exportHistory" class="export-btn">导出对话记录</button>
        <button @click="importHistory" class="import-btn">导入对话记录</button>
        <input type="file" ref="fileInput" @change="handleFileUpload" accept=".json" hidden>
      </div>
    </div>
  </div>
</template>


<style scoped>

h1 {
  font-family: sans-serif;
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  resize: none;
}

button {
  padding: 10px 20px;
  border: none;
  background: #2196f3;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
}

button:hover {
  background: #1976d2;
}

input {
  width: 200px;
  height: 20px;
  margin-right: 10px;
}
select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  min-width: 100px;
  max-width: 400px;
  white-space: normal;
}

label {
  font-weight: 500;
  color: #666;
}

#m2kcontainer {
  width: 100%;
}

.chat-container {
  width: 95%;
  max-width: 1000px;
  margin: 20px auto;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 15px;
  background: #f9f9f9;
}

.model-selector {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.token-indicator {
  position: relative;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s;
}

.token-indicator:hover {
  background: #eee;
}

.update-badge {
  font-size: 0.8em;
  background: #2196f3;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 0.4; }
  100% { opacity: 0.8; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.chat-box {
  height: 500px;
  overflow-y: auto;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.chat-message {
  width: 100%;
  margin-bottom: 4px;
  line-height: 1.75;
}

.user-message,
.assistant-message {
  max-width: 100%;
  padding: 10px;
  border-radius: 5px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.user-message p, 
.assistant-message p {
  margin: 2px 0; /* 减小段落间距 */
  padding: 0; /* 移除默认 padding */
  line-height: 1.4; /* 调整行高，使文本更紧凑 */
}

.user-message {
  text-align: right;
  background: #e0f7fa;
  align-self: flex-start;
}

.assistant-message {
  text-align: left;
  background: #f1f8e9;
  align-self: flex-start;
}

.toggle-header {
  color: #666;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.thinking {
  color: #666;
  border-left: 3px solid #ccc;
  padding-left: 8px;
  margin: 4px 0;
}

.answer {
  color: black;
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-area {
  display: flex;
  gap: 10px;
  margin: 10px 0 10px 0;
}

.action-buttons {
  display: inline-block;
  gap: 8px;
  margin-top: 10px;
}

.export-btn {
  margin: 0 10px 0 10px;
  background: #4CAF50;
}

.import-btn {
  margin: 0 10px 0 10px;
  background: #FF9800;
}

/* Markdown 样式 */
.chat-message :deep(p) {
  margin: 2px 0;
  line-height: 1.4;
}

.chat-message :deep(h3) {
  margin: 20px 0 10px 0;
  font-weight: bold;
}

.chat-message :deep(h4) {
  margin: 15px 0 10px 0;
  font-weight: bold;
}

.chat-message :deep(ul),
.chat-message :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px; /* 统一控制子元素垂直间距 */
}

.chat-message :deep(li) {
  margin: 2px 0;
  line-height: 1.4;
}

.chat-message :deep(pre) {
  background: #f6f8fa;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}

.chat-message :deep(code) {
  padding: 3px 5px;
  border-radius: 3px;
  font-family: monospace;
}
</style>
