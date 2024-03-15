<script setup>
import {onMounted, ref} from 'vue';
import FontFaceObserver from 'font-face-observer';
import { fillCanvasText, loadImage, shuffleLogArray } from './utils';

// -------变量声明-------
const canvas = ref(null)
const canvas_ans = ref(null)

const character_color = ref(true);
const character_birthday = ref(false);

const Font1 = new FontFaceObserver('KaiTi');

const titleFont = 'bold 50px KaiTi';
const normalFont = '35px KaiTi';
const imgPath = 'images/character_icons/'

const bgColor = 'white';
const fontColor = 'black';
const titleText1 = '连线题：'
const titleText2 = '请将各角色连至其对应的'

const modeItems = ref([
  { name: '应援色', mark: character_color },
  { name: '生日'  , mark: character_birthday },
]);

const color_modes = ref([
  { label: '蓝色系', checked: false , char: [1,3,13,18,23,24,34,37,43,47]},
  { label: '红色系', checked: false , char: [5,12,27,39,49]},
  { label: '黄色系', checked: false , char: [0,4,9,15,22,25,33,38,45,46]},
  { label: '绿色系', checked: false , char: [7,11,28,30,36,40,48]},
  { label: '紫色系', checked: false , char: [6,16,26,42,44]},
  { label: '粉色系', checked: false , char: [8,10,17,21,32,35,41,50]},
  { label: '白色系', checked: false , char: [2,14,19,29,31,51]},
]);

const birthday_modes = ref ([
  { label: '1月' , checked: false , char: [7,12,22,42,47] },
  { label: '2月' , checked: false , char: [11,28,32,35] },
  { label: '3月' , checked: false , char: [3,15,21] },
  { label: '4月' , checked: false , char: [5,13,23,38] },
  { label: '5月' , checked: false , char: [18,25,33,46] },
  { label: '6月' , checked: false , char: [6,16,24,40,48] },
  { label: '7月' , checked: false , char: [8,14,34] },
  { label: '8月' , checked: false , char: [0,9,27,41,50] },
  { label: '9月' , checked: false , char: [2,10,17,36] },
  { label: '10月', checked: false , char: [1,30,39] },
  { label: '11月', checked: false , char: [4,29,37,49] },
  { label: '12月', checked: false , char: [19,26,31,43,51] },
]);

