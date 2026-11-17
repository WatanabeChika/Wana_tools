<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { pinyin } from 'pinyin-pro';
import { loadCards } from '../utils/resources';

const FRAMES = [
  { name: '通常怪兽', color: '#c5a265' },
  { name: '效果怪兽', color: '#bb7847' },
  { name: '仪式怪兽', color: '#6a9ac7' },
  { name: '融合怪兽', color: '#9765ad' },
  { name: '同调怪兽', color: '#e5e5e5' },
  { name: '超量怪兽', color: '#343434' },
  { name: '连接怪兽', color: '#2478b4' },
  { name: '魔法', color: '#329c83' },
  { name: '陷阱', color: '#b76090' },
];
const MAX_CHARACTERS = 80;
// 卡图坐标统一按 400 × 580 计算；长卡名在标题框内横向压缩。
const CARD_WIDTH = 400;
const CARD_HEIGHT = 580;
const TITLE_LEFT = 32;
const TITLE_WIDTH = 298;
const TITLE_FONT_SIZE = 29.2;

const sentence = ref('');
const allowHomophones = ref(true);
const ignoreTone = ref(false);
const charactersPerRow = ref(20);
const outputHeight = ref(580);
const dataLoading = ref(true);
const dataError = ref('');
const cardCount = ref(0);
const busy = ref(false);
const progress = ref('');
const error = ref('');
const generated = ref(false);
const tokens = ref([]);
const selectedIndex = ref(null);
const replacement = ref('');
const canvas = ref(null);

const exactIndex = new Map();
const toneIndex = new Map();
const soundIndex = new Map();
const loadedImages = new Map();
const pendingLoads = new Map();
const titleLayouts = new Map();
const cancelLoads = new Set();
let pools = [];
let hitAreas = [];
let disposed = false;

const inputLength = computed(() => Array.from(sentence.value).length);
const selectedToken = computed(() => tokens.value[selectedIndex.value] || null);
const missingCount = computed(() => tokens.value.filter(token => token.kind === 'missing').length);
const failedCount = computed(() => tokens.value.filter(token => token.status === 'failed').length);
const substitutions = computed(() => tokens.value.filter(token => token.candidate && token.input !== token.candidate.character));
const frameCounts = computed(() => FRAMES.map(frame => ({
  ...frame,
  count: tokens.value.filter(token => token.status === 'ready' && token.candidate?.frame === frame.name).length,
})));
const usedFrameCount = computed(() => frameCounts.value.filter(frame => frame.count > 0).length);
const canDownload = computed(() => generated.value && !busy.value && !missingCount.value && !failedCount.value);
const usedCards = computed(() => [...new Map(tokens.value.filter(token => token.candidate)
  .map(token => [token.candidate.id, token.candidate])).values()]);
const canDownloadCards = computed(() => generated.value && !busy.value && usedCards.value.length > 0 && !failedCount.value);
const selectedCrop = computed(() => selectedToken.value?.candidate ? cropBounds(selectedToken.value) : null);
const selectedImageUrl = computed(() => {
  const token = selectedToken.value;
  return token?.status === 'ready' ? loadedImages.get(token.candidate.id)?.src : '';
});

function addToIndex(index, key, candidate) {
  if (!index.has(key)) index.set(key, []);
  index.get(key).push(candidate);
}

function frameOf(card) {
  // 只检查类型标题，避免把“魔法师族”误判为魔法卡。
  const types = card.text?.types?.match(/^\[([^\]]+)\]/)?.[1].split('|') || [];
  if (types.includes('魔法')) return '魔法';
  if (types.includes('陷阱')) return '陷阱';
  if (!types.includes('怪兽') || (Number(card.data?.type) & 0x4000)) return null;
  for (const name of ['仪式', '融合', '同调', '超量', '连接']) {
    if (types.includes(name)) return `${name}怪兽`;
  }
  // 灵摆按上半部卡框归类，保留仪式、融合、同调、超量等主色。
  return types.includes('通常') ? '通常怪兽' : '效果怪兽';
}

function pronunciations(text) {
  // all 格式逐字返回，同时利用整句语境判断多音字。
  return pinyin(text, { type: 'all', toneType: 'num' });
}

