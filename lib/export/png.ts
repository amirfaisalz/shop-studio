import { toSvg } from 'html-to-image';
import { createZip } from '@/lib/shopify/zip';
import type { ExportPage, ThemeFile } from '@/lib/shopify/types';
import { buildStandaloneHtml } from './document';
import { downloadBlob, loadTailwindCss, slugify, uniqueFileBases, waitForImages } from './shared';

/**
 * "Export to PNG" — rasterize every generated page to a full-page PNG. Each page
 * is rendered in an offscreen, same-origin iframe (Tailwind inlined so classes
 * resolve) and captured with html-to-image, which inlines the ImageKit images so
 * they appear in the output instead of blank spots. One page downloads directly;
 * multiple pages are bundled into a ZIP so the browser doesn't block a burst of
 * separate downloads.
 */

/** Render width for the desktop snapshot. */
const RENDER_WIDTH = 1440;
/** Per-page ceiling so a runaway-tall page can't exceed browser canvas limits. */
const MAX_HEIGHT = 14000;

export interface PngProgress {
  processed: number;
  total: number;
  label: string;
}

/** Safe base64 transparent 1x1 PNG data URL used when an image fails or is blocked by CORS. */
const SAFE_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAAtlasBTAAAAAElFTkSuQmCC';

/** Ensure all <svg> tags have xmlns so XMLSerializer outputs valid standalone SVG markup. */
function ensureSvgNamespaces(doc: Document): void {
  const svgs = Array.from(doc.querySelectorAll('svg'));
  for (const svg of svgs) {
    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
  }
}

/** Remove any invalid XML attribute names (e.g. Tailwind bracket syntax like stroke-[#C85A32]) from DOM elements. */
function cleanInvalidXmlAttributes(doc: Document): void {
  const allElements = Array.from(doc.querySelectorAll('*'));
  for (const el of allElements) {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      if (/[^a-zA-Z0-9_\-:]/.test(attr.name)) {
        console.warn(`[png-export] Cleaned invalid XML attribute "${attr.name}" on <${el.tagName.toLowerCase()}>`);
        el.removeAttribute(attr.name);
      }
    }
  }
}

/** Pre-inline external images as real base64 data URLs via fetch(CORS) so they render with full fidelity in the PNG. */
async function inlineImagesWithFetch(doc: Document): Promise<void> {
  const imgs = Array.from(doc.images);
  console.log(`[png-export] Inlining ${imgs.length} image(s) via CORS fetch...`);
  const tasks = imgs.map(async (img, idx) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      img.src = dataUrl;
      img.removeAttribute('srcset');
      img.removeAttribute('loading');
      console.log(`[png-export] Inlined image ${idx + 1}/${imgs.length} (${Math.round(dataUrl.length / 1024)} KB data URI)`);
    } catch (e) {
      console.warn(`[png-export] Failed to fetch image ${idx + 1} (${src.slice(0, 60)}), using fallback:`, e);
      img.src = SAFE_PLACEHOLDER;
      img.removeAttribute('srcset');
    }
  });
  await Promise.all(tasks);
}

/** Load SVG data URI into an HTMLImageElement without setting crossOrigin (which causes CORS errors on data: URIs in Chromium). */
function loadSvgImage(svgDataUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error('[png-export] SVG image element failed to load:', e);
      reject(new Error('Failed to rasterize SVG markup into Image element.'));
    };
    // Crucial: do NOT set crossOrigin on data: URIs!
    img.src = svgDataUri;
  });
}