const characters = ref([
  { label: '高坂穗乃果'    , Eng: 'Honoka'   ,  color: "#f38500",  birthday: "8月3日"  ,  checked: false},
  { label: '绚濑绘里'      , Eng: 'Eli'      ,  color: "#7aeeff",  birthday: "10月21日",  checked: false},
  { label: '南小鸟'        , Eng: 'Kotori'   ,  color: "#cebfbf",  birthday: "9月12日" ,  checked: false},
  { label: '园田海未'      , Eng: 'Umi'      ,  color: "#1769ff",  birthday: "3月15日" ,  checked: false},
  { label: '星空凛'        , Eng: 'Rin'      ,  color: "#fff832",  birthday: "11月1日" ,  checked: false},
  { label: '西木野真姬'    , Eng: 'Maki'     ,  color: "#ff503e",  birthday: "4月19日" ,  checked: false},
  { label: '东条希'        , Eng: 'Nozomi'   ,  color: "#c455f6",  birthday: "6月9日"  ,  checked: false},
  { label: '小泉花阳'      , Eng: 'Hanayo'   ,  color: "#6ae673",  birthday: "1月17日" ,  checked: false},
  { label: '矢泽妮可'      , Eng: 'Nico'     ,  color: "#ff4f91",  birthday: "7月22日" ,  checked: false},
  { label: '高海千歌'      , Eng: 'Chika'    ,  color: "#ff9547",  birthday: "8月1日"  ,  checked: false},
  { label: '樱内梨子'      , Eng: 'Riko'     ,  color: "#ff9eac",  birthday: "9月19日" ,  checked: false},
  { label: '松浦果南'      , Eng: 'Kanan'    ,  color: "#27c1b7",  birthday: "2月10日" ,  checked: false},
  { label: '黑泽黛雅'      , Eng: 'Dia'      ,  color: "#db0839",  birthday: "1月1日"  ,  checked: false},
  { label: '渡边曜'        , Eng: 'You'      ,  color: "#66c0ff",  birthday: "4月17日" ,  checked: false},
  { label: '津岛善子'      , Eng: 'Yoshiko'  ,  color: "#c1cad4",  birthday: "7月13日" ,  checked: false},
  { label: '国木田花丸'    , Eng: 'Hanamaru' ,  color: "#ffd010",  birthday: "3月4日"  ,  checked: false},
  { label: '小原鞠莉'      , Eng: 'Mari'     ,  color: "#c252c6",  birthday: "6月13日" ,  checked: false},
  { label: '黑泽露比'      , Eng: 'Ruby'     ,  color: "#ff6fbe",  birthday: "9月21日" ,  checked: false},
  { label: '鹿角圣良'      , Eng: 'Sarah'    ,  color: "#00ccff",  birthday: "5月4日"  ,  checked: false},
  { label: '鹿角理亚'      , Eng: 'Leah'     ,  color: "#bbbbbb",  birthday: "12月12日",  checked: false},
  { label: '高咲侑'        , Eng: 'Yuu'      ,  color: "#1d1d1d",  birthday: "暂无"    ,  checked: false},
  { label: '上原步梦'      , Eng: 'Ayumu'    ,  color: "#ed7d95",  birthday: "3月1日"  ,  checked: false},
  { label: '中须霞'        , Eng: 'Kasumi'   ,  color: "#e7d600",  birthday: "1月23日" ,  checked: false},
  { label: '樱坂雫'        , Eng: 'Shizuku'  ,  color: "#01b7ed",  birthday: "4月3日"  ,  checked: false},
  { label: '朝香果林'      , Eng: 'Karin'    ,  color: "#485ec6",  birthday: "6月29日" ,  checked: false},
  { label: '宫下爱'        , Eng: 'Ai'       ,  color: "#ff5800",  birthday: "5月30日" ,  checked: false},
  { label: '近江彼方'      , Eng: 'Kanata'   ,  color: "#a664a0",  birthday: "12月16日",  checked: false},
  { label: '优木雪菜'      , Eng: 'Setsuna'  ,  color: "#d81c2f",  birthday: "8月8日"  ,  checked: false},
  { label: '艾玛·维尔德'   , Eng: 'Verde'    ,  color: "#84c36e",  birthday: "2月5日"  ,  checked: false},
  { label: '天王寺璃奈'    , Eng: 'Rina'     ,  color: "#9ca5b9",  birthday: "11月13日",  checked: false},
  { label: '三船栞子'      , Eng: 'Shiyoriko',  color: "#37b484",  birthday: "10月5日" ,  checked: false},
  { label: '米娅·泰勒'     , Eng: 'Taylor'   ,  color: "#a9a898",  birthday: "12月6日" ,  checked: false},
  { label: '钟岚珠'        , Eng: 'Lanzhu'   ,  color: "#f8c8c4",  birthday: "2月15日" ,  checked: false},
  { label: '涩谷香音'      , Eng: 'Kanon'    ,  color: "#ff7f27",  birthday: "5月1日"  ,  checked: false},
  { label: '唐可可'        , Eng: 'Keke'     ,  color: "#a0fff9",  birthday: "7月17日" ,  checked: false},
  { label: '岚千砂都'      , Eng: 'Chisato'  ,  color: "#ff6e90",  birthday: "2月25日" ,  checked: false},
  { label: '平安名堇'      , Eng: 'Sumire'   ,  color: "#74f466",  birthday: "9月28日" ,  checked: false},
  { label: '叶月恋'        , Eng: 'Ren'      ,  color: "#0000a0",  birthday: "11月24日",  checked: false},
  { label: '樱小路希奈子'  , Eng: 'Kinako'   ,  color: "#fff442",  birthday: "4月10日" ,  checked: false},
  { label: '米女芽衣'      , Eng: 'Mei'      ,  color: "#ff3535",  birthday: "10月29日",  checked: false},
  { label: '若菜四季'      , Eng: 'Shiki'    ,  color: "#b2ffdd",  birthday: "6月17日" ,  checked: false},
  { label: '鬼冢夏美'      , Eng: 'Natsumi'  ,  color: "#ff51c4",  birthday: "8月7日"  ,  checked: false},
  { label: '薇恩·玛格丽特' , Eng: 'Margarete',  color: "#e49dfd",  birthday: "1月20日" ,  checked: false},
  { label: '鬼冢冬毬'      , Eng: 'Tomari'   ,  color: "#4cd2e2",  birthday: "12月28日",  checked: false},
  { label: '柊摩央'        , Eng: 'Mao'      ,  color: "#b05bd4",  birthday: "暂无"    ,  checked: false},
  { label: '圣泽悠奈'      , Eng: 'Yuna'     ,  color: "#e7c030",  birthday: "暂无"    ,  checked: false},
  { label: '日野下花帆'    , Eng: 'Kaho'     ,  color: "#f8b500",  birthday: "5月22日" ,  checked: false},
  { label: '村野沙耶香'    , Eng: 'Sayaka'   ,  color: "#5383c3",  birthday: "1月13日" ,  checked: false},
  { label: '乙宗梢'        , Eng: 'Kozue'    ,  color: "#68be8d",  birthday: "6月15日" ,  checked: false},
  { label: '夕雾缀理'      , Eng: 'Tsuzuri'  ,  color: "#ba2636",  birthday: "11月17日",  checked: false},
  { label: '大泽瑠璃乃'    , Eng: 'Rurino'   ,  color: "#e7609e",  birthday: "8月31日" ,  checked: false},
  { label: '藤岛慈'        , Eng: 'Megumi'   ,  color: "#c8c2c6",  birthday: "12月20日",  checked: false},
]);

