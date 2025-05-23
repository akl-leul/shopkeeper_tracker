export const evaluateExpression = (expression: string): number => {
  // Replace visual operators with JavaScript operators
  const sanitizedExpression = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'Math.PI')
    .replace(/e/g, 'Math.E')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/\^/g, '**');
  
  // Use Function constructor to evaluate the expression
  // eslint-disable-next-line no-new-func
  return Function(`'use strict'; return (${sanitizedExpression})`)();
};

export const formatExpression = (expression: string): string => {
  // Format the expression for display
  return expression
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/Math\.PI/g, 'π')
    .replace(/Math\.E/g, 'e')
    .replace(/Math\.sin\(/g, 'sin(')
    .replace(/Math\.cos\(/g, 'cos(')
    .replace(/Math\.tan\(/g, 'tan(')
    .replace(/Math\.log10\(/g, 'log(')
    .replace(/Math\.log\(/g, 'ln(')
    .replace(/Math\.sqrt\(/g, 'sqrt(')
    .replace(/\*\*/g, '^');
};