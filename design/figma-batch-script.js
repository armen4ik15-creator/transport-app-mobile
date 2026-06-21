/**
 * ReestrPro — один batch-скрипт для Figma Plugin API (use_figma).
 * Создаёт экраны 04–08 с привязкой к variables ReestrPro Tokens.
 * Opti/Fuel — НЕ создаём.
 *
 * Запуск: через Cursor MCP use_figma, fileKey: xnJgIHyde1Xip5kzI3i0zm
 */

// --- resolve variables ---
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const col = collections.find(c => c.name === 'ReestrPro Tokens');
if (!col) throw new Error('Create ReestrPro Tokens collection first');
const modeId = col.modes[0].modeId;

async function getVar(name) {
  for (const id of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v.name === name) return v;
  }
  throw new Error('Missing variable: ' + name);
}

const V = {
  bg: await getVar('color/bg'),
  surface: await getVar('color/surface'),
  elevated: await getVar('color/surface-elevated'),
  primary: await getVar('color/primary'),
  profit: await getVar('color/profit'),
  loss: await getVar('color/loss'),
  text: await getVar('color/text-primary'),
  muted: await getVar('color/text-secondary'),
};

function bindFill(node, variable) {
  const paints = figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } },
    'color',
    variable
  );
  node.fills = [paints];
}

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

function text(chars, size, style) {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style };
  t.characters = chars;
  t.fontSize = size;
  bindFill(t, V.text);
  return t;
}

function screen(name, x) {
  const f = figma.createFrame();
  f.name = name;
  f.resize(390, 844);
  f.x = x;
  f.y = 0;
  bindFill(f, V.bg);
  f.layoutMode = 'VERTICAL';
  f.paddingTop = 48;
  f.paddingLeft = 16;
  f.paddingRight = 16;
  f.paddingBottom = 16;
  f.itemSpacing = 12;
  f.clipsContent = true;
  figma.currentPage.appendChild(f);
  return f;
}

const created = [];

// 04 Expenses List @ x=860
{
  const s = screen('04 Expenses List', 860);
  const hdr = figma.createFrame();
  hdr.layoutMode = 'VERTICAL';
  hdr.itemSpacing = 12;
  hdr.cornerRadius = 16;
  hdr.paddingTop = 16;
  hdr.paddingBottom = 16;
  hdr.paddingLeft = 16;
  hdr.paddingRight = 16;
  hdr.layoutAlign = 'STRETCH';
  bindFill(hdr, V.surface);
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.layoutAlign = 'STRETCH';
  const t1 = text('Расходы', 22, 'Bold');
  const t2 = text('▲', 16, 'Regular');
  bindFill(t2, V.muted);
  row.appendChild(t1);
  row.appendChild(t2);
  hdr.appendChild(row);
  hdr.appendChild(text('Фильтры · март 2026', 12, 'Regular'));
  s.appendChild(hdr);
  for (const [cat, sum] of [['🚔 ДПС', '5 000 ₽'], ['⛽ Топливо', '3 200 ₽']]) {
    const card = figma.createFrame();
    card.layoutMode = 'HORIZONTAL';
    card.primaryAxisAlignItems = 'SPACE_BETWEEN';
    card.paddingTop = 14;
    card.paddingBottom = 14;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.cornerRadius = 12;
    card.layoutAlign = 'STRETCH';
    bindFill(card, V.elevated);
    card.appendChild(text(cat, 15, 'Semi Bold'));
    card.appendChild(text(sum, 15, 'Bold'));
    s.appendChild(card);
  }
  created.push(s.id);
}