let ctx, ctxAns, originHeight;


// -------主要功能-------
// 更新Canvas
async function update_canvas() {
  // 获取选中的角色（以调整画布高度）
  let charList = [];
  for (let i = 0; i < characters.value.length; i++) {
    if (characters.value[i].checked) {
      charList.push(characters.value[i]);
    }
  }
  canvas.value.height = originHeight + charList.length * 175 + 50;
  canvas_ans.value.height = originHeight + charList.length * 175 + 50;

  // 白色背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // 标题 功能嵌入
  fillCanvasText(ctx, fontColor, titleFont, false, 520, 60, titleText1);
  fillCanvasText(ctx, fontColor, titleFont, false, 410, 135, titleText2);
  for (let i = 0; i < modeItems.value.length; i++) {
    if (modeItems.value[i].mark) {
      fillCanvasText(ctx, fontColor, titleFont, false, 760, 135, modeItems.value[i].name);
      break;
    }
  }

  // 角色绘制
  const basicX = 170;
  const basicY = 300;
  for (let i = 0; i < charList.length; i++) {
    // fillCanvasText(ctx, fontColor, normalFont, false, basicX, basicY + i * 175, charList[i].label);
    const img = await loadImage(imgPath + charList[i].Eng + '.png');
    ctx.drawImage(img, basicX - 80, basicY + i * 175 - 70, 130, 130);
  }

  // 色块绘制
  const [themeList, relation] = shuffleLogArray(charList);
  if (character_color.value) {
    for (let i = 0; i < themeList.length; i++) {
      ctx.fillStyle = themeList[i].color;
      ctx.fillRect(basicX + 570, basicY + i * 175 - 50, 180, 100);
    }
  }
  else if (character_birthday.value) {
    for (let i = 0; i < themeList.length; i++) {
      fillCanvasText(ctx, fontColor, normalFont, false, basicX + 640, basicY + i * 175, themeList[i].birthday);
    }
  }
  

  // 连线（答案）
  ctxAns.drawImage(canvas.value, 0, 0);
  for (let i = 0; i < relation.length; i++) {
    ctxAns.beginPath();
    ctxAns.moveTo(basicX + 75, basicY + relation[i][0] * 175);
    ctxAns.lineTo(basicX + 550, basicY + relation[i][1] * 175);
    ctxAns.strokeStyle = 'black';
    ctxAns.lineWidth = 3;
    ctxAns.stroke();
  }
}

// 下载图片
function downloadImage() {
  const dataURL = canvas.value.toDataURL('image/png');
  const downloadLink = document.createElement('a');

  downloadLink.href = dataURL;
  downloadLink.download = `连线题.png`;

  downloadLink.click();
}

// 下载答案
function downloadAnswer() {
  const dataURL = canvas_ans.value.toDataURL('image/png');
  const downloadLink = document.createElement('a');

  downloadLink.href = dataURL;
  downloadLink.download = `答案.png`;

  downloadLink.click();
}