async function initialize() {
  dataLoading.value = true;
  dataError.value = '';
  try {
    const cards = await loadCards();
    if (disposed) return;
    const measure = document.createElement('canvas').getContext('2d');
    if (!measure) throw new Error('浏览器不支持 Canvas');
    measure.font = `${TITLE_FONT_SIZE}px Arial, SimSun, "Songti SC", sans-serif`;
    exactIndex.clear();
    toneIndex.clear();
    soundIndex.clear();
    let count = 0;
    for (let cardIndex = 0; cardIndex < cards.length; cardIndex++) {
      const card = cards[cardIndex];
      const frame = frameOf(card);
      // CDN 卡图使用 cn_name，不使用其他译名或日文名代替它定位。
      if (frame && card.cn_name && Number(card.id) > 0) {
        const characters = Array.from(card.cn_name);
        const widths = characters.map(character => measure.measureText(character).width);
        const naturalWidth = widths.reduce((sum, width) => sum + width, 0);
        const scale = Math.min(1, TITLE_WIDTH / naturalWidth);
        const readings = pronunciations(card.cn_name);
        let left = TITLE_LEFT;
        characters.forEach((character, index) => {
          const width = widths[index] * scale;
          if (!/\s/u.test(character)) {
            const candidate = { id: Number(card.id), name: card.cn_name, frame, character, index, left, width, widths, naturalWidth };
            addToIndex(exactIndex, character, candidate);
            const reading = readings[index];
            if (reading?.isZh && reading.pinyin) {
              addToIndex(toneIndex, reading.pinyin, candidate);
              addToIndex(soundIndex, reading.pinyin.replace(/[0-5]$/, ''), candidate);
            }
          }
          left += width;
        });
        count++;
      }
      // 大卡库分批处理，让加载提示及移动端界面有机会刷新。
      if (cardIndex % 600 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
        if (disposed) return;
      }
    }
    cardCount.value = count;
    if (!count) throw new Error('卡库中没有可用的中文卡名');
  } catch (cause) {
    if (!disposed) dataError.value = `卡片数据加载失败，请重试。${cause.message}`;
  } finally {
    if (!disposed) dataLoading.value = false;
  }
}

function matchesFor(character, reading) {
  const exact = exactIndex.get(character);
  if (exact?.length) return { candidates: exact, mode: 'exact' };
  if (allowHomophones.value && reading?.isZh) {
    const sameTone = toneIndex.get(reading.pinyin);
    if (sameTone?.length) return { candidates: sameTone, mode: 'homophone' };
    if (ignoreTone.value) {
      const sameSound = soundIndex.get(reading.pinyin.replace(/[0-5]$/, ''));
      if (sameSound?.length) return { candidates: sameSound, mode: 'near' };
    }
  }
  return { candidates: [], mode: 'missing' };
}

// 先为颜色与文字位置做最大匹配，保证在原字优先的前提下尽量覆盖九种卡框。
function assignFrames(candidatePools) {
  const positionFrames = candidatePools.map(pool => new Set(pool.map(candidate => candidate.frame)));
  const assignments = new Map();
  function place(frame, visited) {
    const positions = positionFrames.map((frames, index) => ({ frames, index }))
      .filter(position => position.frames.has(frame)).sort(() => Math.random() - 0.5);
    for (const { index } of positions) {
      if (visited.has(index)) continue;
      visited.add(index);
      if (!assignments.has(index) || place(assignments.get(index), visited)) {
        assignments.set(index, frame);
        return true;
      }
    }
    return false;
  }
  const frames = FRAMES.map(frame => frame.name).sort(() => Math.random() - 0.5);
  frames.forEach(frame => place(frame, new Set()));
  return assignments;
}

function pickCandidate(candidates, existing, preferredFrame, excludedId) {
  const frameUsage = new Map();
  const ids = new Set();
  existing.forEach(candidate => {
    if (!candidate) return;
    frameUsage.set(candidate.frame, (frameUsage.get(candidate.frame) || 0) + 1);
    ids.add(candidate.id);
  });
  const alternatives = candidates.filter(candidate => candidate.id !== excludedId);
  const available = alternatives.length ? alternatives : candidates;
  let best = null;
  let bestScore = Infinity;
  for (const candidate of available) {
    const score = (preferredFrame && candidate.frame !== preferredFrame ? 10000 : 0)
      + (frameUsage.get(candidate.frame) || 0) * 100
      + (ids.has(candidate.id) ? 35 : 0)
      + (candidate.frame === existing[existing.length - 1]?.frame ? 12 : 0)
      + (TITLE_FONT_SIZE - candidate.width) * 0.25 + candidate.index * 0.2 + Math.random() * 10;
    if (score < bestScore) { best = candidate; bestScore = score; }
  }
  return best;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      cancelLoads.delete(cancel);
    };
    const fail = () => {
      cleanup();
      img.src = '';
      reject(new Error('卡图加载失败'));
    };
    const cancel = () => fail();
    cancelLoads.add(cancel);
    img.onload = () => {
      if (img.naturalWidth < 200 || img.naturalHeight / img.naturalWidth < 1.35) return fail();
      cleanup();
      resolve(img);
    };
    img.onerror = fail;
    timer = setTimeout(fail, 10000);
    img.src = url;
  });
}

