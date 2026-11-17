<script setup>
import { evaluateArithmetic } from '../utils/arithmetic';
import { ref, onMounted } from 'vue';

// 24点计算函数
function judgePoint24(nums) {
  const EPSILON = 1e-6;
  const exprMap = new Map(); // 存储表达式树结构的哈希值
  const solutions = new Set(); // 最终结果集

  function dfs(current) {
    if (current.length === 1) {
      if (Math.abs(current[0].value - 24) < EPSILON) {
        const expr = current[0].expr;
        // 去掉最外层冗余括号
        const cleanExpr = expr.startsWith('(') && expr.endsWith(')') ?
          expr.slice(1, -1) : expr;
        // 计算表达式树哈希值
        const hash = exprTreeHash(current[0]);
        if (!exprMap.has(hash)) {
          exprMap.set(hash, true);
          solutions.add(cleanExpr);
        }
      }
      return;
    }

    const n = current.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const next = [];
        // 收集未被选中的元素
        for (let k = 0; k < n; k++) {
          if (k !== i && k !== j) {
            next.push(current[k]);
          }
        }

        const a = current[i];
        const b = current[j];
        const newItems = [];

        // 加法：标准化操作数顺序
        const addExpr = `(${a.expr} + ${b.expr})`;
        const addValue = a.value + b.value;
        newItems.push({
          value: addValue,
          expr: addExpr,
          left: a,
          op: '+',
          right: b
        });

        // 减法：两种顺序
        newItems.push({
          value: a.value - b.value,
          expr: `(${a.expr} - ${b.expr})`,
          left: a,
          op: '-',
          right: b
        });
        newItems.push({
          value: b.value - a.value,
          expr: `(${b.expr} - ${a.expr})`,
          left: b,
          op: '-',
          right: a
        });

        // 乘法：标准化操作数顺序
        let multExprA = a.expr;
        let multExprB = b.expr;
        // 确保操作数按特定顺序排列
        if (shouldSwap(a, b)) {
          [multExprA, multExprB] = [multExprB, multExprA];
        }
        const multExpr = `(${multExprA} * ${multExprB})`;
        newItems.push({
          value: a.value * b.value,
          expr: multExpr,
          left: shouldSwap(a, b) ? b : a,
          op: '*',
          right: shouldSwap(a, b) ? a : b
        });

        // 除法：两种顺序
        if (Math.abs(b.value) > EPSILON) {
          newItems.push({
            value: a.value / b.value,
            expr: `(${a.expr} / ${b.expr})`,
            left: a,
            op: '/',
            right: b
          });
        }
        if (Math.abs(a.value) > EPSILON) {
          newItems.push({
            value: b.value / a.value,
            expr: `(${b.expr} / ${a.expr})`,
            left: b,
            op: '/',
            right: a
          });
        }

        // 继续递归计算
        for (const item of newItems) {
          next.push(item);
          dfs(next);
          next.pop();
        }
      }
    }
  }

  // 判断是否需要交换操作数位置（标准化）
  function shouldSwap(a, b) {
    // 优先选择数值小的在前
    if (Math.abs(a.value - b.value) > EPSILON) {
      return a.value > b.value;
    }
    // 数值相同则选择表达式字符串小的在前
    if (a.expr !== b.expr) {
      return a.expr > b.expr;
    }
    // 表达式也相同则保持原顺序
    return false;
  }

  // 计算表达式树的哈希值（用于识别相同思路）
  function exprTreeHash(node) {
    if (!node.left && !node.right) {
      return node.value.toString();
    }
    const leftHash = exprTreeHash(node.left);
    const rightHash = exprTreeHash(node.right);
    // 对可交换运算标准化顺序
    if (node.op === '+' || node.op === '*') {
      return [node.op, leftHash < rightHash ? leftHash + rightHash : rightHash + leftHash].join(':');
    }
    return [node.op, leftHash, rightHash].join(':');
  }

  // 初始化节点
  const nodes = nums.map(num => ({
    value: num,
    expr: num.toString()
  }));

  dfs(nodes);

  return {
    isValid: solutions.size > 0,
    solutions: Array.from(solutions)
  };
}

// 游戏状态
const numbers = ref([]);
const userInput = ref('');
const isNoSolution = ref(false);
const resultMessage = ref('');
const resultStatus = ref('');
const solutions = ref([]);
const showSolution = ref(false);
const cardHover = ref(-1);

// 生成随机数字
function generateNumbers() {
  const newNumbers = [];
  for (let i = 0; i < 4; i++) {
    newNumbers.push(Math.floor(Math.random() * 13) + 1);
  }
  numbers.value = newNumbers;

  // 计算解法
  const result = judgePoint24([...newNumbers]);
  solutions.value = result.solutions;
}

// 验证答案
function checkAnswer() {
  resultMessage.value = '';
  resultStatus.value = '';
  showSolution.value = false;

  if (isNoSolution.value) {
    if (solutions.value.length === 0) {
      resultMessage.value = '✓ 正确！这组数字确实无解';
      resultStatus.value = 'correct';
    } else {
      resultMessage.value = '✗ 错误！这组数字有解法';
      resultStatus.value = 'incorrect';
    }
    return;
  }

  if (!userInput.value.trim()) {
    resultMessage.value = '请输入算式或选择"无解"';
    resultStatus.value = 'incorrect';
    return;
  }

  try {
    // 安全地计算表达式
    const sanitizedInput = userInput.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    // 提取用户输入的数字
    const inputNumbers = sanitizedInput.match(/\d+/g)?.map(Number) || [];
    const sortedInput = [...inputNumbers].sort((a, b) => a - b).join(',');
    const sortedOriginal = [...numbers.value].sort((a, b) => a - b).join(',');

    // 检查是否使用了正确的数字
    if (sortedInput !== sortedOriginal) {
      resultMessage.value = '✗ 错误！请使用给定的四个数字';
      resultStatus.value = 'incorrect';
      return;
    }

    // 计算表达式结果
    const result = evaluateArithmetic(sanitizedInput);

    if (Math.abs(result - 24) < 1e-6) {
      resultMessage.value = '✓ 正确！算式计算结果为24';
      resultStatus.value = 'correct';
    } else {
      resultMessage.value = `✗ 错误！算式计算结果为${result.toFixed(2)}，不是24`;
      resultStatus.value = 'incorrect';
    }
  } catch (error) {
    resultMessage.value = '✗ 无效的算式，请重新输入';
    resultStatus.value = 'incorrect';
  }
}

