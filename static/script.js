
// func: 填充Canvas
function fillCanvas(text, color, font, stroke, x, y, input) {
  // 设置文本样式
  text.fillStyle = color;
  text.font = font;
  text.textAlign = 'center';
  text.textBaseline = 'middle';

  if (stroke) {
    // 添加描边效果
    text.strokeStyle = 'white';
    text.lineWidth = 15;
    text.lineJoin = 'round';
    text.strokeText(input, x+3, y+3);
  }

  text.fillText(input, x, y);
} 

// func: 获取文本宽度
function getTextWidth(text, font) {
  const span = document.createElement('span');
  span.style.font = font;
  span.textContent = text;
  document.body.appendChild(span);
  const width = span.offsetWidth;
  document.body.removeChild(span);
  return width;
}



// 加载字体
const font1 = new FontFaceObserver('LIST');
const font2 = new FontFaceObserver('FFMC');
const promises = [
  font1.load(),
  font2.load()
];

Promise.all(promises).then(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.body.style.visibility = 'visible';

    // 获取Canvas元素和图片元素
    const canvas = document.getElementById('art-canvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    const artImage = document.getElementById('art-image');
    const originWidth = canvas.width;
    const originHeight = canvas.height;

    // 初始化Canvas
    let bgColor = "white";
    let fontColor = "#E4007F";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // HTML元素
    const transparentBgCheckbox = document.getElementById('transparent-bg');
    const centerCheckbox = document.getElementById('text-place');
    const swapBgCheckbox = document.getElementById('color-swap');
    const strokeCheckbox = document.getElementById('text-stroke');
    const textInput1 = document.getElementById('text-input1');
    const textInput2 = document.getElementById('text-input2');

    // 默认显示的文本
    const text1Width = getTextWidth(textInput1.placeholder, 'bold italic 120px LIST');
    const text2Width = getTextWidth(textInput2.placeholder, '30px FFMC');
    fillCanvas(ctx, fontColor, 'bold italic 120px LIST', false, canvas.width/2, canvas.height/2-30, textInput1.placeholder);
    fillCanvas(ctx, fontColor, '30px FFMC', false, canvas.width/2 + text1Width/2 - text2Width/2, canvas.height/2+40, textInput2.placeholder);
    const dataURL = canvas.toDataURL('image/png');
    artImage.src = dataURL; 

    // 监听输入框的 input 事件
    function updateCanvas() {
      // 获取文本
      const text1Width = getTextWidth(textInput1.value || textInput1.placeholder, 'bold italic 120px LIST');
      const text2Width = getTextWidth(textInput2.value || textInput2.placeholder, '30px FFMC');
      if (text1Width > originWidth-36 || text2Width > (originWidth/2 + text1Width/2 - 36)) {
        canvas.width = Math.max(text1Width+36, (text2Width+36 - text1Width/2)*2);
      }

      // 绘制背景
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制文本
      if (!transparentBgCheckbox.checked && swapBgCheckbox.checked && strokeCheckbox.checked) {
        const temp = fontColor;
        fontColor = bgColor;
        fillCanvas(ctx, fontColor, 'bold italic 120px LIST', strokeCheckbox.checked, canvas.width/2, canvas.height/2-30, textInput1.value || textInput1.placeholder);
        if (centerCheckbox.checked) {
          fillCanvas(ctx, fontColor, '32px FFMC', strokeCheckbox.checked, canvas.width/2, canvas.height/2+40, textInput2.value || textInput2.placeholder);
        } else {
          fillCanvas(ctx, fontColor, '30px FFMC', strokeCheckbox.checked, canvas.width/2 + text1Width/2 - text2Width/2, canvas.height/2+40, textInput2.value || textInput2.placeholder);
        }
        fontColor = temp;
      } else {
        fillCanvas(ctx, fontColor, 'bold italic 120px LIST', strokeCheckbox.checked, canvas.width/2, canvas.height/2-30, textInput1.value || textInput1.placeholder);
        if (centerCheckbox.checked) {
          fillCanvas(ctx, fontColor, '32px FFMC', strokeCheckbox.checked, canvas.width/2, canvas.height/2+40, textInput2.value || textInput2.placeholder);
        } else {
          fillCanvas(ctx, fontColor, '30px FFMC', strokeCheckbox.checked, canvas.width/2 + text1Width/2 - text2Width/2, canvas.height/2+40, textInput2.value || textInput2.placeholder);
        }
      }
      
      const dataURL = canvas.toDataURL('image/png');
      artImage.src = dataURL;
    }

    textInput1.addEventListener('input', updateCanvas);
    textInput2.addEventListener('input', updateCanvas);

    // 透明背景
    transparentBgCheckbox.addEventListener('change', function () {
      if (!swapBgCheckbox.checked) {
        if (this.checked) {
          bgColor = 'black';
        } else {
          bgColor = 'white';
        }
      } else {
        if (this.checked) {
          fontColor = 'black';
        } else {
          fontColor = 'white';
        }
      }
      updateCanvas();
    });

    // 下排居中
    centerCheckbox.addEventListener('change', function () {
      if (this.checked) {
        document.getElementById('text-input2').placeholder = 'School idol project series';
      } else {
        document.getElementById('text-input2').placeholder = 'School idol project';
      }
      updateCanvas();
    });

    // 互换底色
    swapBgCheckbox.addEventListener('change', function () {
      const temp = bgColor;
      bgColor = fontColor;
      fontColor = temp;
      updateCanvas();
    });

    // 文字描边
    strokeCheckbox.addEventListener('change', function () {
      updateCanvas();
    });

    // 添加下载按钮的点击事件
    document.getElementById('download-btn').addEventListener('click', function () {
      const dataURL = canvas.toDataURL(transparentBgCheckbox.checked ? 'image/png' : 'image/jpeg');
      const downloadLink = document.createElement('a');

      downloadLink.href = dataURL;
      downloadLink.download = transparentBgCheckbox.checked ? 'artistic_text.png' : 'artistic_text.jpg';

      downloadLink.click();
    });
  });

  if (document.body.style.visibility != 'visible') {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }
});
