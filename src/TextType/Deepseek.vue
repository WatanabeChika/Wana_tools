<script setup>
import { ref, onBeforeUnmount, onDeactivated } from 'vue';
import { AES, enc } from 'crypto-js';
import { Marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 代码高亮主题样式

const userInput = ref('');
const sending = ref(false);
const requestError = ref('');
const canRetry = ref(false);
let controller;
let retryContext = null;
let retryIndex = -1;
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

const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const safeUrl = href => {
  try { return ['http:', 'https:', 'mailto:'].includes(new URL(href, location.href).protocol); }
  catch { return false; }
};
const markdown = new Marked({
  renderer: {
    html({ text }) { return escapeHtml(text); },
    code({ text, lang }) {
      const language = lang?.split(/\s/)[0];
      const code = language && hljs.getLanguage(language) ? hljs.highlight(text, { language }).value : escapeHtml(text);
      return `<pre><code>${code}</code></pre>`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      return safeUrl(href) ? `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''} rel="noopener noreferrer">${text}</a>` : text;
    },
    image({ href, title, text }) {
      return safeUrl(href) ? `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''}>` : escapeHtml(text);
    },
  }
});
function renderMarkdown(text) { return markdown.parse(text || ''); }

async function sendMessage(retry = false) {
  retry = retry === true;
  if (sending.value || !checked.value || (!retry && !userInput.value.trim()) || (retry && !retryContext)) return;
  if (!retry) {
    messages.value.push({ role: 'user', content: userInput.value });
    userInput.value = '';
    retryContext = messages.value.filter(msg => msg.content).map(({ role, content }) => ({ role, content }));
    retryIndex = messages.value.length;
    messages.value.push({ role: 'assistant', content: '', reasoningContent: '', isCollapsed: false });
  } else {
    messages.value[retryIndex] = { role: 'assistant', content: '', reasoningContent: '', isCollapsed: false };
  }
  const assistant = messages.value[retryIndex];
  sending.value = true;
  requestError.value = '';
  canRetry.value = false;
  controller = new AbortController();
  let idleTimer;
  let reader;
  const resetTimeout = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => controller.abort('timeout'), 120000);
  };
  try {
    resetTimeout();
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: {
        Authorization: AES.decrypt(cyphertext, key.value).toString(enc.Utf8),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: selectedModel.value, stream: true, messages: retryContext }),
    });
    if (!response.ok) throw new Error(`请求失败（HTTP ${response.status}）`);
    if (!response.body) throw new Error('浏览器未提供响应数据流');
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finished = false;
    function consumeLine(line) {
      if (!line.startsWith('data:')) return;
      const data = line.slice(5).trim();
      if (!data) return;
      if (data === '[DONE]') { finished = true; return; }
      const json = JSON.parse(data);
      if (json.error) throw new Error(json.error.message || '服务返回错误');
      const delta = json.choices?.[0]?.delta;
      if (delta?.reasoning_content) assistant.reasoningContent += delta.reasoning_content;
      if (delta?.content) { assistant.content += delta.content; assistant.isCollapsed = true; }
      if (Number.isFinite(Number(json.usage?.total_tokens))) tokenUsage.value = Number(json.usage.total_tokens);
    }
    while (!finished) {
      const { done, value } = await reader.read();
      resetTimeout();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) { consumeLine(line.replace(/\r$/, '')); if (finished) break; }
      if (done) { if (!finished && buffer.trim()) consumeLine(buffer.trim()); break; }
    }
    if (!assistant.content && !assistant.reasoningContent) throw new Error('服务未返回内容，请重试');
  } catch (error) {
    requestError.value = controller.signal.aborted ? (controller.signal.reason === 'timeout' ? '等待响应超时，可重试本次请求' : '已停止生成，可重试本次请求') : (error.message || '请求失败，请重试');
    canRetry.value = true;
  } finally {
    clearTimeout(idleTimer);
    if (reader) { await reader.cancel().catch(() => { }); reader.releaseLock(); }
    sending.value = false;
  }
}

