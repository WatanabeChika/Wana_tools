// func: 填充Canvas
export function fillCanvas(ctx, color, font, stroke, x, y, input) {
    // 设置文本样式
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  
    if (stroke) {
        // 添加描边效果
        if (ctx.globalCompositeOperation == 'destination-out') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 15;
            ctx.lineJoin = 'round';
            ctx.strokeText(input, x+3, y+3);
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 15;
            ctx.lineJoin = 'round';
            ctx.strokeText(input, x+3, y+3);
        }
    }
  
    ctx.fillText(input, x, y);
}

// export function fillCanvas(ctx, texts, stroke, clip) {
//     for (let i = 0; i < texts.length; i++) {
//         const currText = texts[i];
//         ctx.fillStyle = currText.color;
//         ctx.font = currText.font;
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
//         // 添加描边效果
//         if (stroke) {
//             ctx.strokeStyle = 'white';
//             ctx.lineWidth = 15;
//             ctx.lineJoin = 'round';
//             if (clip) {
//                 ctx.globalCompositeOperation = 'source-over';
//                 ctx.strokeText(input, x+3, y+3);
//                 ctx.globalCompositeOperation = 'destination-out';
//             }  
//         }
//         ctx.fillText(currText.text, currText.x, currText.y);
//     }
// }
  
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