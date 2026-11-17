// Parse only the four arithmetic operators, parentheses and integer literals.
export function evaluateArithmetic(input) {
  if (input.length > 1000 || /[^\d\s()+*/-]/.test(input)) throw new Error('无效算式');
  const tokens = input.match(/\d+|[()+*/-]/g) || [];
  let index = 0;
  function atom() {
    const token = tokens[index++];
    if (token === '+' || token === '-') return (token === '-' ? -1 : 1) * atom();
    if (token === '(') {
      const value = expression();
      if (tokens[index++] !== ')') throw new Error('括号不匹配');
      return value;
    }
    if (!/^\d+$/.test(token || '')) throw new Error('缺少数字');
    return Number(token);
  }
  function product() {
    let value = atom();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++];
      const right = atom();
      if (operator === '/' && right === 0) throw new Error('不能除以零');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }
  function expression() {
    let value = product();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++];
      const right = product();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }
  const result = expression();
  if (index !== tokens.length || !Number.isFinite(result)) throw new Error('无效算式');
  return result;
}
