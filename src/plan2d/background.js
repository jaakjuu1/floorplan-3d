/* Local drawing attachment controls for the 2D editor. */
window.createBackgroundUI = function createBackgroundUI(hooks) {
  const svg = document.querySelector('#plan');
  let generation = 0, pending = null, mode = '', draft = [], preview = null, loadingKey = null, drag = null, activePointer = null, abort = new AbortController();
  const cache = new Map();
  const tr = (fi, en) => document.documentElement.lang === 'en' ? en : fi;
  const $ = (selector, root = document) => root.querySelector(selector);
  const key = bg => `${bg.source.id}/${bg.page.number}`;
  const root = document.createElement('section');
  root.id = 'backgroundControls';
  root.className = 'background-controls';
  root.innerHTML = `<h3>${tr('Pohjakuva','Background drawing')}</h3>
    <button id="backgroundImport" type="button" class="btn primary" data-action="choose">${tr('Tuo PDF/PNG/JPEG','Import PDF/PNG/JPEG')}</button>
    <div data-role="controls" hidden>
      <div class="background-row"><button id="backgroundVisibility" type="button" class="btn" data-action="visible"></button><button id="backgroundLock" type="button" class="btn" data-action="lock"></button><button id="backgroundRemove" type="button" class="btn danger" data-action="remove">${tr('Poista','Remove')}</button></div>
      <button id="backgroundPageChange" type="button" class="btn" data-action="pages" hidden>${tr('Vaihda PDF-sivu','Change PDF page')}</button>
      <label>${tr('Läpinäkyvyys','Opacity')} <input data-field="opacity" type="range" min="0.1" max="1" step="0.05"><output data-role="opacity"></output></label>
      <div class="background-grid">
        <label>X (mm)<input data-field="x" type="number" step="10"></label><label>Y (mm)<input data-field="y" type="number" step="10"></label>
        <label>${tr('Kierto (°)','Rotation (°)')}<input data-field="rotation" type="number" step="1"></label>
      </div>
      <label>${tr('Tunnettu etäisyys (mm)','Known distance (mm)')}<input id="backgroundDistance" data-field="distance" type="number" min="0.001" step="any" inputmode="decimal"></label>
      <p class="background-hint">${tr('Syötä etäisyys ennen kalibrointia.','Enter the distance before calibration.')}</p>
      <div class="background-row"><button type="button" class="btn" data-action="move">${tr('Siirrä pohjakuvasta','Move drawing')}</button><button type="button" class="btn" data-action="calibrate">${tr('Kalibroi kaksi pistettä','Calibrate two points')}</button></div>
      <p data-role="hint" aria-live="polite"></p>
    </div>
    <dialog id="backgroundPicker" data-role="picker" aria-label="${tr('Pohjakuvan esikatselu','Drawing preview')}">
      <form method="dialog" class="background-dialog">
        <h3>${tr('Tuo pohjakuva','Import drawing')}</h3>
        <label>${tr('PDF-sivu','PDF page')} <select id="backgroundPage" data-role="page"></select></label>
        <div id="backgroundPreview" data-role="preview" class="background-preview"></div><p id="backgroundStatus" data-role="status" aria-live="polite"></p>
        <div class="background-row"><button id="backgroundCancel" type="button" class="btn" data-action="cancel">${tr('Peruuta','Cancel')}</button><button id="backgroundConfirm" type="button" class="btn primary" data-action="confirm" disabled>${tr('Käytä pohjakuvaa','Use drawing')}</button></div>
      </form>
    </dialog>`;
  const host = document.querySelector('#backgroundHost');
  host.prepend(root);
  const modeBar=document.createElement('div');modeBar.id='backgroundMode';modeBar.className='background-mode';modeBar.hidden=true;
  modeBar.innerHTML=`<span data-role="modeText" aria-live="polite"></span><button class="btn" type="button" data-action="modeCancel">${tr('Lopeta','Finish')}</button>`;
  document.querySelector('#stage').append(modeBar);
  const stopMode=()=>{mode='';draft=[];drag=null;activePointer=null;modeBar.hidden=true;};
  modeBar.addEventListener('click',e=>{if(!e.target.closest('button'))return;stopMode();sync();});
  const controls = $('[data-role="controls"]', root), picker = $('[data-role="picker"]', root);
  const previewEl = $('[data-role="preview"]', picker), status = $('[data-role="status"]', picker);
  const pageSelect = $('[data-role="page"]', picker), confirm = $('[data-action="confirm"]', picker);
  const say = (el, message) => { el.textContent = message; };
  const update = fn => {
    const ok = hooks.update(fn);
    if (!ok) hooks.toast(tr('Tallennus epäonnistui. Muutos peruttiin.','Save failed. The change was rolled back.'));
    return ok;
  };
  const image = bg => {
    const g = svg.querySelector('#gBackground');
    g.replaceChildren();
    if (!bg || !bg.visible) return;
    const entry = cache.get(key(bg));
    if (!entry) return;
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('href', entry.dataUrl); image.setAttribute('x', '0'); image.setAttribute('y', '0');
    image.setAttribute('width', String(bg.page.width)); image.setAttribute('height', String(bg.page.height));
    image.setAttribute('opacity', String(bg.opacity)); image.setAttribute('transform', window.PlanBackground.backgroundMatrix(bg));
    image.setAttribute('preserveAspectRatio', 'none'); image.setAttribute('pointer-events', 'none');
    g.append(image);
    if (bg.calibration) {
      const mark = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      mark.setAttribute('transform', window.PlanBackground.backgroundMatrix(bg)); mark.setAttribute('pointer-events', 'none');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', bg.calibration.a.x); line.setAttribute('y1', bg.calibration.a.y); line.setAttribute('x2', bg.calibration.b.x); line.setAttribute('y2', bg.calibration.b.y);
      const unit = Math.max(.000001, hooks.getView().s * bg.transform.mmPerUnit);
      line.setAttribute('stroke', '#c24127'); line.setAttribute('stroke-width', String(3 / unit)); mark.append(line);
      for (const p of [bg.calibration.a, bg.calibration.b]) { const c=document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r',String(7 / unit));c.setAttribute('fill','#fff');c.setAttribute('stroke','#c24127');c.setAttribute('stroke-width',String(2 / unit));mark.append(c); }
      g.append(mark);
    }
  };
  const sync = () => {
    const bg = hooks.getBackground(), enabled = !!bg;
    controls.hidden = !enabled;
    if (!enabled) { image(null); return; }
    $('[data-action="visible"]', root).textContent = bg.visible ? tr('Piilota','Hide') : tr('Näytä','Show');
    $('[data-action="lock"]', root).textContent = bg.locked ? tr('Lukittu','Locked') : tr('Lukitse','Lock');
    $('[data-action="pages"]',root).hidden=bg.source.mime!=='application/pdf'||bg.page.count<2;
    for (const field of ['x','y','rotation','opacity']) { const input = $(`[data-field="${field}"]`, root); input.value = String(field === 'opacity' ? bg.opacity : bg.transform[field]); if(field!=='opacity')input.disabled=bg.locked; }
    $('[data-action="move"]',root).disabled=bg.locked; $('[data-action="calibrate"]',root).disabled=bg.locked;
    $('[data-role="opacity"]', root).value = `${Math.round(bg.opacity * 100)}%`;
    image(bg);
    const k=key(bg);
    if(!cache.has(k)&&loadingKey!==k){
      const token=generation;loadingKey=k;
      void prepare(bg).then(()=>{if(token===generation&&hooks.getBackground()&&key(hooks.getBackground())===k)image(hooks.getBackground());})
        .catch(error=>{if(token===generation){hooks.onLoadError?.(error);hooks.toast(error.message||tr('Pohjakuvaa ei voitu avata','Could not open drawing'));}})
        .finally(()=>{if(loadingKey===k)loadingKey=null;});
    }
  };
  const invalidate = (keepSource=false) => { stopMode();generation++;abort.abort();abort=new AbortController();if(!keepSource)pending=null;preview=null;loadingKey=null;confirm.disabled=true; };
  const rendered = async (source, pageNo, token) => {
    if (cache.has(`${source.id}/${pageNo}`)) return cache.get(`${source.id}/${pageNo}`);
    const result = await window.AttachmentIO.renderAttachment(source,pageNo,undefined,abort.signal);
    if (token !== generation) throw new Error(tr('Lataus peruttiin','Load was cancelled'));
    const k=`${source.id}/${pageNo}`,active=hooks.getBackground();
    for(const cached of cache.keys())if(cached!==k&&(!active||cached!==key(active)))cache.delete(cached);
    cache.set(k,result);return result;
  };
  const prepare = async bg => {
    if (!bg) return null;
    const token = generation;
    // Re-read even a cached source: its embedded bytes must still match the saved digest.
    const result = await window.AttachmentIO.renderAttachment(bg.source,bg.page.number,undefined,abort.signal);
    if(token!==generation)throw new Error(tr('Lataus peruttiin','Load was cancelled'));
    const p = result.page, saved = bg.page;
    if (p.number !== saved.number || p.count !== saved.count || p.width !== saved.width || p.height !== saved.height || p.rotation !== saved.rotation)
      throw new Error(tr('Liitteen sivutiedot eivät vastaa tallennettua suunnitelmaa','Attachment page metadata does not match the saved plan'));
    const k=key(bg),active=hooks.getBackground();for(const cached of cache.keys())if(cached!==k&&(!active||cached!==key(active)))cache.delete(cached);cache.set(k,result);
    return result;
  };
  const openPicker = async file => {
    invalidate(); hooks.cancelPlanImport?.(); const token = generation;
    status.textContent = tr('Luetaan liitettä…','Reading attachment…'); previewEl.replaceChildren(); confirm.disabled = true;
    picker.showModal();
    try {
      const source = await window.AttachmentIO.readAttachment(file);
      if (token !== generation) return;
      pending = source;
      const first = await rendered(source, 1, token);
      if (token !== generation) return;
      pageSelect.replaceChildren();
      for (let n=1;n<=first.page.count;n++){const o=document.createElement('option');o.value=String(n);o.textContent=`${n} / ${first.page.count}`;pageSelect.append(o);}
      await showPage(1, token);
    } catch (error) { if (token === generation) say(status, error.message || tr('Liitettä ei voitu lukea','Could not read attachment')); }
  };
  const openSavedPages = async bg => {
    invalidate();hooks.cancelPlanImport?.();const token=generation;pending=bg.source;
    pageSelect.replaceChildren();for(let n=1;n<=bg.page.count;n++){const o=document.createElement('option');o.value=String(n);o.textContent=`${n} / ${bg.page.count}`;pageSelect.append(o);}
    pageSelect.value=String(bg.page.number);status.textContent=tr('Luetaan tallennettua liitettä…','Reading saved attachment…');previewEl.replaceChildren();confirm.disabled=true;picker.showModal();
    await showPage(bg.page.number,token);
  };
  const showPage = async (number, token = generation) => {
    confirm.disabled = true; say(status, tr('Renderöidään sivua…','Rendering page…'));
    try {
      const result = await rendered(pending, number, token);
      if (token !== generation) return;
      const base = window.PlanBackground.createBackground(pending, result.page, hooks.getBounds());
      preview = base; previewEl.replaceChildren(); const img=document.createElement('img');img.src=result.dataUrl;img.alt=tr(`Pohjakuvan sivu ${number}`,`Drawing page ${number}`);previewEl.append(img);
      say(status, `${result.page.width} × ${result.page.height} · ${result.page.rotation}°`); confirm.disabled = false;
    } catch (error) { if (token === generation) say(status, error.message || tr('Sivua ei voitu renderöidä','Could not render page')); }
  };
  root.addEventListener('click', async e => {
    const button = e.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action, bg = hooks.getBackground();
    if (action === 'choose') { const input=document.createElement('input'); input.type='file';input.accept='.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';input.hidden=true;document.body.append(input);input.onchange=()=>{if(input.files?.[0])void openPicker(input.files[0]);input.remove();};input.click(); }
    else if (action === 'visible' && bg) { stopMode();update(v=>{v.visible=!v.visible;});sync(); }
    else if (action === 'lock' && bg) { stopMode();update(v=>{v.locked=!v.locked;});sync(); }
    else if (action === 'pages' && bg && bg.source.mime==='application/pdf' && bg.page.count>1) { void openSavedPages(bg).catch(error=>say(status,error.message||tr('Sivua ei voitu avata','Could not open page'))); }
    else if (action === 'remove' && bg) { invalidate();mode='';if(!hooks.replace(null))hooks.toast(tr('Tallennus epäonnistui. Pohjakuvaa ei poistettu.','Save failed. The drawing was not removed.'));sync(); }
    else if (action === 'move' && bg) { if (bg.locked) return; mode=mode==='move'?'':'move'; draft=[]; if(mode)hooks.closeDrawers();modeBar.hidden=!mode;say($('[data-role="modeText"]',modeBar),tr('Vedä pohjakuvaa. Zoomaa yläreunan painikkeilla.','Drag the drawing. Use the zoom buttons above to zoom.')); }
    else if (action === 'calibrate' && bg) { if (bg.locked) return; mode=mode==='calibrate'?'':'calibrate';draft=[];if(mode)hooks.closeDrawers();modeBar.hidden=!mode;say($('[data-role="modeText"]',modeBar),tr('Valitse piirustuksesta kaksi pistettä. Etäisyys syötetään pohjakuva-asetuksissa.','Pick two points on the drawing. Enter the distance in drawing settings.')); }
    else if (action === 'modeCancel') { stopMode();sync(); }
  });
  root.addEventListener('change', e => {
    const field=e.target.dataset.field, bg=hooks.getBackground(); if(!['opacity','x','y','rotation'].includes(field)||!bg)return;
    const n=Number(e.target.value); if(!Number.isFinite(n))return;
    if(field==='opacity'){if(n<=0||n>1)return;update(v=>{v.opacity=n;});}
    else update(v=>{v.transform[field]=n;});
    sync();
  });
  pageSelect.addEventListener('change', () => { if(!pending)return;invalidate(true);void showPage(Number(pageSelect.value),generation); });
  $('[data-action="cancel"]',picker).addEventListener('click',()=>{invalidate();picker.close();});
  picker.addEventListener('cancel',()=>invalidate());
  confirm.addEventListener('click',()=>{ if(!preview)return; const ok=hooks.replace(preview); if(ok){picker.close();preview=null;sync();} else say(status,tr('Tallennus epäonnistui. Aiempi suunnitelma säilyi.','Save failed. The previous plan is unchanged.')); });
  svg.addEventListener('pointerdown', e => {
    const bg=hooks.getBackground(); if (!bg || bg.locked || hooks.is3D() || !mode || e.button>0)return;
    e.stopImmediatePropagation();
    if(activePointer!==null)return;
    activePointer=e.pointerId;svg.setPointerCapture(e.pointerId);
    const p=window.PlanBackground.screenToAttachment(hooks.toMM(e),bg);
    if(mode==='move') drag={x:e.clientX,y:e.clientY,bg:structuredClone(bg),current:null};
    else draft.push(p);
  }, true);
  svg.addEventListener('pointermove', e => { if(activePointer===null)return;e.stopImmediatePropagation();if(e.pointerId!==activePointer||!drag)return; const mm=hooks.toMM(e), start=hooks.toMM({clientX:drag.x,clientY:drag.y});const dx=mm.x-start.x,dy=mm.y-start.y;drag.current=structuredClone(drag.bg);drag.current.transform.x+=dx;drag.current.transform.y-=dy;image(drag.current); }, true);
  const endDrag=(e,cancel=false)=>{
    if(activePointer===null)return;
    e.stopImmediatePropagation();if(e.pointerId!==activePointer)return;
    activePointer=null;
    if(mode==='calibrate'){
      if(cancel){draft=[];say($('[data-role="modeText"]',modeBar),tr('Ele peruttiin. Valitse kaksi pistettä uudelleen.','Gesture cancelled. Pick two points again.'));return;}
      if(draft.length===2){const bg=hooks.getBackground(),mm=Number($('[data-field="distance"]',root).value);try{const calibrated=window.PlanBackground.calibrateBackground(bg,draft[0],draft[1],mm);if(update(v=>Object.assign(v,calibrated))){stopMode();say($('[data-role="hint"]',root),tr('Kalibrointi tallennettu.','Calibration saved.'));}draft=[];sync();}catch(error){draft=[];say($('[data-role="modeText"]',modeBar),error.message);modeBar.hidden=false;}}
      else say($('[data-role="modeText"]',modeBar),tr('Ensimmäinen piste valittu. Napauta toista pistettä.','First point set. Tap the second point.'));
      return;
    }
    if(drag){const moved=drag.current;drag=null;if(moved&&!cancel)update(v=>{v.transform.x=moved.transform.x;v.transform.y=moved.transform.y;});sync();}
  };
  svg.addEventListener('pointerup',e=>endDrag(e,false),true);svg.addEventListener('pointercancel',e=>endDrag(e,true),true);
  return {
    render: sync,
    async prepare(bg){return prepare(bg);},
    cancelPending(){invalidate();if(picker.open)picker.close();},
  };
};
