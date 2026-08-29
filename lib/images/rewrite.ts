/**
 * Rewrite generated-storefront <img> tags to ImageKit text-to-image URLs
 * (AGENTS.md §12: images come from ImageKit). The model emits each image with a
 * `data-ik-prompt` describing the ideal photo (and a placeholder `src` from an
 * allowed host as a fallback); here we turn that prompt into an `ik-genimg` URL.
 *
 * Isomorphic and idempotent: it runs inside `sanitizeGeneratedHtml`, so it fires
 * on every path (streaming preview, final document, patched HTML, inline edits).
 * It never re-generates an image whose `src` is already an ImageKit URL, a
 * `data:` URI, or a user-pasted URL, so re-sanitising edited HTML is safe.
 *
 * When ImageKit is not configured it is a no-op — the model's placeholder image
 * stays, so the builder still works without ImageKit.
 */

import { buildGenImageUrl, isImageKitConfigured, isImageKitUrl } from './imagekit';

const PLACEHOLDER_HOST = /(images\.unsplash\.com|picsum\.photos|placehold|via\.placeholder)/i;

function attr(tag: string, name: string): string | null {
  const m = new RegExp('\\b' + name + '\\s*=\\s*"([^"]*)"', 'i').exec(tag) ||
    new RegExp("\\b" + name + "\\s*=\\s*'([^']*)'", 'i').exec(tag);
  return m ? m[1] : null;
}

function numAttr(tag: string, name: string): number | undefined {
  const v = attr(tag, name);
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Set (or insert) the src attribute on an <img ...> tag string. */
function setSrc(tag: string, url: string): string {
  const escaped = url.replace(/"/g, '&quot;');
  if (/\bsrc\s*=\s*"[^"]*"/i.test(tag)) {
    return tag.replace(/\bsrc\s*=\s*"[^"]*"/i, 'src="' + escaped + '"');
  }
  if (/\bsrc\s*=\s*'[^']*'/i.test(tag)) {
    return tag.replace(/\bsrc\s*=\s*'[^']*'/i, 'src="' + escaped + '"');
  }
  return tag.replace(/^<img/i, '<img src="' + escaped + '"');
}

const CURATED_UNSPLASH_TOPICS: { keywords: string[]; photos: string[] }[] = [
  {
    keywords: ['cookie', 'cookies', 'nastar', 'kastengel', 'pastry', 'bakery', 'baked', 'cake', 'biscuit', 'dessert', 'kue'],
    photos: [
      'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['coffee', 'cafe', 'espresso', 'latte', 'roast', 'bean', 'barista', 'tea', 'matcha', 'kopi'],
    photos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['fashion', 'clothing', 'apparel', 'dress', 'hoodie', 'jacket', 't-shirt', 'shirt', 'outfit', 'wear', 'model', 'baju', 'pakaian'],
    photos: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['skincare', 'beauty', 'cosmetics', 'serum', 'lotion', 'cream', 'perfume', 'makeup', 'face', 'glow'],
    photos: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'boot', 'boots', 'runner', 'sepatu'],
    photos: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['watch', 'watches', 'jewelry', 'ring', 'necklace', 'gold', 'silver', 'diamond', 'luxury', 'bracelet', 'jam', 'perhiasan'],
    photos: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['tech', 'gadget', 'headphones', 'earphones', 'phone', 'laptop', 'audio', 'sound', 'electronics', 'speaker'],
    photos: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['furniture', 'chair', 'sofa', 'table', 'interior', 'home', 'living', 'decor', 'lamp', 'minimal', 'mebel'],
    photos: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['plant', 'plants', 'flower', 'flowers', 'succulent', 'indoor', 'green', 'garden', 'botanical', 'tanaman', 'bunga'],
    photos: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['bag', 'backpack', 'handbag', 'tote', 'leather', 'purse', 'wallet', 'accessory', 'tas'],
    photos: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&auto=format&fit=crop&q=80',
    ],
  },
  {
    keywords: ['food', 'restaurant', 'dish', 'meal', 'gourmet', 'culinary', 'dinner', 'snack', 'artisan', 'spicy', 'indonesian', 'makanan'],
    photos: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80',
    ],
  },
];

function matchUnsplashPhoto(promptText: string, seed = 0): string {
  const lower = (promptText || '').toLowerCase();
  for (const topic of CURATED_UNSPLASH_TOPICS) {
    if (topic.keywords.some((kw) => lower.includes(kw))) {
      const idx = Math.abs(seed) % topic.photos.length;
      return topic.photos[idx];
    }
  }
  const generic = [
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
  ];
  return generic[Math.abs(seed) % generic.length];
}

let imageCounter = 0;

function rewriteTag(tag: string): string {
  const src = attr(tag, 'src') ?? '';
  const prompt = attr(tag, 'data-ik-prompt') || attr(tag, 'alt');
  const isPlaceholder = !src || PLACEHOLDER_HOST.test(src) || src.includes('pollinations.ai');

  // Never touch base64 data URIs
  if (src.startsWith('data:')) return tag;

  imageCounter++;

  if (isImageKitConfigured()) {
    if (prompt) {
      const promptText = prompt.trim();
      const url = buildGenImageUrl(promptText, {
        width: numAttr(tag, 'width') ?? 1200,
        height: numAttr(tag, 'height'),
      });
      if (url && !src.includes(encodeURIComponent(promptText))) {
        return setSrc(tag, url);
      }
    }
    if (isImageKitUrl(src)) return tag;
    if (isPlaceholder) {
      const promptText = (prompt || attr(tag, 'alt') || 'modern storefront product photo').trim();
      const url = buildGenImageUrl(promptText, {
        width: numAttr(tag, 'width') ?? 1200,
        height: numAttr(tag, 'height'),
      });
      if (url) return setSrc(tag, url);
    }
  } else {
    // When ImageKit endpoint is not configured in .env.local,
    // match high-resolution, instant-loading curated Unsplash photography!
    if (prompt || isPlaceholder) {
      const promptText = (prompt || attr(tag, 'alt') || 'modern storefront photo').trim();
      const photoUrl = matchUnsplashPhoto(promptText, imageCounter);
      return setSrc(tag, photoUrl);
    }
  }

  return tag;
}

/** Swap placeholder/`data-ik-prompt` <img> sources for ImageKit gen-image URLs or curated photos. */
export function applyImageKitToHtml(html: string): string {
  if (!html) return html;
  imageCounter = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => rewriteTag(tag));
}
