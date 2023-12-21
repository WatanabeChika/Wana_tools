
function fillCanvas(text, color, font, x, y, input) {
  text.fillStyle = color;
  text.font = font;
  text.textAlign = 'center';
  text.textBaseline = 'middle';
  text.fillText(input, x, y);
} 

let hasRefreshed = false;

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
    // 获取文本宽度
    function getTextWidth(text, font) {
      const span = document.createElement('span');
      span.style.font = font;
      span.textContent = text;
      document.body.appendChild(span);
      const width = span.offsetWidth;
      document.body.removeChild(span);
      return width;
      }

    // 获取Canvas元素和图片元素
    const canvas = document.getElementById('art-canvas');
    const ctx = canvas.getContext('2d');
    const canvasContainer = document.getElementById('canvas-container');
    const artImage = document.getElementById('art-image');

    let center = false;

    // 背景颜色填充为白色
    let bgColor = "#ffffff";
    let fontColor = "#E4007F";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const transparentBgCheckbox = document.getElementById('transparent-bg');
    const centerCheckbox = document.getElementById('text-place');
    const swapBgCheckbox = document.getElementById('color-swap');
    const textInput1 = document.getElementById('text-input1');
    const textInput2 = document.getElementById('text-input2');

    // 默认显示的文本
    const text1Width = getTextWidth(textInput1.placeholder, 'bold italic 120px LIST');
    const text2Width = getTextWidth(textInput2.placeholder, '30px FFMC');
    fillCanvas(ctx, fontColor, 'bold italic 120px LIST', canvas.width/2, canvas.height/2-30, textInput1.placeholder);
    fillCanvas(ctx, fontColor, '30px FFMC', canvas.width/2 + text1Width/2 - text2Width/2, canvas.height/2+40, textInput2.placeholder);
    const dataURL = canvas.toDataURL('image/png');
    artImage.src = dataURL; 

    // 监听输入框的 input 事件
    function updateCanvas() {
      // 清空Canvas
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 在Canvas上绘制文本
      const text1Width = getTextWidth(textInput1.value || textInput1.placeholder, 'bold italic 120px LIST');
      const text2Width = getTextWidth(textInput2.value || textInput2.placeholder, '30px FFMC');
      fillCanvas(ctx, fontColor, 'bold italic 120px LIST', canvas.width/2, canvas.height/2-30, textInput1.value || textInput1.placeholder);
      if (center) {
        fillCanvas(ctx, fontColor, '32px FFMC', canvas.width/2, canvas.height/2+40, textInput2.value || textInput2.placeholder);
      } else {
        fillCanvas(ctx, fontColor, '30px FFMC', canvas.width/2 + text1Width/2 - text2Width/2, canvas.height/2+40, textInput2.value || textInput2.placeholder);
      }
      
      const dataURL = canvas.toDataURL('image/png');
      artImage.src = dataURL;
    }

    textInput1.addEventListener('input', updateCanvas);
    textInput2.addEventListener('input', updateCanvas);

    // 透明背景
    transparentBgCheckbox.addEventListener('change', function () {
      if (this.checked) {
        bgColor = 'black';
      } else {
        bgColor = "#ffffff";
      }
      updateCanvas();
    });

    // 下排居中
    centerCheckbox.addEventListener('change', function () {
      if (this.checked) {
        document.getElementById('text-input2').placeholder = 'School idol project series';
        center = true;
      } else {
        document.getElementById('text-input2').placeholder = 'School idol project';
        center = false;
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

    // 添加下载按钮的点击事件
    document.getElementById('download-btn').addEventListener('click', function () {
      // 将Canvas内容转换为数据URL
      const dataURL = canvas.toDataURL(transparentBgCheckbox.checked ? 'image/png' : 'image/jpeg');

      // 创建一个下载链接
      const downloadLink = document.createElement('a');

      // 设置下载链接的属性
      downloadLink.href = dataURL;
      downloadLink.download = transparentBgCheckbox.checked ? 'artistic_text.png' : 'artistic_text.jpg';

      // 模拟点击下载链接
      downloadLink.click();
    });
  });
  if (document.body.style.visibility != 'visible') {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }
});
