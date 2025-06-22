<script setup>
import { ref, onMounted } from 'vue';

// 24点计算函数
function judgePoint24(nums) {
  const EPSILON = 1e-6;
  const results = new Set();
  
  function dfs(currentNums, currentExprs) {
    if (currentNums.length === 1) {
      if (Math.abs(currentNums[0] - 24) < EPSILON) {
        const expr = currentExprs[0];
        results.add(expr.startsWith('(') && expr.endsWith(')') ? expr.slice(1, -1) : expr);
      }
      return;
    }
    
    const n = currentNums.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        
        const nextNums = [];
        const nextExprs = [];
        for (let k = 0; k < n; k++) {
          if (k !== i && k !== j) {
            nextNums.push(currentNums[k]);
            nextExprs.push(currentExprs[k]);
          }
        }
        
        const a = currentNums[i];
        const b = currentNums[j];
        const expA = currentExprs[i];
        const expB = currentExprs[j];
        
        // 加法
        nextNums.push(a + b);
        nextExprs.push(`(${expA} + ${expB})`);
        dfs(nextNums, nextExprs);
        nextNums.pop();
        nextExprs.pop();
        
        // 减法（a - b）
        nextNums.push(a - b);
        nextExprs.push(`(${expA} - ${expB})`);
        dfs(nextNums, nextExprs);
        nextNums.pop();
        nextExprs.pop();
        
        // 减法（b - a）
        nextNums.push(b - a);
        nextExprs.push(`(${expB} - ${expA})`);
        dfs(nextNums, nextExprs);
        nextNums.pop();
        nextExprs.pop();
        
        // 乘法
        nextNums.push(a * b);
        nextExprs.push(`(${expA} × ${expB})`);
        dfs(nextNums, nextExprs);
        nextNums.pop();
        nextExprs.pop();
        
        // 除法（a / b）
        if (Math.abs(b) > EPSILON) {
          nextNums.push(a / b);
          nextExprs.push(`(${expA} ÷ ${expB})`);
          dfs(nextNums, nextExprs);
          nextNums.pop();
          nextExprs.pop();
        }
        
        // 除法（b / a）
        if (Math.abs(a) > EPSILON) {
          nextNums.push(b / a);
          nextExprs.push(`(${expB} ÷ ${expA})`);
          dfs(nextNums, nextExprs);
          nextNums.pop();
          nextExprs.pop();
        }
      }
    }
  }
  
  const exprs = nums.map(num => num.toString());
  dfs(nums, exprs);
  
  return {
    isValid: results.size > 0,
    solutions: Array.from(results)
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
    const result = eval(sanitizedInput);
    
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
      <h1>24点游戏</h1>
      <p style="margin-bottom: 10px; margin-top: 0px">使用下面的四个数，通过四则运算得到24</p>
      <p style="margin-bottom: 10px; margin-top: 0px">游戏规则：使用四个数（无顺序），通过加(+)、减(-)、乘(×或*)、除(÷或/)和括号，使表达式值等于24</p>
      
      <div class="numbers-container">
        <div 
          class="number-card" 
          v-for="(num, index) in numbers" 
          :key="index"

          @mouseenter="cardHover = index"
          @mouseleave="cardHover = -1"
        >
          {{ num }}
        </div>
      </div>
      
      <div class="input-container">
        <input
          type="text"
          class="input-box"
          v-model="userInput"
          placeholder="请输入算式，例如：(8-2)×(9-5)"
          :disabled="isNoSolution"
          @keyup.enter="checkAnswer"
        >
      </div>
      
      <div class="no-solution-container">
        <div class="checkbox-label" @click="toggleNoSolution">
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
          <li 
            class="solution-item" 
            v-for="(solution, index) in solutions" 
            :key="index"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
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
  border-radius: 20px;
  width: 100%;
  text-align: center;
}
  
h1 {
  font-family: sans-serif;
  color: #333;
  text-align: center;
  margin-bottom: 50px;
}

p {
  font-family: sans-serif;
  color: rgba(128,128,128,0.75);
  text-align: center;
}
  
.subtitle {
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 1.1rem;
}

.numbers-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
  flex-wrap: wrap;
}

.number-card {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  cursor: default;
}

.input-container {
  margin: 30px 0;
}

.input-box {
  width: 80%;
  padding: 15px 20px;
  font-size: 1.2rem;
  border: 2px solid #3498db;
  border-radius: 10px;
  outline: none;
  transition: all 0.3s ease;
}

.input-box:focus {
  border-color: #e74c3c;
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.3);
}

.no-solution-container {
  margin: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.checkbox-label {
  font-size: 1.1rem;
  color: #2c3e50;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  user-select: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #3498db;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.2s;
}

.checkbox-custom.checked {
  background-color: #3498db;
}

.checkbox-custom.checked::after {
  content: "✓";
  color: white;
}

.button-container {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 25px 0;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 25px;
  font-size: 1.1rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  min-width: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(46, 204, 113, 0.6);
}

.btn-secondary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.4);
}

.btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.6);
}

.btn-warning {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  box-shadow: 0 4px 10px rgba(231, 76, 60, 0.4);
}

.btn-warning:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.6);
}

.result-container {
  margin: 30px 0;
  padding: 20px;
  border-radius: 15px;
  background-color: #f8f9fa;
  text-align: center;
}

.result-correct {
  color: #27ae60;
  font-size: 1.5rem;
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

.result-incorrect {
  color: #e74c3c;
  font-size: 1.5rem;
  font-weight: bold;
}

.solution-container {
  margin-top: 30px;
  padding: 20px;
  background-color: #e8f4f8;
  border-radius: 15px;
  text-align: left;
}

.solution-title {
  color: #2980b9;
  margin-bottom: 15px;
  font-weight: bold;
  text-align: center;
}

.solution-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.solution-item {
  padding: 12px;
  margin: 10px 0;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  font-size: 1.1rem;
  font-family: 'Courier New', monospace;
  text-align: center;
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.no-solution-text {
  color: #e74c3c;
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.game-info {
  margin-top: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #7f8c8d;
  text-align: center;
}

.btn-icon {
  font-size: 1.2rem;
}

@media (max-width: 600px) {
  .game-container {
    padding: 20px;
  }
  
  .number-card {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
  
  .input-box {
    width: 90%;
  }
  
  .button-container {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 90%;
  }
}
</style>