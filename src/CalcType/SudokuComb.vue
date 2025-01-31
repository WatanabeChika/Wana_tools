<script setup>
import { ref, onMounted } from 'vue';

const mainContainer = ref(null);
const sum = ref(0);
const n = ref(0);
const results = ref([]);

const numbers = ref([
  { name: 1, checked: false, excluded: false, included: false },
  { name: 2, checked: false, excluded: false, included: false },
  { name: 3, checked: false, excluded: false, included: false },
  { name: 4, checked: false, excluded: false, included: false },
  { name: 5, checked: false, excluded: false, included: false },
  { name: 6, checked: false, excluded: false, included: false },
  { name: 7, checked: false, excluded: false, included: false },
  { name: 8, checked: false, excluded: false, included: false },
  { name: 9, checked: false, excluded: false, included: false },
]);

const sums = ref([
  { name: 1, checked: false},
  { name: 2, checked: false},
  { name: 3, checked: false},
  { name: 4, checked: false},
  { name: 5, checked: false},
  { name: 6, checked: false},
  { name: 7, checked: false},
  { name: 8, checked: false},
  { name: 9, checked: false},
  { name: 10, checked: false},
  { name: 11, checked: false},
  { name: 12, checked: false},
  { name: 13, checked: false},
  { name: 14, checked: false},
  { name: 15, checked: false},
  { name: 16, checked: false},
  { name: 17, checked: false},
  { name: 18, checked: false},
  { name: 19, checked: false},
  { name: 20, checked: false},
  { name: 21, checked: false},
  { name: 22, checked: false},
  { name: 23, checked: false},
  { name: 24, checked: false},
  { name: 25, checked: false},
  { name: 26, checked: false},
  { name: 27, checked: false},
  { name: 28, checked: false},
  { name: 29, checked: false},
  { name: 30, checked: false},
  { name: 31, checked: false},
  { name: 32, checked: false},
  { name: 33, checked: false},
  { name: 34, checked: false},
  { name: 35, checked: false},
  { name: 36, checked: false},
  { name: 37, checked: false},
  { name: 38, checked: false},
  { name: 39, checked: false},
  { name: 40, checked: false},
  { name: 41, checked: false},
  { name: 42, checked: false},
  { name: 43, checked: false},
  { name: 44, checked: false},
  { name: 45, checked: false},
]);

const findCombinations = () => {
  results.value = [];
  findCombinationsHelper([], 1, sum.value, n.value);
  // 排除不符合条件的结果
  results.value = results.value.filter(result => {
    for (let i = 0; i < result.length; i++) {
      if (numbers.value[result[i] - 1].excluded) {
        return false;
      }
    }
    for (let i = 0; i < numbers.value.length; i++) {
      if (numbers.value[i].included && !result.includes(i + 1)) {
        return false;
      }
    }
    return true;
  });
};

const findCombinationsHelper = (current, start, sum, n) => {
  if (sum === 0 && n === 0) {
    results.value.push([...current]);
    return;
  }

  for (let i = start; i <= sum && i <= 9; i++) {
    current.push(i);
    findCombinationsHelper(current, i + 1, sum - i, n - 1);
    current.pop();
  }
};

// 切换和的选中状态
const toggleSum = (item) => {
  if (item.checked) {
    item.checked = false;
    sum.value = 0;
  } else {
    for (let i = 0; i < sums.value.length; i++) {
      sums.value[i].checked = false;
    }
    item.checked = true;
    sum.value = item.name;
  }
  findCombinations();
};

// 将和分组
const chunkOfSum = () => {
  const chunk = [];
  for (let i = 0; i < sums.value.length; i += 9) {
    chunk.push(sums.value.slice(i, i + 9));
  }
  return chunk;
}

