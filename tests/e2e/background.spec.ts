import { expect, test, type Locator } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const fixture = (name: string) => join(process.cwd(), 'fixtures/background', name);
const screenshots = join(process.cwd(), 'docs/kodin-muutostyokuva/screenshots');

test('source drawing import, page preview, calibration and persistence work with touch and mouse', async ({ page }, info) => {
  const phone = info.project.name === 'phone', errors: string[] = [], remote: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) remote.push(request.url()); });
  const activate = (locator: Locator) => phone ? locator.tap() : locator.click();
  const saved = async () => JSON.parse((await page.evaluate(() => localStorage.getItem('kodin-design-v2')))!);
  const pane = async (open: boolean) => {
    if (phone && await page.locator('aside.right').evaluate(el => el.classList.contains('open')) !== open) await activate(page.locator('#tgPanel'));
    if(phone&&!open) await expect.poll(async()=>page.evaluate(()=>{
      const aside=document.querySelector('aside.right')!;
      return new DOMMatrix(getComputedStyle(aside).transform).m41 / aside.getBoundingClientRect().width;
    })).toBeCloseTo(1.1,3);
  };
  const importDrawing = async (name: string) => {
    await pane(true);
    const chosen = page.waitForEvent('filechooser');
    await activate(page.locator('#backgroundImport'));
    await (await chosen).setFiles(fixture(name));
    await expect(page.locator('#backgroundPicker')).toBeVisible();
    await expect(page.locator('#backgroundConfirm')).toBeEnabled();
    await expect(page.locator('#backgroundPreview img')).toBeVisible();
  };
  const usePreview = async () => {
    await activate(page.locator('#backgroundConfirm'));
    await expect(page.locator('#backgroundPicker')).not.toBeVisible();
    await expect(page.locator('#gBackground image')).toHaveCount(1);
  };
  const point = async (x: number, y: number) => page.locator('#gBackground image').evaluate((el, p) => {
    const matrix=(el as SVGGraphicsElement).getScreenCTM()!;
    const result=new DOMPoint(p.x,p.y).matrixTransform(matrix);
    return {x:result.x,y:result.y};
  }, {x,y});
  const pick = async (x: number, y: number) => {
    const position=await point(x,y);
    expect(position.x).toBeGreaterThanOrEqual(0);
    if (phone) await page.touchscreen.tap(position.x,position.y);
    else await page.mouse.click(position.x,position.y);
    // Separate native taps by a rendered frame; back-to-back CDP events can be coalesced.
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));
  };
  const shot = async (name: string) => {
    if (!phone) return;
    await mkdir(screenshots,{recursive:true});
    await page.screenshot({path:join(screenshots,`v11-phone-${name}.png`)});
  };

  await page.goto('/');
  await expect(page.locator('#gWalls polygon').first()).toBeVisible();
  // First drawing import creates the initial persisted plan; canonical data is read only.
  const initialUnit=await page.evaluate(() => (window as any).UnitModel.demoUnit);
  await importDrawing('vector-two-page.pdf');
  await page.locator('#backgroundPage').selectOption('2');
  await expect(page.locator('#backgroundConfirm')).toBeEnabled();
  await expect(page.locator('#backgroundPreview img')).toHaveAttribute('alt',/2/);
  await shot('pdf-preview');
  await usePreview();
  expect((await saved()).background.page).toEqual({number:2,count:2,width:200,height:100,rotation:90});
  expect(Buffer.from((await saved()).background.source.data,'base64')).toEqual(await readFile(fixture('vector-two-page.pdf')));
  expect((await saved()).background.calibration).toBeNull();
  await activate(page.locator('#backgroundLock'));
  await page.locator('#backgroundDistance').fill('2000');
  await activate(page.locator('[data-action="calibrate"]'));
  await pane(false);
  await pick(20,30); await pick(60,30);
  await expect.poll(async () => (await saved()).background.calibration?.value_mm).toBe(2000);
  const calibrated=(await saved()).background;
  expect(calibrated.transform.mmPerUnit).toBeCloseTo(50,3);
  expect(calibrated.calibration.status).toBe('inferred');
  expect(calibrated.calibration.method).toBe('archive_drawing');
  expect(calibrated.calibration.source_refs).toEqual([`attachment:${calibrated.source.id}/page:2`]);
  await shot('calibrated');

  // An actual pointer gesture moves only the drawing and remains undoable.
  await pane(true); await activate(page.locator('[data-action="move"]')); await pane(false);
  const start=await point(120,60), finish={x:start.x+25,y:start.y+20};
  if(phone){
    const touch=await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...finish,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touch.detach();
  }else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(finish.x,finish.y);await page.mouse.up();}
  expect((await saved()).background.transform.x).not.toBe(calibrated.transform.x);
  expect((await saved()).background.calibration).toEqual(calibrated.calibration);
  await activate(page.locator('#undo')); await expect.poll(async()=>(await saved()).background).toEqual(calibrated);

  await pane(true);await activate(page.locator('[data-action="move"]'));await pane(true);
  await activate(page.locator('#backgroundLock'));
  await expect(page.locator('#backgroundMode')).not.toBeVisible();
  await activate(page.locator('#backgroundLock'));
  await pane(true);
  await page.locator('[data-field="x"]').fill('500'); await page.locator('[data-field="x"]').press('Tab');
  await page.locator('[data-field="y"]').fill('-400'); await page.locator('[data-field="y"]').press('Tab');
  await page.locator('[data-field="rotation"]').fill('15'); await page.locator('[data-field="rotation"]').press('Tab');
  const opacity=page.locator('[data-field="opacity"]');
  await activate(opacity); await opacity.press('Home');
  for(let i=0;i<6;i++) await opacity.press('ArrowRight');
  await opacity.press('Tab');
  await activate(page.locator('#backgroundLock'));
  const aligned=(await saved()).background;
  expect(aligned.locked).toBe(true); expect(aligned.opacity).toBe(.4);
  expect(aligned.transform).toMatchObject({x:500,y:-400,rotation:15});
  await pane(false); await activate(page.locator('#zoomIn'));
  await page.setViewportSize({width:phone?390:1280,height:phone?844:800});
  expect((await saved()).background).toEqual(aligned);

  // A saved PDF page can be changed without uploading the original again.
  await pane(true); await activate(page.locator('#backgroundPageChange'));
  await page.locator('#backgroundPage').selectOption('1');
  await expect(page.locator('#backgroundPreview img')).toHaveAttribute('alt',/1/);
  await usePreview(); expect((await saved()).background.calibration).toBeNull();
  expect((await saved()).background.page.number).toBe(1);
  await activate(page.locator('#undo')); expect((await saved()).background).toEqual(aligned);
  await pane(false);
  await shot('aligned');
  // Render resolution varies; source coordinate dimensions and calibration stay fixed.
  const resolutions=await page.evaluate(async () => {
    const bg=JSON.parse(localStorage.getItem('kodin-design-v2')!).background;
    const low=await (window as any).AttachmentIO.renderAttachment(bg.source,bg.page.number,5000);
    const high=await (window as any).AttachmentIO.renderAttachment(bg.source,bg.page.number,4000000);
    return {low:low.page,high:high.page};
  });
  expect(resolutions.low).toEqual(resolutions.high);

  await activate(page.locator('details.menu summary'));
  const downloading=page.waitForEvent('download'); await activate(page.locator('#exportJson'));
  const downloaded=await downloading, exportedPath=join(info.outputDir,'with-source.json');
  await downloaded.saveAs(exportedPath); const exported=await readFile(exportedPath);
  const snapshot=await saved(); expect(snapshot.unit).toEqual(initialUnit);
  await page.reload(); await expect(page.locator('#gBackground image')).toHaveCount(1);
  expect((await saved()).background).toEqual(aligned);

  await pane(false); await activate(page.locator('[data-view="3d"]'));
  await expect(page.locator('#view3d canvas')).toBeVisible({timeout:60_000});
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  expect((await saved()).background).toEqual(aligned);
  await activate(page.locator('[data-view="2d"]'));
  await expect(page.locator('body')).not.toHaveClass(/busy/);
  await expect(page.locator('#gBackground image')).toHaveCount(1);
  await page.locator('#fileIn').setInputFiles({name:'with-source.json',mimeType:'application/json',buffer:exported});
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  expect((await saved()).background).toEqual(aligned);

  // Replacing a source clears the old calibration; history retains original bytes.
  await importDrawing('photo-orientation-6.jpg'); await usePreview();
  expect((await saved()).background.calibration).toBeNull();

  const oriented=(await saved()).background.page;
  expect(oriented.width).toBe(2); expect(oriented.height).toBe(3);
  await activate(page.locator('#undo')); expect((await saved()).background).toEqual(aligned);
  await activate(page.locator('#redo')); expect((await saved()).background.calibration).toBeNull();
  await importDrawing('tiny.png'); await usePreview();
  expect((await saved()).background.source.mime).toBe('image/png');
  await importDrawing('scanned-one-page.pdf'); await usePreview();
  expect((await saved()).background.page.count).toBe(1);
  await importDrawing('vector-one-page.pdf'); await usePreview();
  expect((await saved()).background.page.count).toBe(1);
  await importDrawing('vector-two-page.pdf'); await usePreview();
  expect((await saved()).background.page.number).toBe(1);
  expect((await saved()).background.calibration).toBeNull();

  // Known synthetic raster: tick centres (50,200) and (550,200) are 500 pixels apart.
  await importDrawing('calibration-600x400.png'); await usePreview();
  await pane(false); await activate(page.locator('#fit')); await pane(true);
  const rasterBefore=(await saved()).background;
  await activate(page.locator('#backgroundLock'));
  if(phone){
    await activate(page.locator('[data-action="move"]'));await pane(false);
    const before=(await saved()).background, first=await point(200,200), second=await point(400,200);
    const touch=await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...first,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:first.x+20,y:first.y,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:first.x+20,y:first.y,id:1},{...second,id:2}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:first.x+35,y:first.y,id:1},{...second,id:2}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{...second,id:2}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touch.detach();
    expect((await saved()).background.transform.x-before.transform.x).toBeCloseTo(35/(second.x-first.x)*200*before.transform.mmPerUnit,1);
    await activate(page.locator('#backgroundMode button'));await activate(page.locator('#undo'));
    await expect.poll(async()=>(await saved()).background).toEqual(before);await pane(true);
  }
  await page.locator('#backgroundDistance').fill('0');
  await activate(page.locator('[data-action="calibrate"]')); await pane(false);
  if(phone){
    const p=await point(50,200),touch=await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});
    await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await touch.detach();
    await expect(page.locator('#backgroundMode')).toContainText('Ele peruttiin');
    expect((await saved()).background.calibration).toBeNull();
  }
  await pick(50,200); await pick(550,200);
  await expect(page.locator('#backgroundMode')).toContainText(/positiivinen|virheelliset/);
  expect((await saved()).background.calibration).toBeNull();
  await activate(page.locator('#backgroundMode button'));
  await pane(true); await page.locator('#backgroundDistance').fill('4000');
  await activate(page.locator('[data-action="calibrate"]')); await pane(false);
  await pick(50,200); await pick(550,200);
  await expect.poll(async()=> (await saved()).background.calibration?.value_mm).toBe(4000);
  expect((await saved()).background.transform.mmPerUnit).toBeCloseTo(8,3);
  expect((await saved()).background.source).toEqual(rasterBefore.source);
  await shot('raster-calibration');
  await pane(true);

  // Hold an earlier render until a newer user selection is already active.
  await page.evaluate(()=>{
    const io=(window as any).AttachmentIO;
    (window as any).__slowNext=true;
    (window as any).AttachmentIO={...io,renderAttachment:async(...args:any[])=>{
      if((window as any).__slowNext){
        (window as any).__slowNext=false;(window as any).__slowSettled=false;
        await new Promise<void>(resolve=>{(window as any).__releaseSlow=resolve;});
        try{return await io.renderAttachment(...args);}finally{(window as any).__slowSettled=true;}
      }
      return io.renderAttachment(...args);
    }};
  });
  const slowChosen=page.waitForEvent('filechooser');await activate(page.locator('#backgroundImport'));
  await (await slowChosen).setFiles(fixture('photo.jpg'));
  await expect.poll(()=>page.evaluate(()=>typeof (window as any).__releaseSlow)).toBe('function');
  await activate(page.locator('#backgroundCancel'));
  await importDrawing('tiny.png');await usePreview();
  await page.evaluate(()=>(window as any).__releaseSlow());
  await expect.poll(()=>page.evaluate(()=>(window as any).__slowSettled)).toBe(true);
  expect((await saved()).background.source.name).toBe('tiny.png');

  // The same race guard also covers asynchronous JSON-plan attachment validation.
  await page.evaluate(()=>{(window as any).__slowNext=true;(window as any).__releaseSlow=null;});
  await page.locator('#fileIn').setInputFiles({name:'older.json',mimeType:'application/json',buffer:exported});
  await expect.poll(()=>page.evaluate(()=>typeof (window as any).__releaseSlow)).toBe('function');
  const latest=await saved();
  await page.locator('#fileIn').setInputFiles({name:'newer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(latest))});
  await expect(page.locator('#toast')).toContainText('Suunnitelma tuotu');
  await page.evaluate(()=>(window as any).__releaseSlow());
  await expect.poll(()=>page.evaluate(()=>(window as any).__slowSettled)).toBe(true);
  expect(await saved()).toEqual(latest);

  const beforeBad=await saved();
  await page.route('**/pdf.worker*.mjs',route=>route.abort());
  const blockedWorker=page.waitForEvent('filechooser');await activate(page.locator('#backgroundImport'));
  await (await blockedWorker).setFiles(fixture('vector-one-page.pdf'));
  await expect(page.locator('#backgroundStatus')).toContainText('PDF-workerin lataus');
  await expect(page.locator('#backgroundConfirm')).toBeDisabled();
  await activate(page.locator('#backgroundCancel'));expect(await saved()).toEqual(beforeBad);
  await page.unroute('**/pdf.worker*.mjs');
  for (const [bad,message] of [['broken.pdf','vioittunut'],['encrypted.pdf','Salattua'],['scanned-oversized-image.pdf','20 miljoonan']] as const) {
    const chosen=page.waitForEvent('filechooser'); await activate(page.locator('#backgroundImport'));
    await (await chosen).setFiles(fixture(bad));
    await expect(page.locator('#backgroundStatus')).toContainText(message);
    await expect(page.locator('#backgroundConfirm')).toBeDisabled();
    await activate(page.locator('#backgroundCancel')); expect(await saved()).toEqual(beforeBad);
  }
  const oversized=page.waitForEvent('filechooser');await activate(page.locator('#backgroundImport'));
  await (await oversized).setFiles({name:'oversized.pdf',mimeType:'application/pdf',buffer:Buffer.alloc(2*1024*1024+1)});
  await expect(page.locator('#backgroundStatus')).toContainText('2 MiB');
  await expect(page.locator('#backgroundConfirm')).toBeDisabled();await activate(page.locator('#backgroundCancel'));
  expect(await saved()).toEqual(beforeBad);
  const tampered=structuredClone(beforeBad); tampered.background.source.data=Buffer.from('%PDF-1.4\ninvalid').toString('base64'); tampered.background.source.size=Buffer.from(tampered.background.source.data,'base64').length;
  await page.locator('#fileIn').setInputFiles({name:'tampered.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(tampered))});
  await expect(page.locator('#toast')).toContainText('Virheellinen'); expect(await saved()).toEqual(beforeBad);
  // Inject only a storage fault, then exercise actual UI; no plan state is set by the test.
  await page.evaluate(() => { (window as any).__originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new DOMException('test quota','QuotaExceededError');}; });
  await activate(page.locator('#backgroundRemove'));
  await expect(page.locator('#toast')).toContainText('Tallennus epäonnistui');
  expect(await saved()).toEqual(beforeBad); await expect(page.locator('#gBackground image')).toHaveCount(1);
  await page.evaluate(() => { Storage.prototype.setItem=(window as any).__originalSetItem; });
  await activate(page.locator('#backgroundRemove')); expect((await saved()).background).toBeNull();
  await activate(page.locator('#undo')); expect((await saved()).background).toEqual(beforeBad.background);
  expect((await saved()).unit).toEqual(initialUnit);
  expect(remote).toEqual([]); expect(errors).toEqual([]);
});
