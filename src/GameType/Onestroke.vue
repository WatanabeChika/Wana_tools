<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { MinPriorityQueue } from '@datastructures-js/priority-queue';

// 游戏参数
const width = ref(6);
const height = ref(5);
const obstacleRatio = ref(0.2);

// 游戏状态
const cells = ref([]);
const startCell = ref(null);
const currentCell = ref(null);
const visitedCells = ref([]);
const gameComplete = ref(false);
const message = ref('');
const messageClass = ref('');
const showingAnswer = ref(false);
const solutionPath = ref([]);
const isGenerating = ref(false);

// 计算属性
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${width.value}, 1fr)`
}));

const visitedCount = computed(() => visitedCells.value.length);

const walkableCount = computed(() => 
  cells.value.filter(cell => !cell.isObstacle).length
);

// 生成新地图
const generateNewMap = async () => {
  // 设置生成状态
  isGenerating.value = true;
  
  // 使用 setTimeout 让 UI 有机会更新
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // 重置游戏状态
  resetGame();
  
  const maxAttempts = 10000;
  let success = false;
  
  for (let attempt = 0; attempt < maxAttempts && !success; attempt++) {
    // 创建初始网格
    const newCells = createInitialGrid();
    
    // 先放置障碍物
    const cellsWithObstacles = placeObstacles(newCells);
    
    // 在剩余区域生成一笔画路径
    const result = generateOneStrokePath(cellsWithObstacles);
    
    if (result && result.path.length > 0) {
      cells.value = result.cells;
      solutionPath.value = result.path;
      startCell.value = result.start;
      currentCell.value = result.start;
      message.value = '点击起点开始一笔画';
      messageClass.value = '';
      showingAnswer.value = false;
      success = true;
    }
  }
  
  if (!success) {
    // 如果失败,生成一个简单的无障碍物版本
    const simpleCells = createInitialGrid();
    const result = generateOneStrokePath(simpleCells);
    if (result) {
      cells.value = result.cells;
      solutionPath.value = result.path;
      startCell.value = result.start;
      currentCell.value = result.start;
      message.value = '点击起点开始一笔画 (简化版本)';
      messageClass.value = '';
      showingAnswer.value = false;
    }
  }
  
  // 清除生成状态
  isGenerating.value = false;
};

// 创建初始网格
const createInitialGrid = () => {
  const newCells = [];
  for (let y = 0; y < height.value; y++) {
    for (let x = 0; x < width.value; x++) {
      newCells.push({
        x, y,
        isObstacle: false,
        isStart: false,
        isInPath: false,
        isVisited: false,
        isCurrent: false
      });
    }
  }
  return newCells;
};

// 放置障碍物
const placeObstacles = (cells) => {
  const newCells = [...cells.map(cell => ({...cell}))];
  const totalCells = width.value * height.value;
  const targetObstacles = Math.floor(totalCells * obstacleRatio.value);
  
  // 确保至少有一些可行走的格子
  const minWalkable = Math.max(4, Math.floor(totalCells * 0.3));
  const maxObstacles = totalCells - minWalkable;
  const actualObstacles = Math.min(targetObstacles, maxObstacles);
  
  if (actualObstacles <= 0) return newCells;
  
  // 随机选择障碍物位置,但要保持连通性
  let obstaclesPlaced = 0;
  const attempts = actualObstacles * 10; // 限制尝试次数
  
  for (let i = 0; i < attempts && obstaclesPlaced < actualObstacles; i++) {
    const randomIndex = Math.floor(Math.random() * newCells.length);
    const cell = newCells[randomIndex];
    
    if (!cell.isObstacle) {
      // 临时设置为障碍物
      cell.isObstacle = true;
      
      // 检查连通性
      if (isConnected(newCells)) {
        obstaclesPlaced++;
      } else {
        // 如果破坏了连通性,撤销
        cell.isObstacle = false;
      }
    }
  }
  
  return newCells;
};

// 检查网格的连通性(使用优化的BFS)
const isConnected = (cells) => {
  const walkableCells = cells.filter(c => !c.isObstacle);
  if (walkableCells.length === 0) return false;
  
  // 使用Set优化查找
  const visited = new Set();
  const queue = [walkableCells[0]];
  visited.add(getCellKey(walkableCells[0]));
  
  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = getNeighbors(current, cells);
    
    for (const neighbor of neighbors) {
      const key = getCellKey(neighbor);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }
  
  return visited.size === walkableCells.length;
};

// 在给定网格中生成一笔画路径
const generateOneStrokePath = (cells) => {
  const walkableCells = cells.filter(c => !c.isObstacle);
  if (walkableCells.length === 0) return null;
  
  // 尝试多个起点
  const shuffledCells = shuffleArray([...walkableCells]);
  
  for (const startCell of shuffledCells) {
    const result = findHamiltonianPath(cells, startCell);
    if (result && result.path.length === walkableCells.length) {
      return {
        cells: cells.map(cell => ({
          ...cell,
          isStart: cell.x === startCell.x && cell.y === startCell.y
        })),
        path: result.path,
        start: startCell
      };
    }
  }
  
  return null;
};

// 使用优化的回溯算法寻找哈密顿路径
const findHamiltonianPath = (cells, startCell) => {
  const walkableCells = cells.filter(c => !c.isObstacle);
  const targetLength = walkableCells.length;
  
  // 预计算邻居关系以提高性能
  const neighborCache = new Map();
  walkableCells.forEach(cell => {
    const key = getCellKey(cell);
    neighborCache.set(key, getNeighbors(cell, cells));
  });
  
  const path = [];
  const visited = new Set();
  
  // 使用Warnsdorff启发式优化回溯
  const backtrack = (current) => {
    const key = getCellKey(current);
    if (visited.has(key)) return false;
    
    visited.add(key);
    path.push(current);
    
    // 如果访问了所有可行走格子,成功
    if (path.length === targetLength) {
      return true;
    }
    
    // 获取未访问的邻居(使用缓存)
    const cachedNeighbors = neighborCache.get(key) || [];
    const unvisitedNeighbors = cachedNeighbors
      .filter(neighbor => !visited.has(getCellKey(neighbor)));
    
    // 使用优先队列优化邻居选择
    const priorityQueue = new MinPriorityQueue((neighbor) => {
      // 计算该邻居的未访问邻居数量(越少越优先)
      const neighborKey = getCellKey(neighbor);
      const neighborNeighbors = neighborCache.get(neighborKey) || [];
      return neighborNeighbors.filter(n => !visited.has(getCellKey(n))).length;
    });
    
    unvisitedNeighbors.forEach(n => priorityQueue.enqueue(n));
    
    // 按优先级尝试每个邻居
    while (!priorityQueue.isEmpty()) {
      const neighbor = priorityQueue.dequeue();
      if (backtrack(neighbor)) {
        return true;
      }
    }
    
    // 回溯
    visited.delete(key);
    path.pop();
    return false;
  };
  
  if (backtrack(startCell)) {
    return { path: [...path] };
  }
  
  return null;
};

// 获取格子的唯一键
const getCellKey = (cell) => `${cell.x}-${cell.y}`;

// 获取相邻格子
const getNeighbors = (cell, cellList) => {
  const neighbors = [];
  const directions = [
    { dx: 0, dy: -1 }, // 上
    { dx: 1, dy: 0 },  // 右
    { dx: 0, dy: 1 },  // 下
    { dx: -1, dy: 0 }  // 左
  ];
  
  for (const dir of directions) {
    const nx = cell.x + dir.dx;
    const ny = cell.y + dir.dy;
    
    if (nx >= 0 && nx < width.value && ny >= 0 && ny < height.value) {
      const neighbor = cellList[ny * width.value + nx];
      if (!neighbor.isObstacle) {
        neighbors.push(neighbor);
      }
    }
  }
  
  return neighbors;
};

// 随机打乱数组
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 获取格子CSS类
const getCellClasses = (cell) => {
  return {
    'start': cell.isStart,
    'obstacle': cell.isObstacle,
    'path': cell.isInPath && showingAnswer.value,
    'visited': cell.isVisited,
    'current': cell.isCurrent
  };
};

// 点击格子处理
const onCellClick = (cell) => {
  if (gameComplete.value || cell.isObstacle || showingAnswer.value) return;
  
  // 如果是起点且游戏未开始,开始游戏
  if (cell.isStart && visitedCells.value.length === 0) {
    startGame();
    return;
  }
  
  // 如果游戏已开始,检查移动是否合法
  if (visitedCells.value.length > 0) {
    const current = currentCell.value;
    const neighbors = getNeighbors(current, cells.value);
    
    if (neighbors.some(n => n.x === cell.x && n.y === cell.y) && !cell.isVisited) {
      // 合法移动
      moveToCell(cell);
    } else {
      // 非法移动
      message.value = '只能移动到相邻且未访问的格子';
      messageClass.value = 'error';
    }
  }
};

// 开始游戏
const startGame = () => {
  visitedCells.value = [startCell.value];
  startCell.value.isVisited = true;
  startCell.value.isCurrent = true;
  currentCell.value = startCell.value;
  message.value = '继续绘制路径';
  messageClass.value = '';
};

// 移动到指定格子
const moveToCell = (cell) => {
  currentCell.value.isCurrent = false;
  cell.isCurrent = true;
  cell.isVisited = true;
  visitedCells.value.push(cell);
  currentCell.value = cell;
  
  // 检查游戏是否完成
  checkGameCompletion();
};

// 检查游戏是否完成
const checkGameCompletion = () => {
  // 检查是否所有非障碍物格子都被访问
  const totalWalkableCells = cells.value.filter(c => !c.isObstacle).length;
  
  if (visitedCells.value.length === totalWalkableCells) {
    gameComplete.value = true;
    message.value = '恭喜!你成功完成了一笔画!';
    messageClass.value = 'success';
  } else {
    message.value = `已访问 ${visitedCells.value.length}/${totalWalkableCells} 个格子`;
    messageClass.value = '';
  }
};

// 重新开始游戏
const restartGame = () => {
  resetGame();
  cells.value.forEach(cell => {
    cell.isVisited = false;
    cell.isCurrent = false;
    cell.isInPath = false;
  });
  
  if (startCell.value) {
    startCell.value.isCurrent = true;
    currentCell.value = startCell.value;
  }
  message.value = '点击起点开始一笔画';
  messageClass.value = '';
  showingAnswer.value = false;
};

// 显示答案
const showAnswer = () => {
  // 清除玩家的路径状态
  cells.value.forEach(cell => {
    cell.isInPath = false;
    cell.isVisited = false;
    cell.isCurrent = false;
  });
  
  // 重置游戏状态
  visitedCells.value = [];
  currentCell.value = null;
  gameComplete.value = false;
  
  // 显示预先生成的路径
  if (solutionPath.value && solutionPath.value.length > 0) {
    showingAnswer.value = true;
    let delay = 0;
    
    solutionPath.value.forEach((pathCell, index) => {
      setTimeout(() => {
        // 通过坐标匹配找到对应的格子
        const actualCell = cells.value.find(c => 
          c.x === pathCell.x && c.y === pathCell.y && !c.isObstacle
        );
        if (actualCell) {
          actualCell.isInPath = true;
        }
      }, delay);
      delay += 100; // 每100ms显示一个格子
    });
    
    setTimeout(() => {
      message.value = `答案路径已显示完成 (${solutionPath.value.length} 步)`;
      messageClass.value = 'success';
    }, delay);
    
    message.value = '正在显示答案路径...';
    messageClass.value = '';
  } else {
    message.value = '无法找到一笔画路径';
    messageClass.value = 'error';
  }
};

// 重置游戏状态
const resetGame = () => {
  visitedCells.value = [];
  currentCell.value = null;
  gameComplete.value = false;
};

// 监听网格尺寸/障碍物比例变化
watch([width, height, obstacleRatio], () => {
  generateNewMap();
});

// 初始化游戏
onMounted(() => {
  generateNewMap();
});
</script>

<template>
  <h1>一笔画游戏</h1>
  <p style="margin-bottom: 10px; margin-top: 0px">点击起点开始游戏，访问所有格子即获胜。</p>
  <p style="margin-bottom: 10px; margin-top: 0px">每次只能移动到相邻的格子。不能访问已经走过的格子，不能穿过障碍物。</p>

  <div class="container">
    <div class="top-area">
      <div class="grid-container">
        <div class="loading-overlay" v-if="isGenerating">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在生成地图中...</div>
        </div>
        <div class="grid" :class="{ 'generating': isGenerating }" :style="gridStyle">
          <div 
            v-for="(cell, index) in cells" 
            :key="index"
            class="cell"
            :class="getCellClasses(cell)"
            @click="onCellClick(cell)"
          >
            <span v-if="cell.isStart" class="start-label">起</span>
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="game-info">
          <p>已访问: {{ visitedCount }}/{{ walkableCount }} 个格子</p>
        </div>

        <div class="control-group">
          <label>
            宽度
            <input type="range" v-model.number="width" min="3" max="6">
            <span class="ratio-value">{{ width }}</span>
          </label>
        </div>

        <div class="control-group">
          <label>
            高度
            <input type="range" v-model.number="height" min="3" max="6">
            <span class="ratio-value">{{ height }}</span>
          </label>
        </div>

        <div class="control-group">
          <label>
            障碍物比例
            <input type="range" v-model.number="obstacleRatio" min="0" max="0.3" step="0.05">
            <span class="ratio-value">{{ (obstacleRatio * 100).toFixed(0) }}%</span>
          </label>
        </div>

        <div class="buttons">
          <button @click="generateNewMap">生成新地图</button>
          <button @click="restartGame" style="background-color: gray;">重新开始</button>
          <button @click="showAnswer" style="background-color: cornflowerblue;">查看答案</button>
        </div>

        <div class="result" :class="messageClass">{{ message }}</div>
      </div>
    </div>

    <div class="legend">
      <div class="legend-item">
        <div class="color-box start"></div>
        <span>起点</span>
      </div>
      <div class="legend-item">
        <div class="color-box obstacle"></div>
        <span>障碍物</span>
      </div>
      <div class="legend-item">
        <div class="color-box path"></div>
        <span>答案路径</span>
      </div>
      <div class="legend-item">
        <div class="color-box visited"></div>
        <span>已访问</span>
      </div>
      <div class="legend-item">
        <div class="color-box current"></div>
        <span>当前位置</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

input[type="range"] {
  width: 120px;
  margin: 0 10px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background-color: #28a745;
  color: white;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
  min-width: 120px;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.9;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  max-width: min(1200px, 90vw);
  margin: 30px auto 0;
  padding: 0 20px;
}

.top-area {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  width: 100%;
}

.grid-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background-color: #333;
  border-radius: 15px;
  padding: 0 50px;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  z-index: 10;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 20px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.grid {
  display: grid;
  gap: 3px;
  background-color: #555;
  padding: 4px;
  border-radius: 8px;
  transition: filter 0.3s;
}

.grid.generating {
  filter: blur(4px);
  pointer-events: none;
}

.cell {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ecf0f1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: bold;
}

.cell:hover:not(.obstacle) {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.cell.start {
  background-color: #2ecc71;
  color: white;
}

.cell.obstacle {
  background-color: #7f8c8d;
  cursor: not-allowed;
}

.cell.path {
  background-color: #3498db;
  color: white;
}

.cell.visited {
  background-color: #9b59b6;
  color: white;
}

.cell.current {
  background-color: #e74c3c;
  color: white;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.start-label {
  font-size: 14px;
  font-weight: bold;
}

.controls {
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.game-info {
  text-align: center;
  margin-bottom: 20px;
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.game-info p {
  margin: 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.control-group label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.ratio-value {
  min-width: 40px;
  font-weight: bold;
  color: #333;
  text-align: right;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.buttons button {
  min-width: 100%;
}

.result {
  margin-top: 15px;
  min-height: 24px;
  padding: 10px;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
}

.result.success {
  color: #2ecc71;
  background-color: #d5f4e6;
}

.result.error {
  color: #e74c3c;
  background-color: #fadbd8;
}

.legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
}

.color-box {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  flex-shrink: 0;
}

.color-box.start {
  background-color: #2ecc71;
}

.color-box.obstacle {
  background-color: #7f8c8d;
}

.color-box.path {
  background-color: #3498db;
}

.color-box.visited {
  background-color: #9b59b6;
}

.color-box.current {
  background-color: #e74c3c;
}

@media (max-width: 1024px) {
  .top-area {
    grid-template-columns: 1fr;
  }
  
  .controls {
    order: 2;
  }
  
  .grid-container {
    order: 1;
  }
}

@media (max-width: 768px) {
  .grid-container {
    padding: 20px;
    min-height: 300px;
  }
  
  .cell {
    width: 35px;
    height: 35px;
  }
  
  .legend {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 480px) {
  .grid-container {
    padding: 15px;
    min-height: 250px;
  }
  
  .cell {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }
  
  .legend {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  input[type="range"] {
    width: 100px;
  }
}
</style>