<script setup>
import { ref } from 'vue';

const inputText = ref('');
const outputText = ref('');

// 常见的无参布尔开关（遇到这些 flag 时不会强行把后面的位置参数吞进来）
const BOOL_FLAGS = new Set([
  '-d', '-y', '-f', '-r', '-R', '-v', '-q', '-a', '-i', '-l', '-h', '-n',
  '--rm', '--help', '--version', '--verbose', '--quiet', '--debug',
  '--fp16', '--bf16', '--no-cache', '--privileged', '--init', '--detach',
  '--force', '--recursive', '--yes', '--all'
]);

// 常见命令前缀包装器
const WRAPPERS = new Set(['sudo', 'nohup', 'time', 'env', 'nice', 'ionice', 'stdbuf', 'setsid']);

// 支持子命令或紧跟脚本的常见工具
const SUBCMD_TOOLS = new Set([
  'docker', 'podman', 'git', 'apt', 'apt-get', 'yum', 'dnf', 'pacman', 'brew',
  'pip', 'pip3', 'conda', 'poetry', 'uv', 'npm', 'pnpm', 'yarn', 'cargo', 'go',
  'kubectl', 'helm', 'systemctl', 'journalctl', 'ip', 'ufw', 'openssl',
  'python', 'python3', 'node', 'bash', 'sh', 'zsh'
]);

const isEnvVar = (t) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(t);
const isOperator = (t) => ['&&', '||', '|', ';'].includes(t);
const isRedirect = (t) => /^(?:[0-9]*>>?|[0-9]*<&?[0-9]*|&>>?)$/.test(t);
const isFlag = (t) => /^--?[a-zA-Z]/.test(t);
const isSelfContainedFlag = (t) => /^--?[a-zA-Z0-9_-]+=/.test(t);
const isCombinedShortFlag = (t) => /^-[a-zA-Z]{2,}$/.test(t); // 如 -rf, -it, -la
const isBoolFlag = (t) => BOOL_FLAGS.has(t) || isCombinedShortFlag(t);

// 词法切分：保留单双引号内的空格（兼容输入未闭合的引号）
const tokenize = (str) => {
  const regex = /(?:[^\s"']+|"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?)+/g;
  return str.match(regex) || [];
};

// 将单个命令片段的 token 列表排版成多行结构
const formatCommandTokens = (tokens) => {
  if (tokens.length === 0) return [];

  const lines = [];
  let i = 0;

  // 1. 构建首行命令头（环境变量 + sudo等前缀 + 主命令 + 子命令/脚本 + 紧随其后的短布尔开关如 -rf）
  const header = [];
  while (i < tokens.length && (isEnvVar(tokens[i]) || WRAPPERS.has(tokens[i]))) {
    header.push(tokens[i++]);
  }
  if (i < tokens.length) {
    const mainCmd = tokens[i++];
    header.push(mainCmd);

    // 如果是 python train.py 或 docker run 等带子命令/脚本的形式，合并到首行
    if (
      i < tokens.length &&
      !isFlag(tokens[i]) &&
      !isRedirect(tokens[i]) &&
      (SUBCMD_TOOLS.has(mainCmd) || /\.(py|sh|js|ts|jar|rb|pl)$/.test(tokens[i]))
    ) {
      header.push(tokens[i++]);
    }

    // 紧跟在命令头后面的短布尔参数（如 sudo rm -rf、docker run -d）留在首行
    while (i < tokens.length && isBoolFlag(tokens[i])) {
      header.push(tokens[i++]);
    }
  }
  lines.push(header.join(' '));

  // 2. 逐个归组后续参数
  while (i < tokens.length) {
    const cur = tokens[i];

    // 处理重定向（如 > out.log 2>&1）
    if (isRedirect(cur)) {
      const redirGroup = [cur];
      i++;
      if (i < tokens.length && !isFlag(tokens[i]) && !isRedirect(tokens[i])) {
        redirGroup.push(tokens[i++]);
      }
      if (i < tokens.length && tokens[i] === '2>&1') {
        redirGroup.push(tokens[i++]);
      }
      lines.push(redirGroup.join(' '));
      continue;
    }

    // 处理选项参数（--key value 或 -k value 保持在同一行）
    if (isFlag(cur)) {
      if (
        !isSelfContainedFlag(cur) &&
        !isBoolFlag(cur) &&
        i + 1 < tokens.length &&
        !isFlag(tokens[i + 1]) &&
        !isRedirect(tokens[i + 1])
      ) {
        lines.push(`${cur} ${tokens[i + 1]}`);
        i += 2;
      } else {
        lines.push(cur);
        i++;
      }
      continue;
    }

    // 普通位置参数单独成行
    lines.push(cur);
    i++;
  }

  return lines;
};

const update_output = () => {
  let input = inputText.value;

  // 去掉命令中的续行反斜杠与换行符，并将多个空白折叠为一个空格
  let new_input = input
    .replace(/\\\s*\r?\n/g, ' ')
    .replace(/\\/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  outputText.value = new_input;
};

const update_input = () => {
  let input = outputText.value.trim();
  if (!input) {
    inputText.value = '';
    return;
  }

  const tokens = tokenize(input);
  const allLines = [];
  let currentSegment = [];

  // 按 &&, ||, |, ; 切分子命令分别排版
  for (const token of tokens) {
    if (isOperator(token)) {
      const formatted = formatCommandTokens(currentSegment);
      formatted.forEach((line, idx) => {
        allLines.push(idx === 0 ? line : `  ${line}`);
      });
      allLines.push(token);
      currentSegment = [];
    } else {
      currentSegment.push(token);
    }
  }

  if (currentSegment.length > 0) {
    const formatted = formatCommandTokens(currentSegment);
    formatted.forEach((line, idx) => {
      allLines.push(idx === 0 ? line : `  ${line}`);
    });
  }

  inputText.value = allLines.join(' \\\n');
};
</script>



<template>
  <div id="m2kcontainer">
    <h1>反斜杠</h1>

    <label id="in-out">带反斜杠的命令: </label>
    <textarea type="text" id="inputBox" v-model="inputText" placeholder="sudo rm -rf \ &#10;I \ &#10;dont \ &#10;want \ &#10;backslash" @input="update_output"></textarea>
    
    <label id="in-out">不带反斜杠的命令: </label>
    <textarea type="text" id="outputBox" v-model="outputText" placeholder="sudo rm -rf I dont want backslash" @input="update_input"></textarea>
  </div>
</template>



<style scoped>

h1 {
  font-family: sans-serif;
  color: #333;
  text-align: center;
  margin-bottom: 50px;
}

label {
  display: inline-block;
  margin-bottom: 10px;
  margin-left: 10px;
  font-weight: 600;
}

textarea {
  width: 100%;
  height: 230px;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  resize: none; 
  overflow-y: display; 
}

#m2kcontainer {
  width: 100%;
}

#in-out{
  display: block;
  text-align: left;
  margin-top: 30px;
  margin-bottom: 10px;
  margin-left: 5px;
  font-weight: 600;
}


</style>