// 显示答案
function showSolutions() {
  showSolution.value = true;
  resultMessage.value = '';
  resultStatus.value = '';
}

// 重置游戏
function resetGame() {
  generateNumbers();
  userInput.value = '';
  isNoSolution.value = false;
  resultMessage.value = '';
  resultStatus.value = '';
  showSolution.value = false;
}

// 切换无解选项
function toggleNoSolution() {
  isNoSolution.value = !isNoSolution.value;
  if (isNoSolution.value) {
    userInput.value = '';
  }
}

// 初始化游戏
onMounted(() => {
  generateNumbers();
});
</script>


<template>
  <div class="game-container">
    <h1 class="tool-title">24点游戏</h1>
    <p style="margin-bottom: 10px; margin-top: 0px">使用下面的四个数，通过四则运算得到24</p>
    <p style="margin-bottom: 10px; margin-top: 0px">游戏规则：使用四个数（无顺序），通过加(+)、减(-)、乘(×或*)、除(÷或/)和括号，使表达式值等于24</p>

    <div class="numbers-container">
      <div class="number-card" v-for="(num, index) in numbers" :key="index" @mouseenter="cardHover = index"
        @mouseleave="cardHover = -1">
        {{ num }}
      </div>
    </div>

    <div class="input-container">
      <input type="text" class="input-box" v-model="userInput" placeholder="请输入算式，例如：(8-2)×(9-5)"
        :disabled="isNoSolution" @keyup.enter="checkAnswer">
    </div>

    <div class="no-solution-container">
      <div class="checkbox-label" role="checkbox" tabindex="0" :aria-checked="isNoSolution"
        @keydown.enter="toggleNoSolution" @keydown.space.prevent="toggleNoSolution" @click="toggleNoSolution">
        <div class="checkbox-custom" :class="{ checked: isNoSolution }"></div>
        <span>无解（这组数字无法计算出24）</span>
      </div>
    </div>

    <div class="button-container">
      <button class="btn btn-primary" @click="checkAnswer">验证答案
      </button>
      <button class="btn btn-secondary" @click="showSolutions">查看答案
      </button>
      <button class="btn btn-warning" @click="resetGame">重新开始
      </button>
    </div>

    <div class="result-container" v-if="resultMessage">
      <div :class="{
        'result-correct': resultStatus === 'correct',
        'result-incorrect': resultStatus === 'incorrect'
      }">
        {{ resultMessage }}
      </div>
    </div>

    <div class="solution-container" v-if="showSolution">
      <div class="solution-title">可能的解法：</div>
      <ul class="solution-list" v-if="solutions.length > 0">
        <li class="solution-item" v-for="(solution, index) in solutions" :key="index">
          {{ solution }} = 24
        </li>
      </ul>
      <div class="no-solution-text" v-else>
        这组数字无解！
      </div>
    </div>

  </div>
</template>


<style scoped>
.game-container {
  width: 100%;
  text-align: center;
}

p {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.8;
}

.numbers-container {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 30px 0;
}

.number-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 84px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-soft);
  color: var(--text);
  font-size: 34px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.input-container {
  margin: 24px auto;
  max-width: 520px;
}

.input-box {
  width: 100%;
  padding: 12px 14px;
  font-size: 17px;
  text-align: center;
}

.no-solution-container {
  display: flex;
  justify-content: center;
  margin: 18px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #9ba8b5;
  border-radius: 3px;
}

.checkbox-custom.checked {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox-custom.checked::after {
  content: '';
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: translateY(-1px) rotate(45deg);
}

.button-container {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 24px 0;
}

.btn {
  min-width: 110px;
}

.btn-primary {
  background: var(--accent);
}

.btn-secondary,
.btn-warning {
  color: var(--text);
  background: var(--surface-soft);
  border-color: #cbd2d9;
}

.btn-secondary:hover:not(:disabled),
.btn-warning:hover:not(:disabled) {
  background: #ebedf0;
}

.result-container {
  margin: 24px 0;
  padding: 16px;
  background: var(--surface-soft);
  border-radius: var(--radius);
}

.result-correct {
  color: var(--success);
  font-weight: 600;
}

.result-incorrect {
  color: var(--danger);
  font-weight: 600;
}

.solution-container {
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid var(--border);
}

.solution-title {
  color: var(--muted);
  font-size: 14px;
  margin-bottom: 14px;
}

.solution-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.solution-item {
  padding: 10px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 3px;
  font-family: Consolas, monospace;
  font-size: 15px;
}

.no-solution-text {
  color: var(--danger);
  font-size: 14px;
}

@media (max-width: 600px) {
  .numbers-container {
    gap: 10px;
  }

  .number-card {
    width: 58px;
    height: 68px;
    font-size: 28px;
  }

  .btn {
    min-width: 0;
    flex: 1;
    padding-inline: 10px;
  }
}
</style>