// -------事件侦听-------
// 初始化
onMounted(async () => {
  try {
    await Promise.all([Font1.check()]);

    ctx = canvas.value.getContext('2d');
    ctxAns = canvas_ans.value.getContext('2d');
    originHeight = canvas.value.height;

    update_canvas();

  } catch (error) {
    console.error(error);
  }
})

// 清空
const empty_char = () => {
  for (let i = 0; i < characters.value.length; i++) {
    characters.value[i].checked = false;
  }
  for (let i = 0; i < color_modes.value.length; i++) {
    color_modes.value[i].checked = false;
  }
  for (let i = 0; i < birthday_modes.value.length; i++) {
    birthday_modes.value[i].checked = false;
  }
};

// 快捷勾选
const modesAdjust = (modes) => {
  // 清空
  for (let i = 0; i < characters.value.length; i++) {
    characters.value[i].checked = false;
  }
  // 勾选
  for (let i = 0; i < modes.length; i++) {
    if (modes[i].checked) {
      for (let j = 0; j < modes[i].char.length; j++) {
        const index = modes[i].char[j];
        // 排除无数据的情况
        if (character_birthday.value && characters.value[index].birthday == "暂无") {
          continue;
        }
        characters.value[index].checked = true;
      }
    }
  }
};

// 更改主题
const update_settings = (item) => {
  for (let i = 0; i < modeItems.value.length; i++) {
    if (modeItems.value[i].name != item.name) {
      modeItems.value[i].mark = false;
    } else {
      modeItems.value[i].mark = true;
    }
  }
  empty_char();
};

// 角色表格填充
const chunkedOptions = () => {
  const chunked = [];
  for (let i = 0; i < characters.value.length; i += 7) {
    chunked.push(characters.value.slice(i, i + 7));
  }
  return chunked;
};

// 角色表格选择
const toggleCheck = (char) => {
  for (let i = 0; i < color_modes.value.length; i++) {
    color_modes.value[i].checked = false;
  }
  for (let i = 0; i < birthday_modes.value.length; i++) {
    birthday_modes.value[i].checked = false;
  }
  if (character_birthday.value && char.birthday == "暂无") {
    alert("该角色暂无生日信息！");
    return;
  }
  char.checked = !char.checked;
};


</script>



<template>
  <h1>LoveLive!连线梗图制作器</h1>
  <div id="input-container">
    <div id="modes-settings">
      <span style="margin-right: 25px;">主题选择: </span>
      <div v-for="item in modeItems" :key="item.name">
        <label :for="item.name">{{ item.name }}</label>
        <input type="radio" name="check" :checked="item.mark" :value="item.mark" :id="item.name" @change="update_settings(item)">
      </div>
    </div>
    <table>
      <tr v-for="row in chunkedOptions()" :key="row[0].label">
        <td v-for="char in row" :key="char.label" :class="{ character_selected: char.checked }" @click="toggleCheck(char)">
          {{ char.label }}
        </td>
      </tr>
    </table>
    <div id="modes-settings">
      <span style="margin-right: 25px;">快捷选项: </span>
      <div v-if="character_color" v-for="item in color_modes" :key="item.label">
        <label :for="item.label">{{ item.label }}</label>
        <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(color_modes)">
      </div>
      <div v-if="character_birthday" v-for="item in birthday_modes" :key="item.label">
        <label :for="item.label">{{ item.label }}</label>
        <input v-model="item.checked" type="checkbox" :id="item.label" @change="modesAdjust(birthday_modes)">
      </div>
    </div>
    <div id="button-container">
      <button @click="update_canvas" class="btns" style="background-color: cornflowerblue;">绘制图片</button>
      <button @click="empty_char" class="btns" style="background-color: gray;">清空选择</button>
      <button @click="downloadImage" class="btns">下载图片</button>
      <button @click="downloadAnswer" class="btns">下载答案</button>
    </div>
  </div>
  <div id="canvas-container">
    <canvas id="art-canvas" ref="canvas" width="1000" height="200"></canvas>
    <canvas id="art-canvas-ans" ref="canvas_ans" width="1000" height="200" style="display: none"></canvas>
  </div>
</template>



<style>
/* 全局 */
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

/* 局部 */
#button-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  
}

.btns {
  margin-right: 20px;
}

#modes-settings {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.character_selected {
  background-color: aquamarine;
}

</style>
