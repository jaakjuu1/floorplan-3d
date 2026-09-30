import * as pdfjs from 'pdfjs-dist';
import type { RenderTask } from 'pdfjs-dist';
import type { AttachmentPage, AttachmentSource } from './background';
import { MAX_ATTACHMENT_BYTES, MAX_IMAGE_PIXELS, MAX_PDF_PAGES, MAX_RENDER_PIXELS } from './background';

// Vite packages this worker locally; tests resolve the same file from node_modules.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

type RenderedAttachment = { page: AttachmentPage; dataUrl: string };
const fail = (message: string): never => { throw new Error(message); };
const dimensionsError = 'Kuvan koko ylittää sallitun purkurajan';

/** Also bound the long edge: a very narrow page must not evade the pixel budget. */
export function renderDimensions(width: number, height: number, maxPixels: number) {
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width * height)) fail('Sivun koko on virheellinen');
  const edge = Math.max(width, height);
  const scale = Math.min(1, Math.sqrt(maxPixels / (width * height)), 8192 / edge, maxPixels / edge);
  return { scale, width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function bytesFromBase64(value: string): Uint8Array {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch { return fail('Liitteen tallennettu sisältö on virheellinen'); }
}

async function digest(bytes: Uint8Array): Promise<string> {
  const owned = Uint8Array.from(bytes);
  const hash = await crypto.subtle.digest('SHA-256', owned.buffer as ArrayBuffer);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function sniff(bytes: Uint8Array): AttachmentSource['mime'] {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-') return 'application/pdf';
  return fail('Tiedosto ei ole tuettu PDF-, PNG- tai JPEG-pohjakuva');
}

function jpegSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) { offset++; continue; }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 2 > bytes.length) break;
    const length = view.getUint16(offset, false);
    if (length < 2 || offset + length > bytes.length) break;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      if (length < 7) break;
      return { height: view.getUint16(offset + 3, false), width: view.getUint16(offset + 5, false) };
    }
    offset += length;
  }
  return fail('JPEG-tiedosto on vioittunut tai sen mittoja ei voi lukea');
}

function pngSize(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 24 || new TextDecoder().decode(bytes.subarray(12, 16)) !== 'IHDR') return fail('PNG-tiedosto on vioittunut');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
}

function checkImageSize(bytes: Uint8Array, mime: AttachmentSource['mime']): void {
  const { width, height } = mime === 'image/png' ? pngSize(bytes) : jpegSize(bytes);
  if (!width || !height || width * height > MAX_IMAGE_PIXELS) fail(dimensionsError);
}

function imageMime(file: File, actual: AttachmentSource['mime']): void {
  if (file.type && file.type !== actual && !(actual === 'image/jpeg' && file.type === 'image/jpg'))
    fail('Tiedoston sisältö ei vastaa tiedostotyyppiä');
}

export async function readAttachment(file: File): Promise<AttachmentSource> {
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) fail('Tiedoston on oltava enintään 2 MiB');
  let buffer: ArrayBuffer;
  try { buffer = await file.arrayBuffer(); } catch { return fail('Tiedoston luku epäonnistui'); }
  const bytes = new Uint8Array(buffer);
  if (bytes.length !== file.size) fail('Tiedoston luku epäonnistui');
  const mime = sniff(bytes);
  imageMime(file, mime);
  if (mime !== 'application/pdf') checkImageSize(bytes, mime);
  return { id: await digest(bytes), name: file.name, mime, size: bytes.length, data: base64(bytes) };
}

function validateSource(source: AttachmentSource, bytes: Uint8Array, mime: AttachmentSource['mime']): void {
  if (!source || !/^[0-9a-f]{64}$/.test(source.id) || source.mime !== mime || source.size !== bytes.length ||
      !source.name || typeof source.name !== 'string') fail('Liitteen tallennustiedot ovat virheelliset');
}

async function decodeImage(bytes: Uint8Array, mime: AttachmentSource['mime']): Promise<{ bitmap: ImageBitmap; page: AttachmentPage }> {
  if (!('createImageBitmap' in globalThis)) fail('Selain ei tue pohjakuvan avaamista');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(new Blob([Uint8Array.from(bytes).buffer as ArrayBuffer], { type: mime }), { imageOrientation: 'from-image' }); }
  catch { return fail('Kuvatiedosto on vioittunut tai sitä ei voitu avata'); }
  if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) { bitmap.close(); return fail(dimensionsError); }
  return { bitmap, page: { number: 1, count: 1, width: bitmap.width, height: bitmap.height, rotation: 0 } };
}

