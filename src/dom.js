export function element(tag, { className, text, attrs = {} } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  node.append(...children);
  return node;
}

export function button(text, className, onClick) {
  const node = element('button', { text, className, attrs: { type: 'button' } });
  node.addEventListener('click', onClick);
  return node;
}