/** Convert a Canvas to a PNG Blob asynchronously. */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Render a single page to a PNG Blob via an offscreen iframe. */
async function renderPageToPng(
  page: ExportPage,
  themeCss: string,
  tailwindCss: string,
  pageIndex: number,
  totalPages: number
): Promise<Blob> {
  const pageLabel = page.label || page.key;
  console.log(`[png-export] [Step 1/5] Starting render for page ${pageIndex + 1}/${totalPages}: "${pageLabel}"`);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    `position:fixed;left:0;top:0;width:${RENDER_WIDTH}px;height:800px;border:0;` +
    'opacity:0;pointer-events:none;z-index:-9999;';
  iframe.srcdoc = buildStandaloneHtml({
    title: pageLabel,
    bodyHtml: page.html,
    themeCss,
    tailwindInline: tailwindCss,
  });

  document.body.appendChild(iframe);
  try {
    console.log(`[png-export] [Step 2/5] Waiting for iframe document to load for "${pageLabel}"...`);
    await new Promise<void>((resolve, reject) => {
      iframe.addEventListener('load', () => resolve(), { once: true });
      iframe.addEventListener('error', () => reject(new Error('Failed to render page iframe.')), {
        once: true,
      });
    });

    const doc = iframe.contentDocument;
    if (!doc || !doc.body) throw new Error('Could not access the rendered page document.');

    console.log(`[png-export] [Step 3/5] Inlining images & sanitizing XML attributes for "${pageLabel}"...`);
    await inlineImagesWithFetch(doc);
    cleanInvalidXmlAttributes(doc);
    ensureSvgNamespaces(doc);
    await waitForImages(doc);

    // Initial height measurement
    const initialHeight = Math.min(
      MAX_HEIGHT,
      Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 800)
    );
    iframe.style.height = `${initialHeight}px`;

    // Let layout settle after resize (reflow of intrinsic sizes).
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // Final height after reflow
    const height = Math.min(
      MAX_HEIGHT,
      Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, initialHeight)
    );
    iframe.style.height = `${height}px`;

    console.log(`[png-export] [Step 4/5] Rasterizing page "${pageLabel}" (${RENDER_WIDTH}x${height}px)...`);

    const svgDataUri = await toSvg(doc.body, {
      width: RENDER_WIDTH,
      height,
      backgroundColor: '#ffffff',
      skipFonts: true,
      imagePlaceholder: SAFE_PLACEHOLDER,
    });
    console.log(`[png-export] Generated SVG data URI for "${pageLabel}" (size: ${Math.round(svgDataUri.length / 1024)} KB)`);

    const img = await loadSvgImage(svgDataUri);
    const canvas = document.createElement('canvas');
    canvas.width = RENDER_WIDTH;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create 2D canvas context.');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas);
    if (!blob || blob.size === 0) {
      throw new Error(`Failed to generate screenshot for page "${pageLabel}".`);
    }

    console.log(`[png-export] [Step 5/5] Screenshot captured successfully for "${pageLabel}" (${Math.round(blob.size / 1024)} KB)`);
    return blob;
  } finally {
    iframe.remove();
  }
}

export async function exportPagesAsPng(
  pages: ExportPage[],
  themeCss: string,
  projectName: string,
  onProgress?: (p: PngProgress) => void
): Promise<void> {
  console.log(`[png-export] Starting export for ${pages.length} page(s)...`);
  const ready = pages.filter((p) => p.html && p.html.trim());
  if (ready.length === 0) {
    throw new Error('There are no generated pages to export yet. Generate a page first.');
  }

  console.log('[png-export] Loading vendored Tailwind stylesheet...');
  const tailwindCss = await loadTailwindCss();
  console.log(`[png-export] Loaded Tailwind stylesheet (${Math.round(tailwindCss.length / 1024)} KB)`);

  const bases = uniqueFileBases(ready);
  const project = slugify(projectName || 'storefront');

  const rendered: { base: string; blob: Blob }[] = [];
  for (let i = 0; i < ready.length; i++) {
    const page = ready[i];
    onProgress?.({ processed: i, total: ready.length, label: page.label });
    const blob = await renderPageToPng(page, themeCss, tailwindCss, i, ready.length);
    rendered.push({ base: bases.get(page.key) || slugify(page.key || `page-${i + 1}`), blob });
  }
  onProgress?.({ processed: ready.length, total: ready.length, label: '' });

  // Single page → download the PNG directly; multiple → bundle into one ZIP.
  if (rendered.length === 1) {
    console.log(`[png-export] Single page export: downloading "${project}-${rendered[0].base}.png"...`);
    downloadBlob(rendered[0].blob, `${project}-${rendered[0].base}.png`);
    return;
  }

  console.log(`[png-export] Packaging ${rendered.length} pages into ZIP archive: "${project}-png.zip"...`);
  const files: ThemeFile[] = [];
  for (const { base, blob } of rendered) {
    files.push({ path: `${base}.png`, contents: new Uint8Array(await blob.arrayBuffer()) });
  }
  const zipBytes = createZip(files);
  const zip = new Blob([zipBytes.slice().buffer as ArrayBuffer], { type: 'application/zip' });
  downloadBlob(zip, `${project}-png.zip`);
  console.log(`[png-export] ZIP download triggered successfully (${Math.round(zip.size / 1024)} KB)!`);
}