function stopGeneration() { controller?.abort(); }
function handleInputEnter(event) {
  if (event.isComposing || event.shiftKey) return;
  event.preventDefault();
  sendMessage();
}
function keyCheck() {
  try {
    checked.value = AES.decrypt(cyphertext, key.value).toString(enc.Utf8).startsWith('Bearer sk-');
  } catch { checked.value = false; }
  requestError.value = checked.value ? '' : '密钥错误，请重新输入';
}
onDeactivated(stopGeneration);
onBeforeUnmount(stopGeneration);

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
        messages.value = importedData.map(item => ({ ...item, reasoningContent: typeof item.reasoningContent === 'string' ? item.reasoningContent : '', isCollapsed: item.isCollapsed !== false }));
        retryContext = null;
        canRetry.value = false;
        requestError.value = '';
      } else {
        requestError.value = '文件格式不正确';
      }
    } catch (error) {
      requestError.value = '文件解析失败';
    }
    // 清空输入以便重复选择同一文件
    event.target.value = null;
  };
  reader.onerror = () => { requestError.value = '文件读取失败，请重新选择'; event.target.value = ''; };
  reader.readAsText(file);
}

// 验证历史记录格式
function validateHistory(data) {
  return Array.isArray(data) && data.every(item =>
    item !== null && typeof item === 'object' &&
    ['user', 'assistant'].includes(item.role) &&
    typeof item.content === 'string'
  );
}

</script>


<template>
  <div id="m2kcontainer">
    <h1 class="tool-title">对话AI</h1>
    <p v-if="requestError" class="request-error" role="alert">{{ requestError }} <button v-if="checked && canRetry"
        :disabled="sending" @click="sendMessage(true)">重试本次请求</button></p>
    <div v-if="!checked" class="action-buttons">
      <input type="text" v-model="key" @keydown.enter.prevent="keyCheck" placeholder="请输入密钥" aria-label="密钥">
      <button @click="keyCheck" class="primary-btn">提交密钥</button>
    </div>
    <div v-if="checked" class="chat-container">
      <div class="model-selector">
        <label for="chat-model">选择模型（更换模型后不清除历史对话）：</label>
        <select id="chat-model" v-model="selectedModel" :disabled="sending">
          <option v-for="(value, key) in models" :key="value" :value="value">
            {{ key }}
          </option>
        </select>
      </div>
      <button type="button" class="token-indicator" :aria-pressed="showToken" @click="showToken = !showToken">
        <span v-if="showToken">消耗Token：{{ tokenUsage }}</span>
        <span v-else>点击显示Token用量</span>
        <transition name="fade">
          <span v-if="tokenUsage > 0" class="update-badge">实时</span>
        </transition>
      </button>
      <div class="chat-box">
        <div v-for="(msg, index) in messages" :key="index" class="chat-message">
          <div v-if="msg.role === 'user'" class="user-message">
            <strong>用户：</strong>
            <div v-html="renderMarkdown(msg.content)"></div>
          </div>
          <div v-else class="assistant-message">
            <strong>助手：</strong>
            <div v-if="msg.reasoningContent" class="thinking">
              <button type="button" class="toggle-header" :aria-expanded="!msg.isCollapsed"
                @click="msg.isCollapsed = !msg.isCollapsed">
                <span>思考过程（点击{{ msg.isCollapsed ? '展开' : '折叠' }}）</span>
                <svg class="thinking-chevron" :class="{ collapsed: msg.isCollapsed }" viewBox="0 0 12 12"
                  aria-hidden="true">
                  <path d="m3 4.5 3 3 3-3" />
                </svg>
              </button>
              <div v-show="!msg.isCollapsed" v-html="renderMarkdown(msg.reasoningContent)"></div>
            </div>
            <div class="answer" v-html="renderMarkdown(msg.content)"></div>
          </div>
        </div>
      </div>
      <div class="input-area">
        <textarea v-model="userInput" @keydown.enter="handleInputEnter" placeholder="输入您的问题..." rows="2"></textarea>
        <button v-if="sending" @click="stopGeneration">停止</button>
        <button v-else @click="sendMessage" :disabled="!userInput.trim()">发送</button>
      </div>
      <div class="action-buttons">
        <button @click="exportHistory" class="export-btn">导出对话记录</button>
        <button :disabled="sending" @click="importHistory" class="import-btn">导入对话记录</button>
        <input type="file" ref="fileInput" @change="handleFileUpload" accept=".json" hidden>
      </div>
    </div>
  </div>