async function getCardImage(id) {
  if (loadedImages.has(id)) return loadedImages.get(id);
  if (pendingLoads.has(id)) return pendingLoads.get(id);
  const request = (async () => {
    const source = `https://cdn.233.momobako.com/ygopro/pics/${id}.jpg`;
    let img;
    try {
      // 沿用现有编辑器的代理，取得允许 Canvas 导出的跨域卡图。
      img = await loadImage(`https://wsrv.nl/?url=${encodeURIComponent(source)}`);
    } catch (cause) {
      if (disposed) throw cause;
      img = await loadImage(source);
    }
    if (loadedImages.size >= 100) {
      const activeIds = new Set(tokens.value.map(token => token.candidate?.id));
      const unusedId = [...loadedImages.keys()].find(key => !activeIds.has(key));
      if (unusedId !== undefined) loadedImages.delete(unusedId);
    }
    loadedImages.set(id, img);
    return img;
  })();
  pendingLoads.set(id, request);
  try { return await request; } finally { pendingLoads.delete(id); }
}

async function loadToken(token) {
  token.status = 'loading';
  try {
    const img = await getCardImage(token.candidate.id);
    if (!disposed) {
      calibrateTitle(token.candidate, img);
      token.layout = titleLayouts.get(token.candidate.id)?.[token.candidate.index] || null;
      token.status = 'ready';
    }
  } catch {
    if (!disposed) token.status = 'failed';
  }
}

async function generate() {
  if (busy.value || dataLoading.value || dataError.value) return;
  error.value = '';
  const text = sentence.value.replace(/\r\n?/g, '\n');
  if (!text.trim()) { error.value = '请先输入一句话。'; return; }
  if (inputLength.value > MAX_CHARACTERS) { error.value = `最多输入 ${MAX_CHARACTERS} 个字符（含空格和换行）。`; return; }
  if (text.split('\n').length > 8) { error.value = '最多保留 8 行，请减少换行。'; return; }
  busy.value = true;
  generated.value = false;
  selectedIndex.value = null;
  const readings = pronunciations(text);
  pools = [];
  tokens.value = Array.from(text).map((character, index) => {
    const result = matchesFor(character, readings[index]);
    pools.push(result.candidates);
    return {
      input: character, kind: character === '\n' ? 'break' : /\s/u.test(character) ? 'space' : result.candidates.length ? 'card' : 'missing',
      matchMode: result.mode, candidate: null, status: '', offset: 0, widthScale: 1,
    };
  });
  const assignments = assignFrames(pools);
  const chosen = [];
  tokens.value.forEach((token, index) => {
    if (token.kind !== 'card') return;
    token.candidate = pickCandidate(pools[index], chosen, assignments.get(index));
    chosen.push(token.candidate);
  });
  let finished = 0;
  const toLoad = tokens.value.filter(token => token.kind === 'card');
  progress.value = `正在加载卡图 0 / ${toLoad.length}`;
  try {
    // 限制并发，长句不会同时发出几十个图片请求。
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(6, toLoad.length) }, async () => {
      while (cursor < toLoad.length && !disposed) {
        const token = toLoad[cursor++];
        await loadToken(token);
        progress.value = `正在加载卡图 ${++finished} / ${toLoad.length}`;
      }
    }));
    if (disposed) return;
    generated.value = true;
    selectedIndex.value = tokens.value.findIndex(token => token.kind !== 'break' && token.kind !== 'space');
    await nextTick();
    draw();
  } catch (cause) {
    error.value = `生成失败，请重试。${cause.message}`;
  } finally {
    if (!disposed) { busy.value = false; progress.value = ''; }
  }
}

