// func: 填充Canvas文本
export function fillCanvasText(ctx, color, font, stroke, x, y, input) {
    // 设置文本样式
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    if (stroke) {
        // 添加描边效果
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 15;
        ctx.lineJoin = 'round';
        if (ctx.globalCompositeOperation == 'destination-out') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeText(input, x+3, y+3);
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.strokeText(input, x+3, y+3);
        }
    }
    ctx.fillText(input, x, y);
}
  
// func: 获取文本宽度
export function getTextWidth(text, font) {
    const span = document.createElement('span');
    span.style.font = font;
    span.textContent = text;
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return width;
}

// func: 加载图片
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

// func: 打乱数组并记录相对位置
export function shuffleLogArray(originArray) {
    let array = originArray.slice();
    let relativePositions = [];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // 交换元素
      [array[i], array[j]] = [array[j], array[i]];
    } 
    for (let i = 0; i < originArray.length; i++) {
        const element = originArray[i];
        relativePositions.push([i, array.indexOf(element)]);      
    }
    return [array, relativePositions];
}  