// 05 Add Expense @ x=1290
{
  const s = screen('05 Add Expense', 1290);
  s.appendChild(text('Новый расход', 22, 'Bold'));
  for (const c of ['Топливо', 'ДПС', 'Обслуживание', 'Зарплата']) {
    const chip = figma.createFrame();
    chip.layoutMode = 'HORIZONTAL';
    chip.paddingTop = 8;
    chip.paddingBottom = 8;
    chip.paddingLeft = 12;
    chip.paddingRight = 12;
    chip.cornerRadius = 20;
    bindFill(chip, c === 'ДПС' ? V.primary : V.elevated);
    chip.appendChild(text(c, 13, 'Medium'));
    s.appendChild(chip);
  }
  const dateField = figma.createFrame();
  dateField.layoutAlign = 'STRETCH';
  dateField.paddingTop = 14;
  dateField.paddingBottom = 14;
  dateField.paddingLeft = 16;
  dateField.cornerRadius = 12;
  bindFill(dateField, V.elevated);
  const dt = text('📅 12.06.2026 — нажмите для календаря', 14, 'Regular');
  bindFill(dt, V.muted);
  dateField.appendChild(dt);
  s.appendChild(dateField);
  const btn = figma.createFrame();
  btn.layoutAlign = 'STRETCH';
  btn.paddingTop = 16;
  btn.paddingBottom = 16;
  btn.cornerRadius = 12;
  bindFill(btn, V.primary);
  btn.appendChild(text('Сохранить', 16, 'Semi Bold'));
  s.appendChild(btn);
  created.push(s.id);
}

// 06 Reports @ x=1720
{
  const s = screen('06 Reports', 1720);
  s.appendChild(text('Отчёты', 22, 'Bold'));
  const b1 = figma.createFrame();
  b1.layoutAlign = 'STRETCH';
  b1.paddingTop = 16;
  b1.paddingBottom = 16;
  b1.cornerRadius = 12;
  bindFill(b1, V.primary);
  b1.appendChild(text('Выгрузить всё за сегодня', 16, 'Semi Bold'));
  s.appendChild(b1);
  s.appendChild(text('Период: С ___  По ___', 14, 'Regular'));
  s.appendChild(text('Найдено: 12 записей', 14, 'Medium'));
  const b2 = figma.createFrame();
  b2.layoutAlign = 'STRETCH';
  b2.paddingTop = 14;
  b2.paddingBottom = 14;
  b2.cornerRadius = 12;
  bindFill(b2, V.elevated);
  b2.appendChild(text('Скачать Excel', 15, 'Semi Bold'));
  s.appendChild(b2);
  created.push(s.id);
}

// 07 Contractor Payments @ x=2150
{
  const s = screen('07 Contractor Payments', 2150);
  s.appendChild(text('Оплаты контрагентам', 22, 'Bold'));
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.layoutAlign = 'STRETCH';
  row.paddingTop = 14;
  row.paddingBottom = 14;
  row.paddingLeft = 16;
  row.paddingRight = 16;
  row.cornerRadius = 12;
  bindFill(row, V.elevated);
  row.appendChild(text('ООО ТрансЛогистик', 15, 'Medium'));
  const st = text('Частично', 13, 'Medium');
  bindFill(st, V.loss);
  row.appendChild(st);
  s.appendChild(row);
  const fixedBtn = figma.createFrame();
  fixedBtn.layoutAlign = 'STRETCH';
  fixedBtn.paddingTop = 16;
  fixedBtn.paddingBottom = 16;
  fixedBtn.cornerRadius = 12;
  bindFill(fixedBtn, V.primary);
  fixedBtn.appendChild(text('Привязать платёж', 16, 'Semi Bold'));
  s.appendChild(fixedBtn);
  created.push(s.id);
}

// 08 Settings @ x=2580
{
  const s = screen('08 Settings', 2580);
  s.appendChild(text('Настройки', 22, 'Bold'));
  s.appendChild(text('Сервер API', 14, 'Medium'));
  const url = figma.createFrame();
  url.layoutAlign = 'STRETCH';
  url.paddingTop = 12;
  url.paddingBottom = 12;
  url.paddingLeft = 12;
  url.cornerRadius = 10;
  bindFill(url, V.elevated);
  const u = text('armen4ik15-creator-...twc1.net', 12, 'Regular');
  bindFill(u, V.muted);
  url.appendChild(u);
  s.appendChild(url);
  s.appendChild(text('Водители и машины', 14, 'Medium'));
  s.appendChild(text('Уведомления', 14, 'Medium'));
  s.appendChild(text('(Opti — отложено, не показываем)', 12, 'Regular'));
  created.push(s.id);
}

figma.currentPage.name = 'Screens';

return {
  createdNodeIds: created,
  message: 'Screens 04-08 created with variable bindings. Change colors in ReestrPro Tokens.',
};