function calibrateTitle(candidate, img) {
  if (titleLayouts.has(candidate.id)) return;
  // 在统一坐标中检测卡名的金色笔画；使用整行宽度拟合压缩比例，再寻找字间空隙。
  const sample = document.createElement('canvas');
  sample.width = CARD_WIDTH;
  sample.height = CARD_HEIGHT;
  const ctx = sample.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  let pixels;
  try { pixels = ctx.getImageData(0, 31, CARD_WIDTH, 31).data; } catch { return; }
  const ink = new Float64Array(CARD_WIDTH);
  for (let x = 30; x < 331; x++) {
    for (let y = 0; y < 31; y++) {
      const offset = (y * CARD_WIDTH + x) * 4;
      const [r, g, b] = pixels.subarray(offset, offset + 3);
      if (r > 160 && g > 125 && r - b > 110 && g - b > 90) ink[x]++;
    }
  }
  const columns = Array.from(ink.keys()).filter(x => ink[x] >= 2);
  if (columns.length < 6) return;
  const characters = Array.from(candidate.name);
  const lastCharacter = characters[characters.length - 1];
  // 末尾引号、句点等只占字框的一小部分，不能把最后一笔当成整个字框的右沿。
  const trailingInset = /[」』”’]/u.test(lastCharacter) ? 0.62 : /[。．.]/u.test(lastCharacter) ? 0.55 : 0.07;
  const visibleWidth = candidate.naturalWidth - candidate.widths.at(-1) * trailingInset;
  const observedScale = (columns.at(-1) + 1 - TITLE_LEFT) / visibleWidth;
  const expectedScale = Math.min(1, TITLE_WIDTH / candidate.naturalWidth);
  if (observedScale < expectedScale * 0.78 || observedScale > expectedScale * 1.18) return;
  const scale = Math.min(1.08, (331 - TITLE_LEFT) / candidate.naturalWidth, observedScale);
  const expected = [TITLE_LEFT];
  candidate.widths.forEach(width => expected.push(expected.at(-1) + width * scale));
  // 动态规划同时约束整行字序、字宽和边界，避免把一个汉字内部的空隙误当成字间距。
  let previous = new Map([[TITLE_LEFT, { cost: 0, boundaries: [TITLE_LEFT] }]]);
  for (let index = 1; index < expected.length; index++) {
    const next = new Map();
    const width = candidate.widths[index - 1] * scale;
    const radius = Math.max(2, Math.min(7, width * 0.24));
    const end = index === characters.length;
    const from = end ? Math.round(expected[index]) : Math.floor(expected[index] - radius);
    const to = end ? from : Math.ceil(expected[index] + radius);
    for (let x = Math.max(31, from); x <= Math.min(331, to); x++) {
      const boundaryInk = end ? 0 : (ink[x - 1] + ink[x]) / 2;
      let best;
      for (const [left, path] of previous) {
        if (x - left < Math.max(2, width * 0.45)) continue;
        const cost = path.cost + boundaryInk * 0.65 + ((x - expected[index]) / Math.max(2, width * 0.2)) ** 2
          + ((x - left - width) / Math.max(2, width * 0.2)) ** 2;
        if (!best || cost < best.cost) best = { cost, boundaries: [...path.boundaries, x] };
      }
      if (best) next.set(x, best);
    }
    if (!next.size) return;
    previous = next;
  }
  const best = [...previous.values()].sort((a, b) => a.cost - b.cost)[0];
  titleLayouts.set(candidate.id, best.boundaries.slice(0, -1).map((left, index) => ({
    left, width: best.boundaries[index + 1] - left,
  })));
}

function cropBounds(token) {
  const candidate = token.candidate;
  const layout = token.layout || candidate;
  const width = Math.max(3, Math.min(CARD_WIDTH, layout.width * token.widthScale));
  const left = layout.left + (layout.width - width) / 2 + token.offset;
  return { x: Math.max(0, Math.min(CARD_WIDTH - width, left)), width };
}