</template>


<style scoped>
.request-error {
  color: #b42318;
  text-align: left;
  font-size: 14px;
}

.chat-box :deep(img) {
  max-width: 100%;
}

.chat-box :deep(pre) {
  overflow-x: auto;
}

.chat-box :deep(p) {
  overflow-wrap: anywhere;
}

textarea {
  min-width: 0;
  flex: 1;
  padding: 10px;
  border: 1px solid #cbd2d9;
  border-radius: 5px;
  font-size: 16px;
  resize: none;
}

input {
  width: 200px;
}

select {
  padding: 8px 12px;
  border: 1px solid #cbd2d9;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  min-width: 100px;
  max-width: 100%;
  white-space: normal;
}

label {
  font-weight: 500;
  color: var(--muted);
}

#m2kcontainer {
  width: 100%;
}

.chat-container {
  width: 100%;
  box-sizing: border-box;
  max-width: 1000px;
  margin: 20px auto;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  border: 0;
  padding: 0;
  background: var(--surface);
}

.model-selector {
  flex-wrap: wrap;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.token-indicator {
  position: relative;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: var(--surface-soft);
  color: var(--muted);
  border-color: var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s;
}

.token-indicator:hover:not(:disabled) {
  background: #ebedf0;
}

.update-badge {
  font-size: 0.8em;
  background: var(--accent);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;

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
  height: 440px;
  overflow-y: auto;
  padding: 0 0 16px;
  border-bottom: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.chat-message {
  width: 100%;
  margin-bottom: 12px;
  line-height: 1.75;
}

.user-message,
.assistant-message {
  max-width: 100%;
  padding: 10px;
  border-radius: 5px;
  word-wrap: break-word;
  white-space: normal;
}

.user-message p,
.assistant-message p {
  margin: 2px 0;
  /* 减小段落间距 */
  padding: 0;
  /* 移除默认 padding */
  line-height: 1.7;
  /* 调整行高，使文本更紧凑 */
}

.user-message {
  text-align: right;
  background: var(--accent-soft);
  align-self: flex-start;
}

.assistant-message {
  text-align: left;
  background: var(--surface-soft);
  align-self: flex-start;
}

.toggle-header {
  width: 100%;
  min-height: 32px;
  color: var(--muted);
  background: transparent;
  border: 0;
  border-radius: 0;
  font-weight: 400;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  padding: 4px 0;
}

.toggle-header:hover:not(:disabled) {
  background: transparent;
  color: var(--accent);
}

.thinking-chevron {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
}

.thinking-chevron.collapsed {
  transform: rotate(-90deg);
}

.thinking {
  color: var(--muted);
  border-left: 3px solid #ccc;
  padding-left: 8px;
  margin: 4px 0;
}

.answer {
  color: var(--text);
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-area {
  flex-wrap: wrap;
  display: flex;
  gap: 10px;
  margin: 10px 0 10px 0;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

/* Markdown 样式 */
.chat-message :deep(p) {
  margin: 2px 0;
  line-height: 1.7;
}

.chat-message :deep(h3) {
  margin: 20px 0 10px 0;
  font-weight: 600;
}

.chat-message :deep(h4) {
  margin: 15px 0 10px 0;
  font-weight: 600;
}

.chat-message :deep(ul),
.chat-message :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  /* 统一控制子元素垂直间距 */
}

.chat-message :deep(li) {
  margin: 2px 0;
  line-height: 1.7;
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
