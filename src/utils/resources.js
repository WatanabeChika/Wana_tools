// Shared promises deduplicate in-flight work and retain successful resources.
// Rejections are removed so a retry never reuses a failed request.
const resources = new Map();

export function assetUrl(path) {
  return /^(?:[a-z]+:|\/\/|\/)/i.test(path) ? path : `${import.meta.env.BASE_URL}${path}`;
}

function shared(key, loader) {
  if (!resources.has(key)) {
    const promise = loader().catch(error => {
      if (resources.get(key) === promise) resources.delete(key);
      throw error;
    });
    resources.set(key, promise);
  }
  return resources.get(key);
}

export async function fetchResource(url, { timeout = 90000, retries = 1, type = 'json', ...options } = {}) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error(`请求失败（HTTP ${response.status}）`);
      // Keep the timeout active while downloading the response body, too.
      return await response[type]();
    } catch (error) {
      if (attempt >= retries) {
        throw new Error(error.name === 'AbortError' ? '加载超时，请检查网络后重试' : error.message);
      }
    } finally {
      clearTimeout(timer);
    }
    await new Promise(resolve => setTimeout(resolve, 600));
  }
}

export function loadCards() {
  return shared('cards', async () => {
    const raw = await fetchResource(assetUrl('cards/cards.json'));
    const cards = Object.values(raw.default || raw);
    if (!cards.length || !cards.some(card => card?.id && card?.text)) throw new Error('卡库数据无效，请重新加载');
    return cards;
  });
}

export function loadCommonCards() {
  return shared('commonCards', async () => {
    const raw = await fetchResource(assetUrl('cards/common_cards.json'));
    const ids = raw.default || raw;
    if (!Array.isArray(ids)) throw new Error('常用卡数据无效');
    return new Set(ids.map(Number));
  });
}

const fontFiles = {
  KaiTi: '方正楷体_GBK.TTF',
  LIST: 'LISTFCEI.TTF',
  FFMC: 'FF Magda Clean Mono OT Regular.ttf',
};

export function loadFonts(...families) {
  return Promise.all(families.map(family => shared(`font:${family}`, async () => {
    const data = await fetchResource(assetUrl(`fonts/${fontFiles[family]}`), { type: 'arrayBuffer' });
    const face = await new FontFace(family, data).load();
    document.fonts.add(face);
    return face;
  })));
}

export async function mapLimit(items, mapper, limit = 6) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}