function draw() {
  if (!generated.value || !canvas.value) return;
  const rows = [[]];
  const maxColumns = Math.min(40, Math.max(4, Number(charactersPerRow.value) || 20));
  tokens.value.forEach((token, index) => {
    if (token.kind === 'break') { rows.push([]); return; }
    if (rows[rows.length - 1].length >= maxColumns) rows.push([]);
    const width = token.candidate ? cropBounds(token).width : TITLE_FONT_SIZE;
    rows[rows.length - 1].push({ token, index, width });
  });
  const scale = Number(outputHeight.value) / CARD_HEIGHT;
  const padding = 16 * scale;
  const rowGap = 20 * scale;
  const rowWidths = rows.map(row => row.reduce((sum, item) => sum + item.width * scale, 0));
  canvas.value.width = Math.ceil(Math.max(TITLE_FONT_SIZE * scale, ...rowWidths) + padding * 2);
  canvas.value.height = Math.ceil(rows.length * Number(outputHeight.value) + Math.max(0, rows.length - 1) * rowGap + padding * 2);
  const ctx = canvas.value.getContext('2d');
  if (!ctx) { error.value = '浏览器不支持 Canvas，无法绘制。'; return; }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  hitAreas = [];
  rows.forEach((row, rowIndex) => {
    let x = padding;
    const y = padding + rowIndex * (Number(outputHeight.value) + rowGap);
    row.forEach(({ token, index, width }) => {
      const destinationWidth = width * scale;
      if (token.candidate && token.status === 'ready') {
        const img = loadedImages.get(token.candidate.id);
        const crop = cropBounds(token);
        // 仅在 X 方向裁切，Y 方向始终取整张卡；两轴使用同一缩放比例。
        ctx.drawImage(img, crop.x / CARD_WIDTH * img.naturalWidth, 0,
          crop.width / CARD_WIDTH * img.naturalWidth, img.naturalHeight,
          x, y, destinationWidth, Number(outputHeight.value));
      } else if (token.kind !== 'space') {
        ctx.fillStyle = '#fff2f0';
        ctx.fillRect(x, y, destinationWidth, Number(outputHeight.value));
        ctx.fillStyle = '#b33a32';
        ctx.font = `${22 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(token.input, x + destinationWidth / 2, y + 55 * scale);
        ctx.font = `${12 * scale}px sans-serif`;
        ctx.fillText(token.kind === 'missing' ? '缺字' : '失败', x + destinationWidth / 2, y + 90 * scale);
      }
      if (token.kind !== 'space') hitAreas.push({ index, x, y, width: destinationWidth, height: Number(outputHeight.value) });
      x += destinationWidth;
    });
  });
}

function selectToken(index) {
  selectedIndex.value = index;
}

function selectFromCanvas(event) {
  const bounds = canvas.value.getBoundingClientRect();
  const x = (event.clientX - bounds.left) * canvas.value.width / bounds.width;
  const y = (event.clientY - bounds.top) * canvas.value.height / bounds.height;
  const area = hitAreas.find(item => x >= item.x && x < item.x + item.width && y >= item.y && y < item.y + item.height);
  if (area) selectToken(area.index);
}

async function changeCard(manual = false) {
  const token = selectedToken.value;
  if (!token || busy.value) return;
  error.value = '';
  let candidates = pools[selectedIndex.value];
  let mode = token.matchMode;
  if (manual) {
    const characters = Array.from(replacement.value.trim());
    if (characters.length !== 1) { error.value = '请输入一个替代字。'; return; }
    candidates = exactIndex.get(characters[0]) || [];
    if (!candidates.length) { error.value = `卡名中找不到“${characters[0]}”，请换一个字。`; return; }
    mode = characters[0] === token.input ? 'exact' : 'manual';
  }
  if (!candidates?.length) return;
  busy.value = true;
  try {
    const otherCards = tokens.value.filter(other => other !== token).map(other => other.candidate);
    token.candidate = pickCandidate(candidates, otherCards, null, token.candidate?.id);
    token.kind = 'card';
    token.matchMode = mode;
    token.offset = 0;
    token.widthScale = 1;
    token.layout = null;
    pools[selectedIndex.value] = candidates;
    progress.value = '正在加载卡图…';
    await loadToken(token);
    if (!disposed) draw();
  } finally {
    if (!disposed) { busy.value = false; progress.value = ''; }
  }
}

async function retryImages() {
  if (busy.value) return;
  busy.value = true;
  progress.value = '正在重试失败的卡图…';
  try {
    for (const token of tokens.value.filter(item => item.status === 'failed')) {
      if (disposed) return;
      await loadToken(token);
    }
    if (!disposed) draw();
  } finally {
    if (!disposed) { busy.value = false; progress.value = ''; }
  }
}

function download() {
  if (!canDownload.value || !canvas.value) return;
  try {
    canvas.value.toBlob(blob => {
      if (!blob || disposed) { if (!disposed) error.value = '导出失败，请重试。'; return; }
      saveBlob(blob, '游戏王卡名句子.png');
    }, 'image/png');
  } catch {
    error.value = '卡图未允许跨域导出，请换卡或重新生成后重试。';
  }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function imageBlob(img) {
  const source = document.createElement('canvas');
  source.width = img.naturalWidth;
  source.height = img.naturalHeight;
  const ctx = source.getContext('2d');
  if (!ctx) return Promise.reject(new Error('浏览器不支持 Canvas'));
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    source.toBlob(blob => blob ? resolve(blob) : reject(new Error('卡图导出失败')), 'image/png');
  });
}

async function createZip(files) {
  // PNG 已经压缩，ZIP 使用 STORE 模式，避免额外依赖和重复压缩；文件名采用 UTF-8。
  const encoder = new TextEncoder();
  const crcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let crc = index;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    crcTable[index] = crc;
  }
  const parts = [];
  const directory = [];
  let offset = 0;
  let directorySize = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    let crc = 0xffffffff;
    for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    crc = (crc ^ 0xffffffff) >>> 0;
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(12, 33, true); // 1980-01-01，ZIP 格式允许的最早日期。
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local.buffer, name, data);
    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(14, 33, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, data.length, true);
    central.setUint32(24, data.length, true);
    central.setUint16(28, name.length, true);
    central.setUint32(42, offset, true);
    directory.push(central.buffer, name);
    directorySize += 46 + name.length;
    offset += 30 + name.length + data.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, directorySize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end.buffer], { type: 'application/zip' });
}

async function downloadCards() {
  if (!canDownloadCards.value) return;
  const cards = usedCards.value;
  busy.value = true;
  error.value = '';
  try {
    const files = [];
    for (let index = 0; index < cards.length; index++) {
      if (disposed) return;
      const card = cards[index];
      progress.value = `正在打包卡图 ${index + 1} / ${cards.length}`;
      const img = await getCardImage(card.id);
      files.push({ name: `${card.id}_${card.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')}.png`, blob: await imageBlob(img) });
    }
    const sources = tokens.value.map((token, index) => {
      if (!token.candidate) return `${index + 1}\t${JSON.stringify(token.input)}\t${token.kind === 'missing' ? '未匹配' : '空白'}`;
      const crop = cropBounds(token);
      return `${index + 1}\t${token.input}\t${token.candidate.character}\t${token.candidate.id}\t${token.candidate.name}\t${crop.x.toFixed(2)}\t${crop.width.toFixed(2)}`;
    });
    const manifest = `句子：${sentence.value}\n\n完整卡图按卡号去重，保留原始像素尺寸。\n裁切坐标按 400 × 580 卡图计算，纵向始终保留整张卡。\n\n位置\t输入字\t取字\t卡号\t卡名\t裁切左沿\t切片宽度\n${sources.join('\n')}\n`;
    files.push({ name: '逐字来源.txt', blob: new Blob(['\ufeff', manifest], { type: 'text/plain;charset=utf-8' }) });
    const zip = await createZip(files);
    if (!disposed) saveBlob(zip, '游戏王卡名句子_卡图集合.zip');
  } catch (cause) {
    if (!disposed) error.value = `卡图集合下载失败，请重试。${cause.message}`;
  } finally {
    if (!disposed) { busy.value = false; progress.value = ''; }
  }
}

watch([sentence, allowHomophones, ignoreTone], () => {
  generated.value = false;
  tokens.value = [];
  pools = [];
  selectedIndex.value = null;
  error.value = '';
});
watch(selectedIndex, () => { replacement.value = ''; });
watch([charactersPerRow, outputHeight, () => selectedToken.value?.offset, () => selectedToken.value?.widthScale], draw, { flush: 'post' });
onMounted(initialize);
onBeforeUnmount(() => {
  disposed = true;
  for (const cancel of cancelLoads) cancel();
  loadedImages.clear();
  titleLayouts.clear();
  exactIndex.clear();
  toneIndex.clear();
  soundIndex.clear();
});
</script>

<template>
  <section class="sentence-editor">
    <h1 class="tool-title">游戏王卡名句子拼接</h1>

    <div class="sentence-input">
      <label for="ygo-sentence">输入句子</label>
      <span class="counter" :class="{ invalid: inputLength > MAX_CHARACTERS }">{{ inputLength }} / {{ MAX_CHARACTERS
        }}</span>
      <textarea id="ygo-sentence" v-model="sentence" :disabled="busy" rows="3"
        placeholder="例如：我想成为决斗王。支持空格和换行。"></textarea>
    </div>

    <div class="settings-row">
      <span class="setting-label">匹配设置：</span>
      <label><input v-model="allowHomophones" type="checkbox" :disabled="busy"> 找不到原字时使用同音字</label>
      <label><input v-model="ignoreTone" type="checkbox" :disabled="busy || !allowHomophones"> 也允许不同声调</label>
    </div>
    <div class="settings-row">
      <label for="ygo-columns" class="setting-label">每行最多字数：</label>
      <input id="ygo-columns" v-model.number="charactersPerRow" type="number" min="4" max="40" :disabled="busy"
        class="number-input">
      <label for="ygo-height" class="setting-label">卡片高度：</label>
      <select id="ygo-height" v-model.number="outputHeight" :disabled="busy">
        <option :value="580">580 px</option>
        <option :value="870">870 px</option>
        <option :value="1160">1160 px</option>
      </select>
    </div>

    <div class="button-row">
      <button class="primary-button" :disabled="busy || dataLoading || !!dataError" @click="generate">
        {{ dataLoading ? '卡库加载中…' : busy ? '处理中…' : generated ? '重新选卡并生成' : '绘制图片' }}
      </button>
      <button class="download-button" :disabled="!canDownload" @click="download">下载图片</button>
      <button class="download-button" :disabled="!canDownloadCards" @click="downloadCards">下载卡图集合（ZIP）</button>
      <button v-if="failedCount" class="secondary-button" :disabled="busy" @click="retryImages">重试失败卡图</button>
    </div>
    <p v-if="dataError" class="error-message" role="alert">{{ dataError }} <button class="secondary-button small-button"
        @click="initialize">重新加载</button></p>
    <p v-else-if="!dataLoading" class="data-status">已加载 {{ cardCount.toLocaleString() }} 张卡片，选卡时自动优先丰富卡框颜色。</p>
    <p v-if="busy" class="data-status" role="status" aria-live="polite">{{ progress }}</p>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>

    <div v-if="generated" class="result">
      <div class="frame-legend" aria-label="本次使用的卡框颜色">
        <span v-for="frame in frameCounts" :key="frame.name" class="frame-label" :class="{ unused: !frame.count }">
          <span class="frame-swatch" :style="{ backgroundColor: frame.color }"></span>{{ frame.name }} {{ frame.count }}
        </span>
      </div>
      <p class="result-summary" role="status">使用 {{ usedFrameCount }} 种卡框颜色；替代 {{ substitutions.length }}
        字。点击切片或下方文字，可以换卡、调整裁切。</p>
      <p v-if="missingCount || failedCount" class="error-message" role="alert">
        {{ missingCount ? `${missingCount} 个字未找到可用卡名。` : '' }}{{ failedCount ? `${failedCount} 张卡图加载失败。` : '' }}
        请逐字替换、换卡或重试，补全后即可下载。
      </p>
      <div class="canvas-container">
        <canvas ref="canvas" role="img" :aria-label="`由游戏王卡名切片拼接的句子：${sentence}`" @click="selectFromCanvas"></canvas>
      </div>

      <div class="character-list" aria-label="逐字选卡">
        <template v-for="(token, index) in tokens" :key="index">
          <span v-if="token.kind === 'break'" class="line-break"></span>
          <span v-else-if="token.kind === 'space'" class="space-marker" aria-label="空格"></span>
          <button v-else class="character-button"
            :class="{ selected: selectedIndex === index, substituted: token.candidate && token.candidate.character !== token.input, unresolved: token.kind === 'missing' || token.status === 'failed' }"
            :aria-pressed="selectedIndex === index"
            :aria-label="`第 ${index + 1} 字 ${token.input}${token.candidate ? `，选自 ${token.candidate.name}` : '，未匹配'}`"
            @click="selectToken(index)">
            {{ token.input }}<small v-if="token.candidate && token.candidate.character !== token.input">→ {{
              token.candidate.character }}</small>
          </button>
        </template>
      </div>

      <div v-if="selectedToken" class="character-detail">
        <div v-if="selectedImageUrl && selectedCrop" class="source-card">
          <img :src="selectedImageUrl" :alt="selectedToken.candidate.name">
          <div class="crop-highlight"
            :style="{ left: `${selectedCrop.x / CARD_WIDTH * 100}%`, width: `${selectedCrop.width / CARD_WIDTH * 100}%` }">
          </div>
        </div>
        <div class="detail-controls">
          <h2>第 {{ selectedIndex + 1 }} 字：{{ selectedToken.input }}</h2>
          <template v-if="selectedToken.candidate">
            <p>取字「{{ selectedToken.candidate.character }}」 · {{ selectedToken.candidate.frame }}</p>
            <p><a :href="`https://ygocdb.com/card/${selectedToken.candidate.id}`" target="_blank"
                rel="noopener noreferrer">{{ selectedToken.candidate.name }}</a>（{{ selectedToken.candidate.id }}）</p>
            <p v-if="selectedToken.matchMode === 'homophone'" class="substitution-note">原字未收录，已使用同声调的同音字。</p>
            <p v-else-if="selectedToken.matchMode === 'near'" class="substitution-note">原字未收录，已使用不同声调的近音字。</p>
            <p v-else-if="selectedToken.matchMode === 'manual'" class="substitution-note">使用你指定的替代字。</p>
            <button class="secondary-button small-button" :disabled="busy" @click="changeCard()">{{ selectedToken.status
              === 'failed' ? '换卡 / 重试' : '换一张卡' }}</button>
            <div class="crop-control">
              <label for="ygo-offset">左右微调：{{ selectedToken.offset }} px</label>
              <input id="ygo-offset" v-model.number="selectedToken.offset" type="range" min="-30" max="30" step="0.5"
                :disabled="busy">
            </div>
            <div class="crop-control">
              <label for="ygo-width">切片宽度：{{ Math.round(selectedToken.widthScale * 100) }}%</label>
              <input id="ygo-width" v-model.number="selectedToken.widthScale" type="range" min="0.6" max="1.4"
                step="0.02" :disabled="busy">
            </div>
          </template>
          <p v-else>没有找到这个字及可用的同音字，可以手动指定替代字。</p>
          <div class="replacement-row">
            <label for="ygo-replacement">替代字：</label>
            <input id="ygo-replacement" v-model="replacement" type="text" maxlength="2" class="replacement-input"
              :disabled="busy" placeholder="一个字" @keyup.enter="changeCard(true)">
            <button class="secondary-button small-button" :disabled="busy || !replacement.trim()"
              @click="changeCard(true)">应用</button>
          </div>
        </div>
      </div>
    </div>

    <div class="notice">
      <!-- <p>每张卡只截取一个字所在的竖条，卡片从顶到底完整保留；空格留白，换行分排。原字优先，同音字按句子和卡名中的读音匹配。</p>
      <p>卡名位置会根据卡图中的标题文字自动校准，特殊排版仍可逐字微调或换卡。卡图集合包含本次选用的完整卡图（按卡号去重）及逐字来源清单。</p> -->
      <p>卡图及卡片数据来源：
        <a href="https://ygocdb.com" target="_blank" rel="noopener noreferrer">百鸽</a>
      </p>
      <p>注意：数据更新有延迟。请查看
        <a href="https://github.com/WatanabeChika/Wana_tools/blob/main/README.md">README</a>
        获取最近更新时间。
      </p>
    </div>
  </section>
</template>

<style scoped>
.sentence-editor {
  width: 100%;
  color: var(--text);
  font-family: inherit;
  text-align: left;
}

.sentence-input {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 24px;
}

.sentence-input>label,
.setting-label {
  font-weight: 600;
}

.counter,
.data-status {
  color: var(--muted);
  font-size: 13px;
}

.counter.invalid {
  color: #b33a32;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #cbd2d9;
  border-radius: 4px;
  font: inherit;
  line-height: 1.6;
  resize: vertical;
  min-height: 96px;
}

.settings-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.settings-row label {
  cursor: pointer;
}

input[type='checkbox'] {
  margin: 0 5px 0 0;
  vertical-align: middle;
}

.number-input,
select,
.replacement-input {
  padding: 6px;
  border: 1px solid #cbd2d9;
  border-radius: 4px;
  font: inherit;
  background: var(--surface);
}

.number-input {
  width: 76px;
  margin-right: 12px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 28px 0 16px;
}

.small-button {
  padding: 6px 10px;
  font-size: 14px;
}

.error-message {
  color: #b33a32;
  font-size: 14px;
  line-height: 1.7;
}

.result {
  margin-top: 28px;
}

.frame-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.frame-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.frame-label.unused {
  opacity: 0.4;
}

.frame-swatch {
  width: 11px;
  height: 14px;
  border: 1px solid #aaa;
  border-radius: 2px;
}

.result-summary {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.canvas-container {
  width: 100%;
  overflow-x: auto;
  text-align: center;
  margin: 20px 0;
}

canvas {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
  vertical-align: middle;
  box-sizing: border-box;
}

.character-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin: 20px 0;
}

.character-button:hover:not(:disabled) {
  background: var(--surface-soft);
}

.character-button {
  color: var(--text);
  background: #fff;
  border: 1px solid #cbd2d9;
  min-width: 38px;
  padding: 8px 10px;
}

.character-button.selected {
  border-color: var(--accent);
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.character-button.substituted small {
  display: block;
  color: #9a6400;
  font-size: 11px;
  margin-top: 3px;
}

.character-button.unresolved {
  border-color: #b33a32;
  color: #b33a32;
}

.line-break {
  flex-basis: 100%;
  height: 0;
}

.space-marker {
  width: 16px;
}

.character-detail {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding: 20px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 4px;
}

.source-card {
  position: relative;
  width: 180px;
  flex: 0 0 180px;
  line-height: 0;
  overflow: hidden;
}

.source-card img {
  width: 100%;
  height: auto;
}

.crop-highlight {
  position: absolute;
  top: 0;
  bottom: 0;
  border: 1px solid var(--accent);
  background: #376ba226;
  box-sizing: border-box;
  pointer-events: none;
}

.detail-controls {
  flex: 1;
  min-width: 0;
}

h2 {
  font-size: 17px;
  margin: 0 0 12px;
}

.detail-controls p {
  font-size: 13px;
  line-height: 1.7;
  margin: 6px 0;
  overflow-wrap: anywhere;
}

.substitution-note {
  color: #9a6400;
}

.crop-control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 16px;
  font-size: 13px;
}

.crop-control label {
  min-width: 135px;
}

.crop-control input {
  width: 180px;
  max-width: 100%;
}

.replacement-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  font-size: 13px;
}

.replacement-input {
  width: 62px;
}

.notice {
  margin-top: 30px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.8;
}

a {
  color: var(--accent);
}

@media (max-width: 600px) {
  .intro {
    font-size: 14px;
  }

  .settings-row {
    gap: 12px 8px;
    font-size: 14px;
  }

  .settings-row>.setting-label:first-child {
    flex-basis: 100%;
  }

  .settings-row>label:not(.setting-label) {
    width: 100%;
  }

  .character-detail {
    padding: 12px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .source-card {
    width: 120px;
    flex-basis: 120px;
  }

  .detail-controls {
    flex-basis: 200px;
  }

  .button-row {
    gap: 12px;
  }
}
</style>
