// func: 填充Canvas
export function fillCanvas(text, color, font, stroke, x, y, input) {
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
export function getTextWidth(text, font) {
    const span = document.createElement('span');
    span.style.font = font;
    span.textContent = text;
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return width;
}