// 切换数字的选中状态
const toggleNumber = (num, mode) => {
  if (mode === 1) {
    num.excluded = !num.excluded;
  } else if (mode === 2) {
    num.included = !num.included;
  }
  else {
    if (num.checked) {
      num.checked = false;
      n.value = 0;
    } else {
      for (let i = 0; i < numbers.value.length; i++) {
        numbers.value[i].checked = false;
      }
      num.checked = true;
      n.value = num.name;
    }
  }
  findCombinations();
};

// 将数字分组
const chunkOfNumber = () => {
  const chunk = [];
  for (let i = 0; i < numbers.value.length; i += 3) {
    chunk.push(numbers.value.slice(i, i + 3));
  }
  return chunk;
}

// 将结果分组
const chunkOfRows = () => {
  // get editor_container width
  const screenWidth = mainContainer.value.getBoundingClientRect().width;
  const itemWidth = results.value[0].length * 28;
  const columns = Math.floor(screenWidth / itemWidth); // 每行放置的格子数
  let rows = [];

  let currentRow = [];
  let count = 0;

  // 将格子分行
  for (let i = 0; i < results.value.length; i++) {
    currentRow.push(results.value[i]);
    count++;

    if (count >= columns) {
      rows.push(currentRow);
      currentRow = [];
      count = 0;
    }
  }

  // 处理最后一行
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
};

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', chunkOfRows);
});


</script>

<template>
  <h1>和分解器</h1>
  <p style="margin-bottom: 10px; margin-top: 0px">输入一个目标和与数字个数，找出所有和为目标和的数字组合。</p>
  <p style="margin-bottom: 10px; margin-top: 0px">可以选择排除某些数字或者包含某些数字。</p>
  <div id="main-container" ref="mainContainer">
    <div id="sum-input">
      <label style="margin-left: 0px;">目标和 </label>
      <table>
        <tr v-for="row in chunkOfSum()" :key="row[0].label">
          <td v-for="sum in row" :key="sum.name" :class="{ sum_checked: sum.checked }" @click="toggleSum(sum)">
            {{ sum.name }}
          </td>
        </tr>
      </table>
    </div>
    <div id="number-input">
      <label style="margin-left: 0px;">数字个数 </label>
      <table>
        <tr v-for="row in chunkOfNumber()" :key="row[0].label">
          <td v-for="num in row" :key="num.name" :class="{ number_checked: num.checked }" @click="toggleNumber(num, 0)">
            {{ num.name }}
          </td>
        </tr>
      </table>
    </div>
    <div id="exclude">
      <label style="margin-left: 0px;">排除</label>
      <table>
        <tr v-for="row in chunkOfNumber()" :key="row[0].label">
          <td v-for="num in row" :key="num.name" :class="{ number_excluded: num.excluded }" @click="toggleNumber(num, 1)">
            {{ num.name }}
          </td>
        </tr>
      </table>
    </div>
    <div id="include">
      <label style="margin-left: 0px;">包含</label>
      <table>
        <tr v-for="row in chunkOfNumber()" :key="row[0].label">
          <td v-for="num in row" :key="num.name" :class="{ number_included: num.included }" @click="toggleNumber(num, 2)">
            {{ num.name }}
          </td>
        </tr>
      </table>
    </div>
    
  </div>

  <div>
    <table v-if="results.length!=0&&results[0].length!=0">
      <tr v-for="(row, index) in chunkOfRows()" :key="index">
        <td v-for="(result, idx) in row" :key="idx">
          {{ result.join(', ') }}
        </td>
      </tr>
    </table>
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
  text-align: left;
}

label {
  display: inline-block;
  margin-bottom: 10px;
  margin-left: 10px;
  font-weight: 600;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  margin-bottom: 30px;
}

td {
  width: 14.28%;
  padding: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
}

tr:nth-child(even) {
  background-color: #f2f2f2;
}

#main-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 30px;
}

#exclude, #include, #sum-input, #number-input {
  margin-right: 30px;
}

.sum_checked, .number_checked {
  background-color: yellow;
}

.number_excluded {
  background-color: crimson;
}

.number_included {
  background-color: aquamarine;
}



</style>