export async function renderAttachment(source: AttachmentSource, pageNumber = 1,
  maxPixels = MAX_RENDER_PIXELS, signal?: AbortSignal): Promise<RenderedAttachment> {
  const checkCancelled = (): void => { if (signal?.aborted) throw new DOMException('Lataus peruttiin', 'AbortError'); };
  checkCancelled();
  if (!Number.isInteger(maxPixels) || maxPixels < 1 || maxPixels > MAX_RENDER_PIXELS) fail('Virheellinen renderöinnin pikseliraja');
  if (!Number.isInteger(pageNumber) || pageNumber < 1) fail('PDF-sivun numero on virheellinen');
  if (!source || !Number.isInteger(source.size) || source.size < 1 || source.size > MAX_ATTACHMENT_BYTES ||
      typeof source.data !== 'string' || source.data.length > Math.ceil(source.size / 3) * 4)
    fail('Liitteen koko ylittää sallitun 2 MiB rajan');
  const bytes = bytesFromBase64(source.data);
  const mime = sniff(bytes);
  validateSource(source, bytes, mime);
  if (await digest(bytes) !== source.id) fail('Liitteen tarkistussumma ei täsmää');
  checkCancelled();
  if (mime !== 'application/pdf') {
    checkImageSize(bytes, mime);
    if (pageNumber !== 1) fail('Kuvatiedostossa on vain yksi sivu');
    const { bitmap, page } = await decodeImage(bytes, mime);
    try {
      checkCancelled();
      const dimensions = renderDimensions(page.width, page.height, maxPixels);
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width; canvas.height = dimensions.height;
      const context = canvas.getContext('2d');
      if (!context) return fail('Pohjakuvan esikatselua ei voitu muodostaa');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return { page, dataUrl: canvas.toDataURL('image/png') };
    } finally { bitmap.close(); }
  }

  let task: ReturnType<typeof pdfjs.getDocument> | undefined;
  let renderTask: RenderTask | undefined;
  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']> | undefined;
  let worker: Worker | undefined, pdfWorker: InstanceType<typeof pdfjs.PDFWorker> | undefined, workerError: Error | undefined;
  let rejectFailure!: (error: Error) => void;
  const failure = new Promise<never>((_, reject) => { rejectFailure = reject; });
  const cancel = (): void => { rejectFailure(new Error('Lataus peruttiin')); renderTask?.cancel(); void task?.destroy(); };
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    if (typeof Worker !== 'undefined') {
      worker = new Worker(pdfjs.GlobalWorkerOptions.workerSrc, { type: 'module' });
      const workerFailed = (event: Event) => { event.preventDefault(); rejectFailure(new Error('PDF-workerin lataus tai viestintä epäonnistui')); };
      worker.addEventListener('error', workerFailed);
      worker.addEventListener('messageerror', workerFailed);
      // PDF.js 4.10 can resolve render() before rejecting an operator-stream error.
      // Observe the pinned worker protocol before PDF.js handles it; regression covers ERROR=5.
      worker.addEventListener('message', event => {
        if (event.data?.stream === 5 && event.data.reason) workerError = new Error(event.data.reason.message || 'PDF-renderöinti epäonnistui');
      });
      pdfWorker = pdfjs.PDFWorker.fromPort({ port: worker });
    }
    task = pdfjs.getDocument({ data: bytes, isEvalSupported: false, maxImageSize: MAX_IMAGE_PIXELS, stopAtErrors: true,
      useSystemFonts: false, useWorkerFetch: false, worker: pdfWorker });
    pdf = await Promise.race([task.promise, failure]);
    checkCancelled();
    if (pdf.numPages > MAX_PDF_PAGES) fail('PDF-tiedostossa saa olla enintään 100 sivua');
    if (pageNumber > pdf.numPages) fail('Valittua PDF-sivua ei ole');
    const pdfPage = await Promise.race([pdf.getPage(pageNumber), failure]);
    checkCancelled();
    const viewport = pdfPage.getViewport({ scale: 1 });
    if (!Number.isFinite(viewport.width * viewport.height) || viewport.width * viewport.height > 500_000_000)
      fail('PDF-sivun mitat ylittävät sallitun rajan');
    const dimensions = renderDimensions(viewport.width, viewport.height, maxPixels);
    const renderViewport = pdfPage.getViewport({ scale: dimensions.scale });
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width; canvas.height = dimensions.height;
    const context = canvas.getContext('2d');
    if (!context) return fail('PDF-esikatselua ei voitu muodostaa');
    renderTask = pdfPage.render({ canvasContext: context, viewport: renderViewport });
    await Promise.race([renderTask.promise, failure]);
    if (workerError) throw workerError;
    checkCancelled();
    return { page: { number: pageNumber, count: pdf.numPages, width: viewport.width, height: viewport.height,
      rotation: ((pdfPage.rotate % 360) + 360) % 360 }, dataUrl: canvas.toDataURL('image/png') };
  } catch (error) {
    if (signal?.aborted) return fail('Lataus peruttiin');
    if (error instanceof Error && /password|encrypted/i.test(error.name + error.message)) return fail('Salattua PDF-tiedostoa ei voi avata');
    if (error instanceof Error && /Image exceeded maximum allowed size/i.test(error.message)) return fail('PDF:n kuvan koko ylittää 20 miljoonan pikselin rajan');
    if (error instanceof Error && error.message.startsWith('PDF-')) throw error;
    return fail('PDF-tiedosto on vioittunut tai sitä ei voitu renderöidä');
  } finally { signal?.removeEventListener('abort', cancel); try { await task?.destroy(); } finally { pdfWorker?.destroy(); worker?.terminate(); } }
}
