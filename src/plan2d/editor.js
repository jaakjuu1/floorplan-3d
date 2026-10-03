/* ======================= Kielet (suomi / English, oletuksena suomi) ======================= */
const LANG_KEY = 'huxing-lang';
let LANG = (() => { try { return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'fi'; } catch(e) { return 'fi'; } })();
const tr = (fi, en) => LANG === 'en' ? en : fi;
// Sisäänrakennetut huoneiden / materiaalien / kalusteiden nimet on tallennettu suomeksi; englanninkielisessä käyttöliittymässä näytetään käännös, käyttäjän itse muokkaamat nimet näytetään sellaisenaan
const NAMES_EN = {
  'Päämakuuhuone':'Master Bedroom', 'Pääkylpyhuone':'Master Bath', 'Lastenhuone':"Kids' Room", 'Vieraskylpyhuone':'Guest Bath', 'Pyykkiparveke':'Laundry Balcony',
  'Nuortenhuone':"Children's Room", 'Keittiö':'Kitchen', 'Ruokailutila':'Dining', 'Käytävä':'Hallway', 'Olohuone':'Living Room', 'Oleskeluparveke':'Leisure Balcony',
  'Päämakuuhuoneen erkkeri':'Master Bay Window', 'Nuortenhuoneen erkkeri':"Children's Bay Window",
  'Tammiparketti':'Oak Flooring', 'Pähkinäparketti':'Walnut Flooring', '800 laatta':'800 Tile', '600 laatta':'600 Tile', 'Marmori':'Marble',
  '300 liukumaton laatta':'300 Anti-slip Tile', 'Terrazzo':'Terrazzo', 'Kokolattiamatto':'Wall-to-wall Carpet',
  'Makuuhuone':'Bedroom', 'Ruokailu ja keittiö':'Dining & Kitchen', 'Kylpyhuone':'Bathroom', 'Kodinkoneet':'Appliances', 'Työhuone · vapaa-aika':'Study & Leisure',
  'Parisänky 1.8m':'Double Bed 1.8m', 'Parisänky 1.5m':'Double Bed 1.5m', 'Parisänky':'Double Bed', 'Yhden hengen sänky':'Single Bed', 'Vauvansänky':'Crib',
  'Yöpöytä':'Nightstand', 'Vaatekaappi':'Wardrobe', 'Pieni vaatekaappi':'Small Wardrobe', 'Meikkipöytä':'Dresser', 'Työpöytä':'Desk', 'Tuoli':'Chair',
  'Kirjahylly':'Bookshelf', 'Erkkeripenkin tyyny':'Bay Cushion', '3-istuttava sohva':'3-Seat Sofa', '2-istuttava sohva':'Loveseat', 'Kulmasohva':'Corner Sofa',
  'Nojatuoli':'Armchair', 'Säkkituoli':'Beanbag', 'Sohvapöytä':'Coffee Table', 'Sivupöytä':'Side Table', 'TV-taso':'TV Stand', 'Matto':'Rug',
  'Kenkäkaappi':'Shoe Cabinet', 'Eteiskaappi':'Entry Cabinet', 'Lattiavalaisin':'Floor Lamp', 'Kasvi':'Plant', 'Suuri kasvi':'Large Plant',
  'Ruokapöytä':'Dining Table', '6 hengen ruokapöytä':'6-Seat Dining Table', 'Pyöreä pöytä':'Round Table', 'Ruokatuoli':'Dining Chair', 'Keittiösaareke':'Kitchen Island',
  'Baarijakkara':'Bar Stool', 'Keittiötaso':'Kitchen Counter', 'Kaasuliesi':'Gas Stove', 'Allas':'Sink', 'Jääkaappi':'Fridge', 'Senkki':'Sideboard',
  'WC-istuin':'Toilet', 'Pesukaappi':'Vanity', 'Kaksoispesukaappi':'Double Vanity', 'Suihkukaappi':'Shower', 'Suihkualue':'Shower Area', 'Kylpyamme':'Bathtub',
  'Pyykinpesukone':'Washer', 'Pyykkiallas':'Laundry Sink', 'Sähkövesivaraaja':'Water Heater', 'Säilytyskaappi':'Storage Cabinet', '65" TV':'65" TV',
  '55" TV':'55" TV', 'Kaappijääkaappi':'French-door Fridge', 'Lattia-ilmastointilaite':'Floor AC', 'Seinäilmastointilaite':'Wall AC', 'Astianpesukone':'Dishwasher',
  'Uunikaappi':'Oven Tower', 'Kuivausrumpu':'Dryer', 'Ilmanpuhdistin':'Air Purifier', 'Pitkä työpöytä':'Long Desk', 'Työtuoli':'Office Chair',
  'Suuri kirjahylly':'Large Bookshelf', 'Piano':'Upright Piano', 'Juoksumatto':'Treadmill', 'Lukutuoli':'Reading Chair', 'Teepöytä':'Tea Table', 'Lepotuoli':'Lounge Chair',
};
// Lyhenteet 2D-pohjan kalustetunnisteisiin (suomi); englanniksi käytetään NAMES_EN-nimeä
const SHORT_FI = {
  'Parisänky 1.8m':'Parisänky', 'Parisänky 1.5m':'Parisänky', 'Yhden hengen sänky':'Yh. sänky', 'Vauvansänky':'Vauvans.',
  'Yöpöytä':'Yöp.', 'Vaatekaappi':'Vaatek.', 'Pieni vaatekaappi':'Vaatek.', 'Meikkipöytä':'Meikkip.', 'Työpöytä':'Työp.', 'Pitkä työpöytä':'Työp.',
  'Kirjahylly':'Kirjah.', 'Suuri kirjahylly':'Kirjah.', 'Erkkeripenkin tyyny':'Tyyny', '3-istuttava sohva':'3-ist. sohva', '2-istuttava sohva':'2-ist. sohva',
  'Kulmasohva':'Kulmas.', 'Nojatuoli':'Nojat.', 'Säkkituoli':'Säkkit.', 'Sohvapöytä':'Sohvap.', 'Sivupöytä':'Sivup.', 'Kenkäkaappi':'Kenkäk.',
  'Eteiskaappi':'Eteisk.', 'Lattiavalaisin':'Lattiaval.', 'Suuri kasvi':'Kasvi', 'Ruokapöytä':'Ruokap.', '6 hengen ruokapöytä':'Ruokap.',
  'Pyöreä pöytä':'Pyöreä p.', 'Ruokatuoli':'Ruokat.', 'Keittiösaareke':'Saareke', 'Baarijakkara':'Jakkara', 'Keittiötaso':'Taso',
  'Kaasuliesi':'Liesi', 'Jääkaappi':'Jääk.', 'Kaappijääkaappi':'Jääk.', 'Senkki':'Senkki', 'WC-istuin':'WC', 'Pesukaappi':'Pesuk.',
  'Kaksoispesukaappi':'Pesuk.', 'Suihkukaappi':'Suihku', 'Suihkualue':'Suihku', 'Kylpyamme':'Amme', 'Pyykinpesukone':'PPK', 'Pyykkiallas':'Pyykkial.',
  'Sähkövesivaraaja':'Varaaja', 'Säilytyskaappi':'Säilyt.k.', 'Lattia-ilmastointilaite':'IV-laite', 'Seinäilmastointilaite':'IV-laite',
  'Astianpesukone':'Astianp.', 'Uunikaappi':'Uunik.', 'Kuivausrumpu':'Kuiv.r.', 'Ilmanpuhdistin':'Ilmanp.', 'Työtuoli':'Työt.',
  'Lukutuoli':'Lukut.', 'Teepöytä':'Teep.', 'Lepotuoli':'Lepot.', 'Juoksumatto':'Juoksum.',
};
const nm = s => LANG === 'en' && Object.hasOwn(NAMES_EN, s) ? NAMES_EN[s] : s;
// Staattiset tekstit: elementeille kirjoitetaan data-en / data-en-title, suomenkielinen alkuperäisteksti tallennetaan datasettiin ensimmäisellä vaihdolla
function applyStaticLang(){
  document.documentElement.lang = tr('fi', 'en');
  document.title = tr('Kodin sisustussuunnittelu', 'Floor Plan Designer');
  document.querySelectorAll('[data-en]').forEach(el => { el.dataset.fi ??= el.textContent; el.textContent = tr(el.dataset.fi, el.dataset.en); });
  document.querySelectorAll('[data-en-title]').forEach(el => { el.dataset.fiTitle ??= el.title; el.title = tr(el.dataset.fiTitle, el.dataset.enTitle); });
  document.getElementById('langBtn').textContent = tr('EN', 'FI');
}

// Demo: examples/demo-unit.json, assumed/archive_drawing; ei vahvistettuja kenttämittoja.
// Rakennusgeometria johdetaan unit-v1:stä; vanhaa koordinaattilistaa ei säilytetä.
let ROOMS = [], WALLS = [], OPENINGS = [], FIXTURES = [], PLAN = null, TARGET = null, MARKS = {added:new Set(), modified:new Set()}, FINDINGS = [];
const MATS = {
  wood:    {name:'Tammiparketti', price:55, sw:'#d8b88a'},
  walnut:  {name:'Pähkinäparketti', price:75, sw:'#9b7250'},
  tile800: {name:'800 laatta', price:45, sw:'#ebe6dc'},
  tile600: {name:'600 laatta', price:35, sw:'#dfe3e1'},
  marble:  {name:'Marmori', price:130, sw:'#f1eee8'},
  antislip:{name:'300 liukumaton laatta', price:40, sw:'#d3d8d4'},
  terrazzo:{name:'Terrazzo', price:90, sw:'#e6dfd3'},
  carpet:  {name:'Kokolattiamatto', price:30, sw:'#c9c3d3'},
};
// Kalustekirjasto: [tyyppi, nimi, leveys, syvyys, väri]
const LIB = [
  {cat:'Makuuhuone', items:[
    ['bed','Parisänky 1.8m',1800,2000,'#c9d6df'],['bed','Parisänky 1.5m',1500,2000,'#d8c7dc'],['bed','Yhden hengen sänky',1200,2000,'#e8d5b5'],
    ['crib','Vauvansänky',1250,700,'#efe3d0'],['nightstand','Yöpöytä',450,400,'#e8dccb'],['wardrobe','Vaatekaappi',2000,600,'#efe6d8'],
    ['wardrobe','Pieni vaatekaappi',1200,550,'#efe6d8'],['dresser','Meikkipöytä',1000,450,'#efe6d8'],['desk','Työpöytä',1200,600,'#e2cfb4'],
    ['chair','Tuoli',450,480,'#cfc6b8'],['bookshelf','Kirjahylly',800,300,'#e2cfb4'],['baycushion','Erkkeripenkin tyyny',520,1800,'#e7dccd']]},
  {cat:'Olohuone', items:[
    ['sofa','3-istuttava sohva',2400,900,'#b7c4b0'],['sofa','2-istuttava sohva',1700,880,'#c3cbd6'],['cornersofa','Kulmasohva',2800,1700,'#b7c4b0'],
    ['armchair','Nojatuoli',850,850,'#d6b99a'],['beanbag','Säkkituoli',800,800,'#e0b98f'],['coffeetable','Sohvapöytä',1300,650,'#e8dccb'],
    ['sidetable','Sivupöytä',500,500,'#d9c3a3'],['tvstand','TV-taso',2400,400,'#e2cfb4'],['rug','Matto',2400,1700,'#d9cbb8'],
    ['shoecab','Kenkäkaappi',1000,350,'#efe6d8'],['shoecab','Eteiskaappi',1400,380,'#e6dccc'],['floorlamp','Lattiavalaisin',450,450,'#3d3a34'],
    ['plant','Kasvi',500,500,'#a9c39b'],['plant','Suuri kasvi',700,700,'#9dbb8c']]},
  {cat:'Ruokailu ja keittiö', items:[
    ['table','Ruokapöytä',1400,800,'#e2cfb4'],['table','6 hengen ruokapöytä',1800,900,'#d8c2a2'],['roundtable','Pyöreä pöytä',1000,1000,'#e2cfb4'],
    ['chair','Ruokatuoli',450,480,'#cfc6b8'],['island','Keittiösaareke',1800,900,'#e9e5de'],['barstool','Baarijakkara',420,420,'#6b5d4c'],
    ['counter','Keittiötaso',1600,600,'#e9e5de'],['stove','Kaasuliesi',750,450,'#dcdcdc'],['ksink','Allas',800,450,'#e1e6ea'],
    ['fridge','Jääkaappi',700,700,'#dfe4e8'],['cabinet','Senkki',1600,400,'#efe6d8']]},
  {cat:'Kylpyhuone', items:[
    ['toilet','WC-istuin',400,700,'#ffffff'],['vanity','Pesukaappi',800,500,'#eef1f3'],['vanity','Kaksoispesukaappi',1200,500,'#eef1f3'],
    ['shower','Suihkukaappi',900,900,'#e4edf2'],['bathtub','Kylpyamme',1600,750,'#eef3f6'],['washer','Pyykinpesukone',600,600,'#e6ebee'],
    ['waterheater','Sähkövesivaraaja',800,450,'#f4f4f2'],['cabinet','Säilytyskaappi',1000,400,'#efe6d8']]},
  {cat:'Kodinkoneet', items:[
    ['tv','65" TV',1450,80,'#1d1d1f'],['tv','55" TV',1230,80,'#1d1d1f'],['fridge','Kaappijääkaappi',910,700,'#c9ced3'],
    ['aircon','Lattia-ilmastointilaite',500,380,'#f6f7f8'],['acwall','Seinäilmastointilaite',900,250,'#f6f7f8'],['dishwasher','Astianpesukone',600,600,'#c9ced3'],
    ['ovencol','Uunikaappi',600,600,'#efe6d8'],['dryer','Kuivausrumpu',600,600,'#e6ebee'],['purifier','Ilmanpuhdistin',400,300,'#f4f4f2']]},
  {cat:'Työhuone · vapaa-aika', items:[
    ['desk','Pitkä työpöytä',1600,700,'#d8c2a2'],['officechair','Työtuoli',620,620,'#4a4f55'],['bookshelf','Suuri kirjahylly',1600,350,'#e2cfb4'],
    ['piano','Piano',1500,600,'#1f1d1b'],['treadmill','Juoksumatto',800,1800,'#3a3a3c'],['armchair','Lukutuoli',750,800,'#c9a98a']]},
];
const typeColor = t => { for (const c of LIB) for (const i of c.items) if (i[0]===t) return i[4]; return '#eee'; };

let _n = 1;
const uid = () => 'f' + Date.now().toString(36) + (_n++);
const F = (type,name,cx,cy,w,d,rot=0,color) => ({id:uid(),type,name,cx,cy,w,d,rot,color:color||typeColor(type)});

function defaultFurniture(){ return [
  // Päämakuuhuone
  F('bed','Parisänky',8300,1000,1800,2000,0,'#c9d6df'), F('nightstand','Yöpöytä',7150,220,450,400), F('nightstand','Yöpöytä',9450,220,450,400),
  F('wardrobe','Vaatekaappi',8800,3070,2400,600,180), F('baycushion','Erkkeripenkin tyyny',10770,1705,520,1800),
  // Pääkylpyhuone
  F('shower','Suihkukaappi',5270,450,900,900), F('toilet','WC-istuin',5170,1500,400,700,270), F('vanity','Pesukaappi',6110,700,800,500,90),
  // Lastenhuone
  F('bed','Yhden hengen sänky',2420,1000,1200,2000,0,'#e8d5b5'), F('desk','Työpöytä',2120,2700,1200,600,270), F('chair','Tuoli',2700,2700,450,480,90),
  F('wardrobe','Vaatekaappi',4280,1000,1600,600,90), F('bookshelf','Kirjahylly',3500,150,800,300),
  // Vieraskylpyhuone
  F('shower','Suihkualue',2870,4280,900,1340), F('toilet','WC-istuin',3560,3960,400,700), F('vanity','Pesukaappi',4150,3850,700,480),
  // Pyykkiparveke
  F('washer','Pyykinpesukone',300,3960,600,600,270), F('vanity','Pyykkiallas',250,4600,600,500,270),
  // Keittiö
  F('counter','Keittiötaso',300,6575,2770,600,270), F('counter','Keittiötaso',1390,7660,1580,600,180),
  F('stove','Kaasuliesi',300,6200,750,450,270), F('ksink','Allas',1400,7680,800,450,180),
  // Ruokailutila
  F('fridge','Jääkaappi',2770,5540,700,700), F('table','Ruokapöytä',3600,6650,1400,800,90),
  F('chair','Ruokatuoli',2940,6320,450,480,270), F('chair','Ruokatuoli',2940,6980,450,480,270),
  F('chair','Ruokatuoli',4260,6320,450,480,90), F('chair','Ruokatuoli',4260,6980,450,480,90),
  F('cabinet','Senkki',3500,7785,1600,350,180),
  // Olohuone
  F('rug','Matto',7600,8950,2600,1800), F('tvstand','TV-taso',7600,6810,2400,400), F('sofa','3-istuttava sohva',7600,10110,3000,900,180),
  F('coffeetable','Sohvapöytä',7600,8900,1300,650), F('armchair','Nojatuoli',9500,8900,850,850,90),
  F('shoecab','Kenkäkaappi',4995,9900,1000,350,270), F('plant','Kasvi',9950,10250,500,500), F('plant','Kasvi',5250,7050,500,500),
  // Nuortenhuone
  F('bed','Parisänky',7323,5500,1500,2000,270,'#d8c7dc'), F('wardrobe','Vaatekaappi',8500,3910,2000,600),
  F('desk','Työpöytä',9500,6070,1200,600,180), F('chair','Tuoli',9500,5480,450,480), F('baycushion','Erkkeripenkin tyyny',10770,4997,520,1575),
  // Oleskeluparveke
  F('roundtable','Teepöytä',11180,8200,600,600), F('armchair','Lepotuoli',11180,7520,750,750,0,'#d6b99a'),
  F('armchair','Lepotuoli',11180,8880,750,750,180,'#d6b99a'), F('plant','Kasvi',11550,10250,500,500),
];}

function defaultState(){
  const unit = structuredClone(window.UnitModel.demoUnit), projection = window.UnitModel.projectUnit(unit);
  const rooms = Object.fromEntries(projection.rooms.map(r => [r.id, {name:r.name, mat:MATS[r.mat] ? r.mat : 'wood'}]));
  return {schema_version:'kodin-design-v2', unit, furniture:defaultFurniture(), rooms, measures:[]};
}

const defaults = defaultState();
const defaultBaseline = JSON.stringify(defaults.unit.baseline);
function isDefaultUnit(){ return JSON.stringify(state.unit.baseline) === defaultBaseline; }
let storageBlocked = false, state;
try { state = window.UnitModel.loadDesign(localStorage, defaults) || structuredClone(defaults); }
catch (error) { state = structuredClone(defaults); storageBlocked = true; setTimeout(() => toast(tr('Tallennus on virheellinen. Palauta tai tuo suunnitelma ennen muokkauksia.', 'Saved plan is invalid. Reset or import a plan before editing.')), 0); console.error(error); }
function demolishedIds(){ return new Set(PLAN.demolishedWalls.map(w=>w.id)); }
function project(){
  PLAN = window.UnitModel.projectUnit(state.unit);
  ROOMS = PLAN.rooms.map(r => ({...r, ...state.rooms[r.id], mat:MATS[state.rooms[r.id]?.mat] ? state.rooms[r.id].mat : (MATS[r.mat] ? r.mat : 'wood')}));
  WALLS = PLAN.walls; OPENINGS = PLAN.openings; FIXTURES = PLAN.fixtures || [];
  TARGET = window.UnitModel.edit.targetState(state.unit);
  const marks = window.UnitModel.edit.changeMarks(state.unit);
  MARKS = {added:new Set(marks.added), modified:new Set(marks.modified)};
  FINDINGS = window.UnitModel.rules.evaluate(state.unit);
}
project();

const PX_MM = 25.4 / 96;                       // 1 CSS px = 0.2646 mm
const COARSE = matchMedia('(pointer:coarse)').matches;   // iPad / puhelin ym. ensisijaisesti kosketusnäytölliset laitteet
const TAP = COARSE ? 9 : 4;                    // sormen on liikuttava yli tämän pikselimäärän, jotta se lasketaan vedoksi
const narrow = () => matchMedia('(max-width:1100px)').matches;
const BOUNDS = {
  get x(){return isDefaultUnit() ? -1850 : PLAN.bounds.x}, get y(){return isDefaultUnit() ? -1750 : PLAN.bounds.y},
  get w(){return isDefaultUnit() ? 15600 : (PLAN.bounds.w || 10000)}, get h(){return isDefaultUnit() ? 14100 : (PLAN.bounds.h || 10000)},
};
const $ = s => document.querySelector(s);
const svg = $('#plan');


/* ======================= Tila / historia / tallennus ======================= */
const ui = {tool:'select', sel:null, mA:null, mCur:null, wA:null, wCur:null, route:null,
  newWall:{thickness:100}, newFixture:{kind:'grab_bar', width:600, depth:80},
  layers:{dims:true, labels:true, furn:true, grid:false, bearing:false, wallSnap:true}};
let view = {x0:0, y0:0, s:.06};
const undoStack = [], redoStack = [];
let planImportGeneration = 0;
const cancelPlanImport = () => { planImportGeneration++; };
const backgroundUI = window.createBackgroundUI({
  getBackground: () => state.background ?? null,
  replace: background => {
    if (storageBlocked){ toast(tr('Tuo kelvollinen suunnitelma tai palauta oletus ennen pohjakuvan tallennusta.','Import a valid plan or reset before saving a drawing.')); return false; }
    return mutate(() => { state.background = background; });
  },
  update: fn => mutate(() => { if (state.background) fn(state.background); }),
  // The pointer draft never enters state or history; an accepted trace is one model edit.
  trace: build => editUnit(build),
  getBounds: () => ({x:BOUNDS.x,y:BOUNDS.y,w:BOUNDS.w,h:BOUNDS.h}),
  getView: () => view, toMM: e => toMM(e), toast: msg => toast(msg),
  closeDrawers: () => closeDrawers(), is3D: () => is3D(), cancelPlanImport,
  onLoadError: () => { storageBlocked=true; },
});

/* One accepted model edit is one undoable step. build(unit) returns a validated detached candidate
 * (src/model/edit.ts, trace.ts); the editor's room layer follows the target state's rooms and floors. */
function editUnit(build){
  if (storageBlocked){ toast(tr('Tuo kelvollinen suunnitelma tai palauta oletus ennen muokkausta.','Import a valid plan or reset before editing.')); return false; }
  let next;
  try { next = build(state.unit); } catch (error) { toast(error.message); return false; }
  return mutate(() => {
    state.unit = next.unit;
    const rooms = window.UnitModel.edit.targetState(state.unit).rooms ?? [];
    state.rooms = Object.fromEntries(rooms.map(r => [r.id, {name:state.rooms[r.id]?.name ?? r.name, mat:MATS[r.floor] ? r.floor : 'wood'}]));
  });
}
const EDIT = () => window.UnitModel.edit;

function save(){
  if (storageBlocked) return true;
  try { window.UnitModel.saveDesign(localStorage, state); return true; }
  catch(e) { toast(tr('Tallennus epäonnistui. Aiempi suunnitelma säilyi.', 'Could not save. The previous plan was preserved.')); console.error(e); return false; }
}
const snap = () => JSON.stringify(state);
function pushHistory(stack, snapshot){
  stack.push(snapshot);
  // ponytail: JSON history is capped at 16 MiB per stack; use shared revisions if larger attachments become necessary.
  let bytes = stack.reduce((sum, item) => sum + item.length * 2, 0);
  while (stack.length > 1 && (stack.length > 150 || bytes > 16 * 1024 * 1024)) bytes -= stack.shift().length * 2;
}
function commit(before){
  cancelPlanImport();
  if (!save()){ state=JSON.parse(before); project(); validateSel(); return false; }
  pushHistory(undoStack, before); redoStack.length=0; return true;
}
function mutate(fn){ const b=snap(); fn(); project(); const ok=commit(b); renderAll(); return ok; }
function restoreHistory(from, to){
  if (!from.length) return;
  cancelPlanImport(); backgroundUI.cancelPending();
  const before=snap(); state=JSON.parse(from[from.length-1]);
  if (!save()){ state=JSON.parse(before); return; }
  from.pop(); pushHistory(to,before); project(); validateSel(); renderAll();
}
function undo(){ if (!undoStack.length) return toast(tr('Ei kumottavaa','Nothing to undo')); restoreHistory(undoStack,redoStack); }
function redo(){ restoreHistory(redoStack,undoStack); }
function validateSel(){
  const s = ui.sel; if (!s) return;
  const ok = s.kind==='furn' ? !!getF(s.id) : s.kind==='room' ? ROOMS.some(r => r.id===s.id)
    : s.kind==='wall' ? [...WALLS, ...PLAN.demolishedWalls].some(w => w.id===s.id)
    : s.kind==='opening' ? OPENINGS.some(o => o.id===s.id) : s.kind==='fixture' ? FIXTURES.some(f => f.id===s.id) : false;
  if (!ok) ui.sel = null;
}
const getF = id => state.furniture.find(f => f.id === id);

/* ======================= Geometriatyökalut ======================= */
const area = poly => Math.abs(poly.reduce((a,p,i) => { const q = poly[(i+1)%poly.length]; return a + p[0]*q[1] - q[0]*p[1]; }, 0)) / 2 / 1e6;
const perim = poly => poly.reduce((a,p,i) => { const q = poly[(i+1)%poly.length]; return a + Math.hypot(q[0]-p[0], q[1]-p[1]); }, 0) / 1000;
const bbox = poly => { const xs = poly.map(p=>p[0]), ys = poly.map(p=>p[1]); return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]; };
function aabb(f){ const a = f.rot*Math.PI/180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)); return {hw:f.w/2*c + f.d/2*s, hh:f.w/2*s + f.d/2*c}; }
const fmt = (n, d=2) => n.toFixed(d);
const norm = a => ((Math.round(a) % 360) + 360) % 360;
function snapRects(){
  // ponytail: kalustesnap tukee akselinsuuntaisia seiniä; vinojen snap vaatii segmenttiprojektion.
  const rect = poly => { const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]); return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]; };
  const axisAligned = (a,b) => Math.abs(a[0]-b[0])<1 || Math.abs(a[1]-b[1])<1;
  return WALLS.flatMap(w=>w.segments.filter(s=>axisAligned(s.a,s.b)).map(s=>rect(s.polygon)))
    .concat(OPENINGS.filter(o=>o.kind==='window'&&axisAligned(o.a,o.b)).map(o=>rect(o.polygon)));
}

/* ======================= Värit / materiaalikuviot ======================= */
function hex2rgb(h){ h = h.replace('#',''); if (h.length===3) h = h.split('').map(c=>c+c).join(''); const n = parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function shade(h,k){ const f = v => Math.max(0,Math.min(255,Math.round(k>1 ? v+(255-v)*(k-1)*2 : v*k))); return '#'+hex2rgb(h).map(v=>f(v).toString(16).padStart(2,'0')).join(''); }

function buildDefs(){
  const plank = (id,base,line) => `<pattern id="m-${id}" patternUnits="userSpaceOnUse" width="1800" height="360">
      <rect width="1800" height="360" fill="${base}"/>
      <path d="M0 0H1800M0 180H1800M1200 0V180M600 180V360" stroke="${line}" stroke-width="10"/>
      <path d="M100 70Q500 60 900 85T1700 75M200 260Q700 250 1100 275T1750 262" stroke="${line}" stroke-width="5" fill="none" opacity=".45"/></pattern>`;
  const tile = (id,size,base,line) => `<pattern id="m-${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${base}"/><path d="M0 0H${size}M0 0V${size}" stroke="${line}" stroke-width="10"/></pattern>`;
  $('#defs').innerHTML =
    plank('wood','#dcc09a','#bf9d70') + plank('walnut','#a57c56','#80593a') +
    tile('tile800',800,'#ece7de','#d3cabb') + tile('tile600',600,'#e2e6e3','#c4cbc6') + tile('antislip',300,'#d6dbd7','#b3bab4') +
    `<pattern id="m-marble" patternUnits="userSpaceOnUse" width="1200" height="1200">
      <rect width="1200" height="1200" fill="#f3f0ea"/><path d="M0 0H1200M0 0V1200" stroke="#dcd5c8" stroke-width="10"/>
      <path d="M-50 300C250 260 380 520 700 470S1100 640 1260 600M200 1200C300 950 520 980 640 820" stroke="#d6cfc2" stroke-width="12" fill="none"/></pattern>
    <pattern id="m-terrazzo" patternUnits="userSpaceOnUse" width="500" height="500">
      <rect width="500" height="500" fill="#e8e1d5"/>
      <circle cx="60" cy="80" r="22" fill="#b9a58c"/><circle cx="310" cy="140" r="16" fill="#8fa3a0"/><circle cx="190" cy="330" r="26" fill="#c9b7a2"/>
      <circle cx="420" cy="400" r="18" fill="#a88f76"/><circle cx="90" cy="440" r="12" fill="#8fa3a0"/><circle cx="440" cy="40" r="10" fill="#b9a58c"/></pattern>
    <pattern id="m-carpet" patternUnits="userSpaceOnUse" width="120" height="120">
      <rect width="120" height="120" fill="#c9c3d3"/><circle cx="30" cy="30" r="8" fill="#bab3c6"/><circle cx="90" cy="90" r="8" fill="#bab3c6"/></pattern>
    <pattern id="grid" patternUnits="userSpaceOnUse" width="1000" height="1000">
      <path d="M500 0V1000M0 500H1000" stroke="#e5dfd3" stroke-width="8"/><path d="M0 0V1000M0 0H1000" stroke="#d8d0c1" stroke-width="14"/></pattern>`;
}

/* ======================= Kalustesymbolit ======================= */
const ST = 'stroke="#3d3a34" stroke-width="1" vector-effect="non-scaling-stroke"';
const rc = (x,y,w,h,f,ex='') => `<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${f}" ${ST} ${ex}/>`;
const ec = (cx,cy,rx,ry,f,ex='') => `<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(0,rx)}" ry="${Math.max(0,ry)}" fill="${f}" ${ST} ${ex}/>`;
const ln = (x1,y1,x2,y2,ex='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${ST} ${ex}/>`;
const pa = (d,f='none',ex='') => `<path d="${d}" fill="${f}" ${ST} ${ex}/>`;
const DASH = 'stroke-dasharray="4 3"';

function furnSVG(t,w,d,c){
  const x = -w/2, y = -d/2, m = Math.min(w,d);
  switch (t){
    case 'bed': {
      let s = rc(x,y,w,d,'#fbf8f2','rx="30"') + rc(x,y,w,Math.min(90,d*.05),shade(c,.62),'rx="20"');
      const ph = Math.min(360,d*.18), py = y+150;
      if (w >= 1300){ const pw = (w-240)/2; s += rc(x+80,py,pw,ph,'#fff','rx="70"') + rc(x+160+pw,py,pw,ph,'#fff','rx="70"'); }
      else s += rc(x+80,py,w-160,ph,'#fff','rx="70"');
      const by = py+ph+110, bh = y+d-15-by;
      s += rc(x+15,by,w-30,bh,c,'rx="40"') + pa(`M${x+15} ${by+300}H${x+w-15}`,'none',DASH);
      s += pa(`M${x+w-15-Math.min(420,w*.3)} ${by}L${x+w-15} ${by}L${x+w-15} ${by+Math.min(420,w*.3)}Z`, shade(c,1.12));
      return s;
    }
    case 'sofa': case 'armchair': {
      const b = d*.24, a = Math.min(200,w*.13), n = t==='armchair' ? 1 : (w>2200 ? 3 : 2), cw = (w-2*a)/n, dk = shade(c,.85);
      let s = rc(x,y,w,d,dk,'rx="60"');
      for (let i=0;i<n;i++) s += rc(x+a+i*cw,y+b,cw,d-b-40,c,'rx="40"');
      return s + rc(x,y,w,b,dk,'rx="50"') + rc(x,y,a,d,dk,'rx="50"') + rc(x+w-a,y,a,d,dk,'rx="50"');
    }
    case 'cornersofa': {
      const k = Math.min(950,d*.56,w*.4), b = 220, dk = shade(c,.85);
      let s = pa(`M${x} ${y}H${x+w}V${y+k}H${x+k}V${y+d}H${x}Z`, dk);
      const cw = (w-b-200)/2;
      s += rc(x+b,y+b,cw,k-b-30,c,'rx="40"') + rc(x+b+cw,y+b,cw,k-b-30,c,'rx="40"') + rc(x+b,y+k,k-b-30,d-k-200,c,'rx="40"');
      return s + rc(x,y,w,b,dk,'rx="50"') + rc(x,y,b,d,dk,'rx="50"') + rc(x+w-200,y,200,k,dk,'rx="50"') + rc(x,y+d-200,k,200,dk,'rx="50"');
    }
    case 'nightstand': return rc(x,y,w,d,c,'rx="30"') + `<circle r="${m*.24}" fill="#fff6dd" ${ST}/>` + `<circle r="${m*.08}" fill="${shade(c,.8)}" ${ST}/>`;
    case 'wardrobe': {
      let s = rc(x,y,w,d,c) + ln(x+50,0,x+w-50,0);
      for (let hx = x+160; hx < x+w-100; hx += 180) s += ln(hx-45,-d*.28,hx+45,d*.28,'opacity=".6"');
      return s;
    }
    case 'cabinet': case 'shoecab': return rc(x,y,w,d,c) + ln(x,y+d,x+w,y);
    case 'dresser': return rc(x,y,w,d,c,'rx="20"') + rc(x+w*.2,y,w*.6,55,'#dfe9ee') + ec(0,d/2+180,160,140,shade(c,.9));
    case 'desk': return rc(x,y,w,d,c,'rx="20"') + rc(-w*.18,y+50,w*.36,45,'#555') + rc(-w*.14,y+d*.45,w*.28,d*.28,'#f4f4f4','rx="10"');
    case 'chair': return rc(x+25,y+d*.16,w-50,d*.84-10,c,'rx="60"') + rc(x,y,w,d*.2,shade(c,.78),'rx="40"');
    case 'bookshelf': { let s = rc(x,y,w,d,c); for (let bx = x+400; bx < x+w-50; bx += 400) s += ln(bx,y,bx,y+d); return s; }
    case 'baycushion': return rc(x,y,w,d,c,'rx="60"') + rc(x+60,y+80,w-120,Math.min(300,d*.2),'#fff','rx="60"') + rc(x+60,y+d-80-Math.min(300,d*.2),w-120,Math.min(300,d*.2),'#fff','rx="60"');
    case 'coffeetable': return rc(x,y,w,d,c,'rx="80"') + rc(x+60,y+60,w-120,d-120,shade(c,1.06),'rx="50"');
    case 'tvstand': return rc(x,y,w,d,c) + rc(x+w*.15,y+30,w*.7,55,'#3a3a3a');
    case 'rug': return rc(x,y,w,d,c,'rx="40" fill-opacity=".6"') + rc(x+90,y+90,w-180,d-180,'none','rx="30" stroke-dasharray="3 3" opacity=".6"');
    case 'plant': {
      let s = `<circle r="${m/2}" fill="${c}" fill-opacity=".85" ${ST}/>`;
      for (let k=0;k<8;k++) s += `<ellipse cx="0" cy="${-m*.27}" rx="${m*.1}" ry="${m*.21}" transform="rotate(${k*45})" fill="${shade(c,.8)}" ${ST}/>`;
      return s + `<circle r="${m*.1}" fill="#8a6a4a" ${ST}/>`;
    }
    case 'table': return rc(x,y,w,d,c,'rx="30"') + rc(x+50,y+50,w-100,d-100,'none','rx="20" opacity=".4"');
    case 'roundtable': return ec(0,0,w/2,d/2,c) + ec(0,0,w/2-50,d/2-50,'none','opacity=".4"');
    case 'counter': return rc(x,y,w,d,c) + ln(x,y+d-40,x+w,y+d-40,DASH);
    case 'stove': {
      let s = rc(x,y,w,d,'#2f2f2f','rx="20"'); const r = m*.26;
      const pts = w/d > 1.4 ? [[-w/4,0],[w/4,0]] : [[-w/4,-d/4],[w/4,-d/4],[-w/4,d/4],[w/4,d/4]];
      pts.forEach(([px,py]) => s += `<circle cx="${px}" cy="${py}" r="${r}" fill="none" stroke="#bbb" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="${px}" cy="${py}" r="${r*.45}" fill="#666"/>`);
      return s;
    }
    case 'ksink': return rc(x,y,w,d,c,'rx="20"') + rc(x+w*.06,y+d*.18,w*.42,d*.66,'#fff','rx="50"') + rc(x+w*.52,y+d*.18,w*.42,d*.66,'#fff','rx="50"') + `<circle cx="0" cy="${y+d*.09}" r="22" fill="#999"/>`;
    case 'fridge': return rc(x,y,w,d,c,'rx="30"') + ln(x,y+d*.14,x+w,y+d*.14) + ln(0,y+d*.14,0,y+d) + rc(-70,y+d*.5,40,d*.25,'#aab') + rc(30,y+d*.5,40,d*.25,'#aab');
    case 'toilet': return rc(x+w*.04,y,w*.92,d*.27,c,'rx="30"') + ec(0,y+d*.27+d*.36,w*.47,d*.36,c) + ec(0,y+d*.27+d*.4,w*.3,d*.24,'#eef4f7');
    case 'vanity': return rc(x,y,w,d,c,'rx="20"') + ec(0,y+d*.57,Math.min(w*.32,260),d*.28,'#fff') + `<circle cx="0" cy="${y+d*.17}" r="26" fill="#999"/>`;
    case 'shower': return rc(x,y,w,d,c) + ln(x,y,x+w,y+d,DASH) + ln(x+w,y,x,y+d,DASH) + `<circle r="45" fill="#fff" ${ST}/>`;
    case 'bathtub': return rc(x,y,w,d,c,'rx="40"') + rc(x+80,y+80,w-160,d-160,'#fff',`rx="${m*.33}"`) + `<circle cx="${x+w-260}" cy="0" r="35" fill="#ccc" ${ST}/>`;
    case 'washer': case 'dryer': return rc(x,y,w,d,c,'rx="30"') + rc(x,y,w,d*.14,shade(c,.9)) + `<circle cy="${d*.06}" r="${m*.34}" fill="#fff" ${ST}/><circle cy="${d*.06}" r="${m*.24}" fill="${t==='dryer'?'#e9dccb':'#cfdde4'}" ${ST}/>`;
    case 'crib': {
      let s = rc(x,y,w,d,c,'rx="20"') + rc(x+45,y+45,w-90,d-90,'#fff','rx="20"');
      for (let sx = x+90; sx < x+w-60; sx += 90) s += ln(sx,y,sx,y+45,'opacity=".5"') + ln(sx,y+d-45,sx,y+d,'opacity=".5"');
      return s;
    }
    case 'beanbag': return ec(0,0,w/2,d/2,c) + ec(-w*.04,-d*.06,w*.3,d*.28,shade(c,1.12),'opacity=".9"');
    case 'sidetable': return ec(0,0,w/2,d/2,c) + ec(0,0,w*.12,d*.12,'none','opacity=".5"');
    case 'floorlamp': return `<circle r="${m*.5}" fill="#fff6dd" fill-opacity=".85" ${ST}/>` + `<circle r="${m*.32}" fill="none" ${ST} ${DASH}/>` + `<circle r="${m*.07}" fill="${c}" ${ST}/>`;
    case 'island': return rc(x,y,w,d,c) + ln(x,y+d-250,x+w,y+d-250,DASH);
    case 'barstool': return `<circle r="${m/2}" fill="${c}" ${ST}/><circle r="${m*.3}" fill="${shade(c,1.15)}" ${ST}/>`;
    case 'waterheater': return rc(x,y,w,d,c,`rx="${d/2}" ${DASH}`) + ln(x+w*.2,0,x+w*.8,0,DASH);
    case 'tv': return rc(x,y,w,d,c,'rx="10"') + rc(x+w*.3,y+d,w*.4,Math.min(40,d),'#666');
    case 'aircon': return rc(x,y,w,d,c,'rx="30"') + ln(x+40,y+d*.72,x+w-40,y+d*.72) + ln(x+40,y+d*.86,x+w-40,y+d*.86);
    case 'acwall': {
      let s = rc(x,y,w,d,c,`rx="30" ${DASH}`);
      [.25,.5,.75].forEach(k => s += ln(x+w*k,y+d,x+w*k,y+d+200,`${DASH} opacity=".6"`));
      return s;
    }
    case 'dishwasher': return rc(x,y,w,d,c,'rx="15"') + ln(x,y+d-70,x+w,y+d-70) + rc(x+w*.3,y+d-45,w*.4,25,'#888');
    case 'ovencol': return rc(x,y,w,d,c) + ln(x,y,x+w,y+d) + ln(x+w,y,x,y+d);
    case 'purifier': return rc(x,y,w,d,c,'rx="60"') + rc(x+45,y+45,w-90,d-90,'none',`rx="40" ${DASH}`);
    case 'officechair': {
      let s = '';
      for (let k = 0; k < 5; k++) s += `<line x1="0" y1="0" x2="0" y2="${m*.48}" transform="rotate(${k*72+36})" stroke="#555" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
      return s + rc(x+w*.12,y+d*.22,w*.76,d*.66,c,'rx="80"') + rc(x+w*.15,y+d*.04,w*.7,d*.16,shade(c,.78),'rx="40"')
        + rc(x+w*.02,y+d*.3,w*.1,d*.45,shade(c,.7),'rx="30"') + rc(x+w*.88,y+d*.3,w*.1,d*.45,shade(c,.7),'rx="30"');
    }
    case 'piano': {
      let s = rc(x,y,w,d*.55,c,'rx="10"') + rc(x+40,y+d*.55,w-80,d*.4,shade(c,1.4),'rx="10"');
      const kx = x+90, kw = w-180, kd = d*.2;
      s += rc(kx,y+d*.55,kw,kd,'#faf8f3');
      for (let i = 1; i < 26; i++) s += ln(kx+kw*i/26,y+d*.55,kx+kw*i/26,y+d*.55+kd,'opacity=".5"');
      return s;
    }
    case 'treadmill': return rc(x,y,w,d,c,'rx="50"') + rc(x+90,y+320,w-180,d-400,'#1c1c1e','rx="25"') + rc(x,y,w,230,shade(c,1.4),'rx="40"');
    default: return rc(x,y,w,d,c);
  }
}

/* ======================= Piirto ======================= */
const NOLABEL = ['plant','floorlamp','sidetable','barstool','beanbag'];
function renderRooms(){
  let s = '';
  ROOMS.forEach(r => s += `<polygon class="room" data-room="${esc(r.id)}" points="${r.poly.map(p=>p.join(',')).join(' ')}" fill="url(#m-${state.rooms[r.id].mat})"/>`);
  OPENINGS.filter(o=>o.kind==='door'||o.kind==='sliding_door').forEach(o=>s+=`<polygon points="${o.polygon.map(p=>p.join(',')).join(' ')}" fill="#e2dacb" stroke="#b9b0a0" stroke-width="1" vector-effect="non-scaling-stroke" pointer-events="none"/>`);
  $('#gRooms').innerHTML = s;
}

function renderFurn(){
  const g = $('#gFurn');
  g.setAttribute('display', ui.layers.furn ? 'inline' : 'none');
  const furniture = state.furniture.map(f => {
    const fs0 = Math.max(80, Math.min(170, Math.min(f.w,f.d)*.2));
    const lab = LANG === 'en' ? nm(f.name) : (Object.hasOwn(SHORT_FI,f.name) ? SHORT_FI[f.name] : f.name);
    const fs = Math.max(60, Math.min(fs0, aabb(f).hw*2 / (lab.length*.55)));   // pitkä teksti pienennetään mahtumaan
    const label = Math.min(f.w,f.d) >= 380 && !NOLABEL.includes(f.type)
      ? `<text transform="rotate(${-f.rot})" font-size="${fs}" text-anchor="middle" dominant-baseline="central" fill="#4a443c" opacity=".8" pointer-events="none">${esc(lab)}</text>` : '';
    return `<g class="furn" data-fid="${esc(f.id)}" transform="translate(${f.cx} ${f.cy}) rotate(${f.rot})">${furnSVG(f.type,f.w,f.d,f.color)}${label}</g>`;
  }).join('');
  const types = {wc:'toilet',sink:'vanity',stove:'stove',cabinet:'cabinet',shower:'shower',bathtub:'bathtub',grab_bar:'cabinet'};
  const fixtureColor = id => MARKS.added.has(id) ? '#efb1a8' : MARKS.modified.has(id) ? '#f3d6a8' : '#d8d1c5';
  const fixtures = FIXTURES.map(f => `<g data-fixture="${esc(f.id)}" transform="translate(${f.x} ${f.y}) rotate(${f.rotation_deg})">${furnSVG(types[f.kind] || 'cabinet',f.width,f.depth,fixtureColor(f.id))}</g>`).join('');
  g.innerHTML = furniture + fixtures;
}

function renderWalls(){
  const removed = demolishedIds(), walls = [...WALLS, ...PLAN.demolishedWalls];
  $('#gWalls').innerHTML = walls.map(w => {
    const dem = removed.has(w.id), kind = w.kind;
    const fill = dem ? 'rgba(232,197,71,.38)' : MARKS.added.has(w.id) ? '#c9443a' : kind === 'load_bearing' ? (ui.layers.bearing ? '#b8412c' : '#26241f') : kind === 'external' || kind === 'party' ? '#8f897d' : w.height ? '#e9e3d8' : '#a7a195';
    const ex = dem ? 'stroke="#a8861c" stroke-width="1.2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"' : w.height ? 'stroke="#8f897d" stroke-width="1" vector-effect="non-scaling-stroke"' : '';
    const parts = dem ? [w.polygon] : w.segments.map(s => s.polygon);
    return parts.map((poly, i) => `<polygon class="wall" data-wall="${esc(w.id)}" data-wall-part="${i}" data-kind="${esc(kind)}" points="${poly.map(p=>p.join(',')).join(' ')}" fill="${fill}" ${ex}/>`).join('');
  }).join('');
}

function renderOpenings(){
  const WS = 'stroke="#4f7394" stroke-width="1" vector-effect="non-scaling-stroke"';
  let s = '';
  OPENINGS.filter(o => o.kind === 'window' || o.kind === 'opening').forEach(o => {
    const [a,b] = o.a, [c,d] = o.b, dx=c-a, dy=d-b, n=Math.hypot(dx,dy)||1;
    s += `<polygon data-opening="${esc(o.id)}" points="${o.polygon.map(p=>p.join(',')).join(' ')}" fill="${o.kind==='window'?'#f7fbfd':'transparent'}" ${o.kind==='window'?WS:'pointer-events="none"'}/>`;
    if(o.kind==='window') [1/3,2/3].forEach(t => { const off=(t-.5)*o.thickness, ox=-dy/n*off, oy=dx/n*off; s += `<line x1="${a+ox}" y1="${b+oy}" x2="${c+ox}" y2="${d+oy}" ${WS}/>`; });
  });
  const DS = 'stroke="#3d3a34" stroke-width="1" vector-effect="non-scaling-stroke"';
  OPENINGS.filter(o => o.kind !== 'window').forEach(o => {
    const [ax,ay] = o.a, [bx,by] = o.b, L = o.width, [hx,hy] = o.h || o.a;
    const col = o.entry ? '#b5653a' : '#3d3a34';
    if (o.kind === 'sliding_door') {
      const dx=(bx-ax)/(L||1),dy=(by-ay)/(L||1), nx=Math.abs(dy)>Math.abs(dx)?dy:-dy,ny=Math.abs(dy)>Math.abs(dx)?-dx:dx, plen=L*.55, off=25;
      const panel=(start,sign)=>{const x0=ax+dx*start+nx*(off*sign-20),y0=ay+dy*start+ny*(off*sign-20),x1=x0+dx*plen,y1=y0+dy*plen;return `<polygon data-opening="${esc(o.id)}" points="${x0},${y0} ${x1},${y1} ${x1+nx*40},${y1+ny*40} ${x0+nx*40},${y0+ny*40}" fill="#fff" ${DS}/>`;};
      s += panel(0,-1)+panel(L-plen,1);
    } else if (o.kind === 'door') {
      const dx=(bx-ax)/(L||1),dy=(by-ay)/(L||1), [cx,cy]=o.c || [dx,dy];
      const swing=o.o || (o.swing==='right' ? [dy,-dx] : [-dy,dx]), [ox,oy]=swing;
      const sweep=ox*cy-oy*cx>0?1:0;
      const endx=hx+cx*L, endy=hy+cy*L, openx=hx+ox*L, openy=hy+oy*L;
      const tx=cx*Math.max(25,o.thickness*.16),ty=cy*Math.max(25,o.thickness*.16);
      s += `<polygon data-opening="${esc(o.id)}" points="${hx},${hy} ${openx},${openy} ${openx+tx},${openy+ty} ${hx+tx},${hy+ty}" fill="#fff" stroke="${col}" stroke-width="${o.entry?1.8:1}" vector-effect="non-scaling-stroke"/><path d="M${openx} ${openy}A${L} ${L} 0 0 ${sweep} ${endx} ${endy}" fill="none" ${DS} stroke-dasharray="5 3" opacity=".7"/>`;
    }
    if (o.entry) s += `<path d="M${ax} ${ay}L${bx} ${by}" fill="none" stroke="#b5653a" stroke-width="2" vector-effect="non-scaling-stroke"/><text x="${ax}" y="${ay-120}" font-size="180" fill="#b5653a">${tr('Sisäänkäynti','Entry')}</text>`;
  });
  OPENINGS.filter(o => MARKS.modified.has(o.id)).forEach(o => s += `<polygon points="${o.polygon.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#c9443a" stroke-width="2.5" vector-effect="non-scaling-stroke" pointer-events="none"/>`);
  $('#gOpen').innerHTML = s;
}

function renderLabels(){
  const g = $('#gLabels');
  g.setAttribute('display', ui.layers.labels ? 'inline' : 'none');
  g.innerHTML = ROOMS.filter(r => r.at).map(r => {
    const [x,y] = r.at, halo = 'stroke="#fbf9f4" stroke-width="45" paint-order="stroke" stroke-linejoin="round"';
    return `<text x="${x}" y="${y}" font-size="250" font-weight="600" text-anchor="middle" fill="#2b2824" ${halo}>${esc(nm(state.rooms[r.id].name))}</text>
      <text x="${x}" y="${y+260}" font-size="175" text-anchor="middle" fill="#7d7366" ${halo}>${fmt(area(r.poly))} m²</text>`;
  }).join('');
}

function renderDims(){
  $('#gDims').setAttribute('display', isDefaultUnit() ? 'inline' : 'none');
  const DC = '#7d7160', LS = `stroke="${DC}" stroke-width="1" vector-effect="non-scaling-stroke"`, TK = `stroke="${DC}" stroke-width="2" vector-effect="non-scaling-stroke"`;
  const txt = (x,y,v,rot) => `<text x="${x}" y="${y}" font-size="${v<400?140:200}" text-anchor="middle" fill="${DC}" ${rot?`transform="rotate(-90 ${x} ${y})"`:''}>${v}</text>`;
  const chain = (horiz, at, start, segs) => {
    const pts = [start]; segs.forEach(v => pts.push(pts[pts.length-1]+v));
    let s = horiz ? `<line x1="${pts[0]}" y1="${at}" x2="${pts.at(-1)}" y2="${at}" ${LS}/>` : `<line x1="${at}" y1="${pts[0]}" x2="${at}" y2="${pts.at(-1)}" ${LS}/>`;
    pts.forEach(p => s += horiz
      ? `<line x1="${p}" y1="${at-170}" x2="${p}" y2="${at+170}" ${LS}/><line x1="${p-80}" y1="${at+80}" x2="${p+80}" y2="${at-80}" ${TK}/>`
      : `<line x1="${at-170}" y1="${p}" x2="${at+170}" y2="${p}" ${LS}/><line x1="${at-80}" y1="${p+80}" x2="${at+80}" y2="${p-80}" ${TK}/>`);
    segs.forEach((v,i) => { const mid = (pts[i]+pts[i+1])/2; s += horiz ? txt(mid, at-70, v) : txt(at-70, mid, v, true); });
    return s;
  };
  const g = $('#gDims');
  g.innerHTML =
    chain(true,-750,0,[1580,240,2760,240,1540,240,3670]) + chain(true,-1250,0,[10270]) +
    chain(true,11350,0,[2180,240,2160,240,5450,240,1340]) + chain(true,11850,0,[11850]) +
    chain(false,-800,0,[3370,1580,240,2770,240,2360]) + chain(false,-1300,0,[10560]) +
    chain(false,12750,0,[3370,240,2760,240,3950]) + chain(false,13250,0,[10560]);
  g.setAttribute('display', isDefaultUnit() && ui.layers.dims ? 'inline' : 'none');
}

function renderGrid(){
  $('#gGrid').innerHTML = `<rect x="-20000" y="-20000" width="55000" height="55000" fill="${ui.layers.grid ? 'url(#grid)' : 'transparent'}" data-bg="1"/>`;
}

function renderMeasure(){
  const k = 1/view.s, fs = 12*k;
  const one = (a,b,tmp) => {
    const L = Math.hypot(b.x-a.x, b.y-a.y); if (L < 1) return '';
    let ang = Math.atan2(b.y-a.y, b.x-a.x)*180/Math.PI; if (ang > 90 || ang < -90) ang += 180;
    const mx = (a.x+b.x)/2, my = (a.y+b.y)/2, nx = -(b.y-a.y)/L*5*k, ny = (b.x-a.x)/L*5*k;
    const col = tmp ? '#2f5d62' : '#b5653a', S = `stroke="${col}" stroke-width="1.5" vector-effect="non-scaling-stroke"`;
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" ${S}/>
      <line x1="${a.x-nx}" y1="${a.y-ny}" x2="${a.x+nx}" y2="${a.y+ny}" ${S}/><line x1="${b.x-nx}" y1="${b.y-ny}" x2="${b.x+nx}" y2="${b.y+ny}" ${S}/>
      <text x="${mx}" y="${my-5*k}" font-size="${fs}" text-anchor="middle" fill="${col}" font-weight="600" transform="rotate(${ang} ${mx} ${my})"
        stroke="#fff" stroke-width="${3.5*k}" paint-order="stroke">${Math.round(L)} mm</text>`;
  };
  let s = state.measures.map(m => one(m.a,m.b)).join('');
  if (ui.mA && ui.mCur) s += one(ui.mA, ui.mCur, true);
  if (ui.mA) s += `<circle cx="${ui.mA.x}" cy="${ui.mA.y}" r="${3*k}" fill="#2f5d62"/>`;
  s += routeSvg(k);
  if (ui.tool === 'wall' && ui.wA){
    const a = ui.wA, b = ui.wCur || a, L = Math.hypot(b.x-a.x, b.y-a.y), t = ui.newWall.thickness/2;
    if (L >= 1){
      const nx = -(b.y-a.y)/L*t, ny = (b.x-a.x)/L*t;
      s += `<polygon data-role="wallPreview" points="${a.x+nx},${a.y+ny} ${b.x+nx},${b.y+ny} ${b.x-nx},${b.y-ny} ${a.x-nx},${a.y-ny}" fill="rgba(201,68,58,.45)" stroke="#c9443a" stroke-width="1" vector-effect="non-scaling-stroke"/>` + one(a, b, true);
    }
    s += `<circle cx="${a.x}" cy="${a.y}" r="${4*k}" fill="#c9443a"/>`;
  }
  $('#gMeasure').innerHTML = s;
}

function renderSel(){
  const k = 1/view.s; let s = '';
  if (ui.sel?.kind === 'furn'){
    const f = getF(ui.sel.id);
    if (f){
      // kosketusnäytöllä kahvat ovat suurempia ja kauempana kalusteesta, kullakin läpinäkyvä suuri kosketusalue
      const p = 5*k, A = 'stroke="#b5653a" vector-effect="non-scaling-stroke"', hs = COARSE ? 1.7 : 1, ro = (COARSE ? 40 : 26)*k, hit = (COARSE ? 24 : 11)*k;
      const sx = f.w/2+p, sy = f.d/2+p;
      s += `<g transform="translate(${f.cx} ${f.cy}) rotate(${f.rot})">
        <rect x="${-f.w/2-p}" y="${-f.d/2-p}" width="${f.w+2*p}" height="${f.d+2*p}" fill="none" ${A} stroke-width="1.5" stroke-dasharray="5 3" pointer-events="none"/>
        <line x1="0" y1="${-f.d/2-p}" x2="0" y2="${-f.d/2-ro}" ${A} stroke-width="1" pointer-events="none"/>
        <circle data-handle="rot" cx="0" cy="${-f.d/2-ro}" r="${hit}" fill="transparent"/>
        <circle data-handle="rot" cx="0" cy="${-f.d/2-ro}" r="${6*hs*k}" fill="#fff" ${A} stroke-width="1.5"><title>${tr('Käännä vetämällä (Shift = vapaa kulma)','Drag to rotate (Shift for free angle)')}</title></circle>
        <circle data-handle="size" cx="${sx}" cy="${sy}" r="${hit}" fill="transparent"/>
        <rect data-handle="size" x="${sx-5*hs*k}" y="${sy-5*hs*k}" width="${10*hs*k}" height="${10*hs*k}" fill="#b5653a"><title>${tr('Muuta kokoa vetämällä','Drag to resize')}</title></rect></g>`;
      const {hh} = aabb(f);
      s += `<text x="${f.cx}" y="${f.cy+hh+24*k}" font-size="${12*k}" text-anchor="middle" fill="#b5653a" font-weight="600" pointer-events="none"
        stroke="#fff" stroke-width="${3*k}" paint-order="stroke">${f.w} × ${f.d}</text>`;
    }
  } else if (ui.sel?.kind === 'wall' || ui.sel?.kind === 'opening'){
    const el = ui.sel.kind === 'wall' ? [...WALLS, ...PLAN.demolishedWalls].find(w => w.id === ui.sel.id) : OPENINGS.find(o => o.id === ui.sel.id);
    if (el) s += `<polygon points="${el.polygon.map(p=>p.join(',')).join(' ')}" fill="rgba(181,101,58,.18)" stroke="#b5653a" stroke-width="2.5" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  } else if (ui.sel?.kind === 'room'){
    const r = ROOMS.find(r => r.id === ui.sel.id), c = elementFindings('room', ui.sel.id).find(f => f.circle)?.circle;
    if (c && c.d > 0) s += `<g data-role="freeCircle" pointer-events="none"><circle cx="${c.x}" cy="${-c.y}" r="${c.d/2}" fill="rgba(47,93,98,.08)" stroke="#2f5d62" stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>
      <text x="${c.x}" y="${-c.y + c.d/2 - 14*k}" font-size="${12*k}" text-anchor="middle" dominant-baseline="central" fill="#2f5d62" font-weight="600" stroke="#fff" stroke-width="${3*k}" paint-order="stroke">Ø ${c.d} mm</text></g>`;
    if (r) s += `<polygon points="${r.poly.map(p=>p.join(',')).join(' ')}" fill="rgba(181,101,58,.08)" stroke="#b5653a" stroke-width="2" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  }
  $('#gSel').innerHTML = s;
}

function renderAll(){
  validateSel();
  if (ui.route?.goal){ const key = JSON.stringify([state.unit, state.furniture]); if (key !== ui.route.key){ ui.route.key = key; solveRoute(); } }
  renderGrid(); renderRooms(); renderFurn(); renderWalls(); renderOpenings(); renderDims(); renderLabels(); renderMeasure(); renderSel(); renderPanel(); updateHeader();
  backgroundUI.render();
  window.View3D?.sync();
}

function updateHeader(){
  const tot = ROOMS.filter(r => r.counted !== false).reduce((a,r) => a + area(r.poly), 0);
  $('#subtitle').textContent = isDefaultUnit()
    ? tr(`Nettopinta-ala noin ${fmt(tot)} m² · Mitat mm · Alkuperäinen mittakaava 1:60`, `Net floor area ≈ ${fmt(tot)} m² · Units: mm · Original scale 1:60`)
    : tr(`Nettopinta-ala noin ${fmt(tot)} m² · Mitat mm`, `Net floor area ≈ ${fmt(tot)} m² · Units: mm`);
  $('#undo').disabled = !undoStack.length; $('#redo').disabled = !redoStack.length;
  $('#undo').style.opacity = undoStack.length ? 1 : .4; $('#redo').style.opacity = redoStack.length ? 1 : .4;
}

/* ======================= Oikea paneeli ======================= */
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function renderPanel(){
  renderFab();
  const p = $('#panel');
  if (ui.sel?.kind === 'furn'){ const f = getF(ui.sel.id); if (f){ p.innerHTML = furnPanel(f); bindFurnPanel(f); return; } }
  if (ui.sel?.kind === 'room' && ROOMS.some(r => r.id === ui.sel.id)){ p.innerHTML = roomPanel(ROOMS.find(r => r.id === ui.sel.id)); bindRoomPanel(); return; }
  const element = {wall:wallPanel, opening:openingPanel, fixture:fixturePanel}[ui.sel?.kind];
  if (element){ const html = element(ui.sel.id); if (html){ p.innerHTML = html; bindElementPanel(ui.sel); return; } }
  p.innerHTML = overviewPanel(); bindOverview();
}

function overviewPanel(){
  const rows = ROOMS.map(r => {
    const st = state.rooms[r.id];
    return `<tr class="click" data-room="${esc(r.id)}"><td><span class="sw" style="background:${MATS[st.mat].sw}"></span>${esc(nm(st.name))}${r.counted===false?' <span class="muted">*</span>':''}</td>
      <td class="r">${fmt(area(r.poly))} m²</td></tr>`;
  }).join('');
  const tot = ROOMS.filter(r => r.counted !== false).reduce((a,r) => a + area(r.poly), 0);
  const byMat = {};
  ROOMS.forEach(r => { const m = state.rooms[r.id].mat; byMat[m] = (byMat[m]||0) + area(r.poly); });
  let cost = 0;
  const matRows = Object.entries(byMat).map(([m,a]) => { const c = a*MATS[m].price*1.05; cost += c;
    return `<tr><td><span class="sw" style="background:${MATS[m].sw}"></span>${nm(MATS[m].name)}</td><td class="r">${fmt(a,1)} m²</td><td class="r">${Math.round(c).toLocaleString('fi-FI')} €</td></tr>`; }).join('');
  const removed = demolishedIds(), dem = PLAN.demolishedWalls.filter(w => removed.has(w.id));
  const demLen = dem.reduce((a,w) => a + Math.hypot(w.b[0]-w.a[0], w.b[1]-w.a[1]), 0) / 1000;
  return `${toolSection()}${changesSection()}${noticesSection()}${paramsSection()}
  <section><h3>${tr('Huoneiden pinta-alat','Room Areas')} <small>${tr('Napsauta nähdäksesi / vaihtaaksesi lattian','Click to view / change flooring')}</small></h3>
    <table>${rows}</table>
    <div class="total"><span>${tr('Nettopinta-ala','Net floor area')}</span><b>${fmt(tot)} m²</b></div>
    <div class="muted" style="font-size:11px;margin-top:4px">${tr('* Erkkereitä ei lasketa käyttöpinta-alaan; alat lasketaan seinien sisämitoista','* Bay windows are excluded; areas use net inner wall dimensions')}</div></section>
  <section><h3>${tr('Lattiamateriaalien arvio','Flooring Estimate')} <small>${tr('sis. 5 % hukka','incl. 5% waste')}</small></h3>
    <table>${matRows}</table>
    <div class="total"><span>${tr('Lattiamateriaalit yhteensä','Flooring total')}</span><b>${Math.round(cost).toLocaleString('fi-FI')} €</b></div></section>
  <section><h3>${tr('Suunnitelman tilastot','Plan Stats')}</h3>
    <div class="stats"><div><small>${tr('Kalusteita','Furniture')}</small><span class="big">${state.furniture.length}</span></div>
      <div><small>${tr('Puretut seinät','Walls removed')}</small><span class="big">${fmt(demLen,1)}</span> m</div></div>
    <div class="actions"><button class="btn" id="clearMeasure">${tr('Poista mittaukset','Clear measures')} (${state.measures.length})</button>
      <button class="btn danger" id="clearFurn">${tr('Tyhjennä sisustus','Clear layout')}</button></div></section>
  ${COARSE ? tr(`<section><h3>Kosketusohjaus</h3><div class="kbd">
    <kbd>Yksi sormi</kbd><span>Panoroi vetämällä tyhjästä kohdasta</span><kbd>Kaksi sormea</kbd><span>Nipistä zoomataksesi, vedä panoroidaksesi</span>
    <kbd>Kirjasto</kbd><span>Napauta lisätäksesi keskelle tai vedä oikealle haluamaasi kohtaan</span>
    <kbd>Napauta kalustetta</kbd><span>Valitse ja vedä siirtääksesi; käännä yläpisteestä, muuta kokoa oikean alakulman neliöstä</span>
    <kbd>Työkalupalkki</kbd><span>Valinnan jälkeen alareunassa: kierrä / kopioi / poista</span>
    <kbd>Mittaus</kbd><span>Vedä viiva tai napauta kaksi pistettä</span>
    <kbd>3D-kävely</kbd><span>Vasemman alakulman sauva liikuttaa, vedä kääntääksesi katsetta, napauta ovea avataksesi</span>
  </div></section>`, `<section><h3>Touch Controls</h3><div class="kbd">
    <kbd>1-finger drag</kbd><span>Pan on empty space</span><kbd>2 fingers</kbd><span>Pinch to zoom, drag to pan</span>
    <kbd>Library</kbd><span>Tap to place at center, or hold and drag right to a spot</span>
    <kbd>Tap item</kbd><span>Drag to move; top dot rotates, bottom-right square resizes</span>
    <kbd>Toolbar</kbd><span>Bottom bar can rotate / duplicate / delete</span>
    <kbd>Measure</kbd><span>Hold and drag a line, or tap two points</span>
    <kbd>3D walk</kbd><span>Joystick moves, drag to look, tap doors to open</span>
  </div></section>`) : ''}
  ${tr(`<section><h3>Pikanäppäimet</h3><div class="kbd">
    <kbd>Vedä</kbd><span>Vedä kaluste vasemmalta pohjapiirrokseen</span><kbd>V</kbd><span>Valitse / siirrä</span><kbd>M</kbd><span>Mittaa (Shift = vaaka/pysty)</span>
    <kbd>X</kbd><span>Pura ei-kantavia seiniä (mustat ovat kantavia)</span><kbd>R</kbd><span>Kierrä 90° (Shift = vastakkaiseen suuntaan)</span><kbd>Nuolet</kbd><span>Hienosäätö 10 mm (Shift 100 mm)</span>
    <kbd>⌘/Ctrl D</kbd><span>Kopioi</span><kbd>Delete</kbd><span>Poista</span><kbd>⌘/Ctrl Z</kbd><span>Kumoa</span><kbd>T</kbd><span>Vaihda 2D / 3D</span><kbd>F</kbd><span>Sovita ikkunaan</span><kbd>Esc</kbd><span>Poista valinta</span>
  </div></section>`, `<section><h3>Keyboard Shortcuts</h3><div class="kbd">
    <kbd>Drag</kbd><span>Drag furniture onto the plan</span><kbd>V</kbd><span>Select / move</span><kbd>M</kbd><span>Measure (Shift: horizontal/vertical)</span>
    <kbd>X</kbd><span>Demolish non-bearing walls (black = bearing)</span><kbd>R</kbd><span>Rotate 90° (Shift reverses)</span><kbd>Arrows</kbd><span>Nudge 10mm (Shift 100mm)</span>
    <kbd>⌘/Ctrl D</kbd><span>Duplicate</span><kbd>Delete</kbd><span>Delete</span><kbd>⌘/Ctrl Z</kbd><span>Undo</span><kbd>T</kbd><span>Toggle 2D / 3D</span><kbd>F</kbd><span>Fit to window</span><kbd>Esc</kbd><span>Deselect</span>
  </div></section>`)}`;
}
/* ======================= Muutoskerroksen paneelit ======================= */
const STATUS = {measured:['mitattu','measured'], inferred:['päätelty','inferred'], assumed:['oletus','assumed']};
const METHOD = {laser:['laser','laser'], tape:['mittanauha','tape'], lidar_scan:['LiDAR','LiDAR'], video:['video','video'],
  archive_drawing:['piirustus','drawing'], registry:['rekisteri','registry'], derived:['laskettu','derived'], assumption:['suunnitelma','design']};
const prov = m => m ? `${Math.round(m.value_mm)} mm <span class="prov prov-${esc(m.status)}">${tr(...STATUS[m.status])} · ${tr(...(METHOD[m.method] || [m.method, m.method]))}</span>` : '–';
const WALL_KIND = {load_bearing:['Kantava','Load-bearing'], partition:['Väliseinä','Partition'], external:['Ulkoseinä','External'], party:['Huoneistojen välinen','Party wall']};
const OPENING_KIND = {door:['Ovi','Door'], sliding_door:['Liukuovi','Sliding door'], window:['Ikkuna','Window'], opening:['Aukko','Opening']};
const FIXTURE_KIND = {wc:['WC-istuin','WC'], sink:['Pesuallas','Sink'], shower:['Suihku','Shower'], bathtub:['Kylpyamme','Bathtub'], stove:['Liesi','Stove'], cabinet:['Kaappi','Cabinet'], grab_bar:['Tukikahva','Grab bar']};
const changeIndexes = test => (state.unit.changes ?? []).map((c, i) => test(c) ? i : -1).filter(i => i >= 0);
const elementState = id => MARKS.added.has(id) ? tr('Uusi (muutos)','New (change)') : MARKS.modified.has(id) ? tr('Muutettu','Changed') : tr('Nykytila','Existing');
function changeLabel(c){
  const room = id => esc(nm(state.rooms[id]?.name ?? id));
  switch (c.op){
    case 'demolish_wall': return tr(`Pura seinä ${esc(c.target)}`, `Demolish wall ${esc(c.target)}`);
    case 'add_wall': return tr(`Uusi seinä ${esc(c.wall.id)}`, `New wall ${esc(c.wall.id)}`);
    case 'modify_opening': return tr(`Muuta aukkoa ${esc(c.target)}`, `Change opening ${esc(c.target)}`) + (c.set.clear_width ? ` · ${Math.round(c.set.clear_width.value_mm)} mm` : c.set.width ? ` · ${Math.round(c.set.width.value_mm)} mm` : '');
    case 'remove_threshold': return tr(`Poista kynnys ${esc(c.target)}`, `Remove threshold ${esc(c.target)}`);
    case 'add_fixture': return tr(`Lisää ${tr(...FIXTURE_KIND[c.fixture.kind])} ${esc(c.fixture.id)}`, `Add ${tr(...FIXTURE_KIND[c.fixture.kind])} ${esc(c.fixture.id)}`);
    case 'replace_fixture': return tr(`Vaihda kiintokaluste ${esc(c.target)}`, `Replace fixture ${esc(c.target)}`);
    case 'change_finish': return tr(`Lattia ${room(c.room)}: ${esc(nm(MATS[c.floor]?.name ?? c.floor ?? ''))}`, `Floor ${room(c.room)}: ${esc(nm(MATS[c.floor]?.name ?? c.floor ?? ''))}`);
  }
  return esc(c.op);
}
/* Advisory rules (rules/rules-v1.json): they appear when a change or the selection touches them and never block. */
const SEVERITY = {ilmoitus:['Ilmoitus','Notice'], tarkista:['Tarkista','Check'], suositus:['Suositus','Recommendation'], info:['Tietoa','Info']};
const elementFindings = (kind, id) => FINDINGS.filter(f => f.element?.kind === kind && f.element.id === id);
function findingItem(f, selectable){
  const lang = LANG === 'en' ? 'en' : 'fi', badge = f.ok && f.element ? `<span class="rule-badge ok">✓ ${tr('täyttyy','met')}</span>` : `<span class="rule-badge ${f.severity}">${tr(...SEVERITY[f.severity])}</span>`;
  const target = selectable && f.element && f.element.kind !== 'threshold' ? ` data-rule-sel="${esc(f.element.kind)}:${esc(f.element.id)}"` : '';
  return `<li class="rule${f.ok && f.element ? ' rule-ok' : ''}" data-rule="${esc(f.rule)}"${target}>${badge} <b>${esc(f.title[lang])}</b>
    <div>${esc(f.message[lang])}</div>
    <a href="${esc(f.source.url)}" target="_blank" rel="noopener noreferrer">${esc(f.source.label)} ${esc(f.source.section)}</a></li>`;
}
function rulesSection(findings, heading = tr('Säännöt ja suositukset','Rules and recommendations')){
  if (!findings.length) return '';
  return `<section class="rules"><h3>${heading} <small>${tr('ohjeellinen, ei estä muokkausta','advisory, never blocks editing')}</small></h3><ul>${findings.map(f => findingItem(f, false)).join('')}</ul></section>`;
}
function noticesSection(){
  const profiles = state.unit.profiles ?? [], on = profiles.includes('esteettomyys');
  const shown = window.UnitModel.rules.surfaced(FINDINGS, profiles);
  return `<section class="rules" id="noticeList"><h3>${tr('Huomiot','Notices')} <small>${tr('näkyvät, kun muutos koskee niitä','shown when a change touches them')}</small></h3>
    ${shown.length ? `<ul>${shown.map(f => findingItem(f, true)).join('')}</ul>` : `<p class="muted">${tr('Ei huomioita. Säännöt tulevat näkyviin, kun muutos tai valinta koskee niitä.','No notices. Rules appear when a change or selection touches them.')}</p>`}
    <label class="rule-profile"><input type="checkbox" id="profileAccess" ${on ? 'checked' : ''}> ${tr('Näytä kaikki esteettömyyssuositukset','Show all accessibility recommendations')}</label></section>`;
}
function bindRules(){
  document.querySelectorAll('#panel [data-rule-sel]').forEach(li => li.onclick = e => {
    if (e.target.closest('a')) return;
    const [kind, ...rest] = li.dataset.ruleSel.split(':'); select({kind, id:rest.join(':')});
  });
  if ($('#profileAccess')) $('#profileAccess').onchange = e => editUnit(u => EDIT().setProfile(u, 'esteettomyys', e.target.checked));
}

function changesSection(){
  const changes = state.unit.changes ?? [];
  const rows = changes.map((c, i) => `<tr><td>${i + 1}. ${changeLabel(c)}</td><td class="r"><button class="btn" data-revert="${i}" title="${tr('Peru tämä muutos','Revert this change')}">${tr('Peru','Revert')}</button></td></tr>`).join('');
  return `<section id="changeList"><h3>${tr('Muutokset','Changes')} <small>${tr(`${changes.length} kpl · nykytila säilyy`, `${changes.length} · survey stays unchanged`)}</small></h3>
    <table>${rows || `<tr><td class="muted">${tr('Ei muutoksia. Valitse seinä, aukko tai kiintokaluste 2D- tai 3D-näkymästä.','No changes. Select a wall, opening or fixture in 2D or 3D.')}</td></tr>`}</table></section>`;
}
function wallPanel(id){
  const live = WALLS.find(w => w.id === id), w = live || PLAN.demolishedWalls.find(w => w.id === id);
  if (!w) return null;
  const src = (live ? TARGET.walls : state.unit.baseline.walls).find(x => x.id === id), added = MARKS.added.has(id);
  const locked = w.kind === 'load_bearing' || w.kind === 'external' || w.kind === 'party';
  const action = !live ? `<button class="btn primary" data-edit="restoreWall">${tr('Palauta seinä','Restore wall')}</button>`
    : added ? `<button class="btn danger" data-edit="removeNew">${tr('Poista uusi seinä','Remove new wall')}</button>`
    : `<button class="btn danger" data-edit="demolishWall" ${locked ? 'disabled' : ''}>${tr('Merkitse purettavaksi','Mark for demolition')}</button>`;
  return `<section><h3>${tr('Seinä','Wall')} <small>${esc(id)}</small></h3>
    <table><tr><td>${tr('Tila','State')}</td><td class="r">${live ? elementState(id) : tr('Purettava','To be demolished')}</td></tr>
      <tr><td>${tr('Tyyppi','Type')}</td><td class="r">${tr(...WALL_KIND[w.kind])}</td></tr>
      <tr><td>${tr('Pituus','Length')}</td><td class="r">${Math.round(Math.hypot(w.b[0]-w.a[0], w.b[1]-w.a[1]))} mm</td></tr>
      <tr><td>${tr('Paksuus','Thickness')}</td><td class="r">${prov(src?.thickness)}</td></tr></table>
    ${live && !added && locked ? `<p class="muted">${w.kind === 'load_bearing' ? tr('Kantavan seinän muutos vaatii rakennesuunnittelijan.','Changing a load-bearing wall needs a structural engineer.') : tr('Ulko- ja huoneistojen välisiä seiniä ei pureta tässä työkalussa.','External and party walls are not demolished in this tool.')}</p>` : ''}
    <div class="actions">${action}<button class="btn" data-edit="back">${tr('← Takaisin','← Back')}</button></div></section>
    ${rulesSection(elementFindings('wall', id))}`;
}
function openingPanel(id){
  const o = OPENINGS.find(o => o.id === id), src = TARGET.openings?.find(x => x.id === id);
  if (!o || !src) return null;
  const thresholds = (TARGET.thresholds ?? []).filter(t => t.at_opening === id), modified = changeIndexes(c => c.op === 'modify_opening' && c.target === id);
  return `<section><h3>${tr(...OPENING_KIND[o.kind])} <small>${esc(id)}</small></h3>
    <table><tr><td>${tr('Tila','State')}</td><td class="r">${elementState(id)}</td></tr>
      <tr><td>${tr('Karmiaukko','Frame opening')}</td><td class="r">${prov(src.width)}</td></tr>
      <tr><td>${tr('Vapaa kulkuleveys','Clear width')}</td><td class="r">${prov(src.clear_width)}</td></tr>
      ${thresholds.map(t => `<tr><td>${tr('Kynnys','Threshold')} ${esc(t.id)}</td><td class="r">${prov(t.height)} <button class="btn" data-edit="removeThreshold" data-target="${esc(t.id)}">${tr('Poista','Remove')}</button></td></tr>`).join('')}</table>
    <div class="form" style="margin-top:10px">
      <label>${tr('Uusi karmiaukko (mm)','New frame opening (mm)')}<input type="number" id="oWidth" min="1" step="10" placeholder="${Math.round(src.width.value_mm)}"></label>
      <label>${tr('Uusi vapaa leveys (mm)','New clear width (mm)')}<input type="number" id="oClear" min="1" step="10" placeholder="${src.clear_width ? Math.round(src.clear_width.value_mm) : ''}"></label></div>
    <p class="muted">${tr('Suunniteltu mitta tallentuu oletuksena (assumed), ei kenttämittauksena.','A planned size is saved as assumed, not as a field measurement.')}</p>
    <div class="actions"><button class="btn primary" data-edit="modifyOpening">${tr('Tallenna muutos','Save change')}</button>
      ${modified.length ? `<button class="btn" data-edit="revertOpening">${tr('Peru aukon muutokset','Revert opening changes')}</button>` : ''}
      <button class="btn" data-edit="back">${tr('← Takaisin','← Back')}</button></div></section>
    ${rulesSection([...elementFindings('opening', id), ...thresholds.flatMap(t => elementFindings('threshold', t.id))])}`;
}
function fixturePanel(id){
  const f = TARGET.fixtures?.find(x => x.id === id);
  if (!f) return null;
  const added = MARKS.added.has(id), kinds = Object.entries(FIXTURE_KIND).map(([k, l]) => `<option value="${k}" ${k === f.kind ? 'selected' : ''}>${tr(...l)}</option>`).join('');
  return `<section><h3>${tr('Kiintokaluste','Fixture')} <small>${esc(id)}</small></h3>
    <table><tr><td>${tr('Tila','State')}</td><td class="r">${elementState(id)}</td></tr>
      <tr><td>${tr('Tyyppi','Type')}</td><td class="r">${tr(...FIXTURE_KIND[f.kind])}</td></tr>
      <tr><td>${tr('Leveys','Width')}</td><td class="r">${prov(f.width)}</td></tr>
      <tr><td>${tr('Syvyys','Depth')}</td><td class="r">${prov(f.depth)}</td></tr></table>
    <div class="form" style="margin-top:10px">
      <label class="full">${tr('Vaihda tyypiksi','Replace with')}<select id="xKind">${kinds}</select></label>
      <label>${tr('Leveys','Width')} (mm)<input type="number" id="xW" min="1" step="10" value="${Math.round(f.width.value_mm)}"></label>
      <label>${tr('Syvyys','Depth')} (mm)<input type="number" id="xD" min="1" step="10" value="${Math.round(f.depth.value_mm)}"></label></div>
    <div class="actions"><button class="btn primary" data-edit="replaceFixture">${tr('Vaihda kaluste','Replace fixture')}</button></div>
    <div class="form" style="margin-top:14px">
      <label>X (mm)<input type="number" id="xX" step="10" value="${Math.round(f.x.value_mm)}"></label>
      <label>Y (mm)<input type="number" id="xY" step="10" value="${Math.round(f.y.value_mm)}"></label>
      <label class="full">${tr('Kierto (°, vastapäivään)','Rotation (°, counter-clockwise)')}<input type="number" id="xR" step="15" value="${f.rotation_deg ?? 0}"></label></div>
    <p class="muted">${tr('Vedä kalustetta tai käytä nuolinäppäimiä (Shift 100 mm) ja R-näppäintä. Seinäkiinnitys asettaa sen seinää vasten.','Drag it or use the arrow keys (Shift 100 mm) and R. Wall snap puts it against a wall.')}</p>
    <div class="actions"><button class="btn primary" data-edit="moveFixture">${tr('Siirrä','Move')}</button>
      ${added ? `<button class="btn danger" data-edit="removeNew">${tr('Poista lisätty kaluste','Remove added fixture')}</button>` : ''}
      <button class="btn" data-edit="back">${tr('← Takaisin','← Back')}</button></div></section>
    ${rulesSection(elementFindings('fixture', id))}`;
}
function bindElementPanel(sel){
  const E = EDIT(), id = sel.id, num = q => { const v = parseFloat($(q)?.value); return Number.isFinite(v) ? v : undefined; };
  bindRules();
  const revertAll = indexes => u => indexes.slice().reverse().reduce((r, i) => E.revertChange(r.unit, i), {unit:u, id});
  document.querySelectorAll('#panel [data-edit]').forEach(b => b.onclick = () => {
    const a = b.dataset.edit;
    if (a === 'back') return select(null);
    if (a === 'demolishWall') return toggleWall(id);
    if (a === 'restoreWall') return toggleWall(id);
    if (a === 'removeNew') return editUnit(revertAll(changeIndexes(c => (c.op === 'add_wall' && c.wall.id === id) || (c.op === 'add_fixture' && c.fixture.id === id))));
    if (a === 'removeThreshold') return editUnit(u => E.removeThreshold(u, b.dataset.target));
    if (a === 'revertOpening') return editUnit(revertAll(changeIndexes(c => c.op === 'modify_opening' && c.target === id)));
    if (a === 'modifyOpening') return editUnit(u => E.modifyOpening(u, id, {width:num('#oWidth'), clear_width:num('#oClear')}));
    if (a === 'moveFixture') return editUnit(u => E.moveFixture(u, id, {x:num('#xX'), y:num('#xY'), rotation_deg:num('#xR')}));
    if (a === 'replaceFixture'){
      const f = TARGET.fixtures.find(x => x.id === id);
      return editUnit(u => E.replaceFixture(u, id, {kind:$('#xKind').value, x:f.x.value_mm, y:f.y.value_mm, width:num('#xW'), depth:num('#xD'),
        rotation_deg:f.rotation_deg ?? 0, ...(f.height ? {height:f.height.value_mm} : {})}));
    }
  });
}

function bindOverview(){
  bindToolSection(); bindRules(); bindParams();
  document.querySelectorAll('#panel [data-revert]').forEach(b => b.onclick = () => editUnit(u => EDIT().revertChange(u, Number(b.dataset.revert))));
  document.querySelectorAll('#panel tr[data-room]').forEach(tr => tr.onclick = () => { select({kind:'room', id:tr.dataset.room}); if (is3D()) window.View3D.flyToRoom(tr.dataset.room); });
  $('#clearMeasure').onclick = () => state.measures.length && mutate(() => state.measures = []);
  $('#clearFurn').onclick = clearLayout;
}

// alareunan kelluva työkalupalkki: kosketusnäytöllä ei ole näppäimistöä, joten kierto / kopiointi / poisto ovat täällä
function renderFab(){
  const fab = $('#fab'), f = ui.sel?.kind === 'furn' && getF(ui.sel.id), r = ui.sel?.kind === 'room' && ROOMS.find(r => r.id === ui.sel.id);
  if (!f && !r){ fab.classList.remove('show'); return; }
  fab.innerHTML = f
    ? `<span class="name">${esc(nm(f.name))}</span><button class="btn" data-a="rotL">↺</button><button class="btn" data-a="rotR">↻ ${tr('Kierrä','Rotate')}</button>
       <button class="btn" data-a="dup">${tr('Kopioi','Duplicate')}</button><button class="btn danger" data-a="del">${tr('Poista','Delete')}</button><span class="sep"></span>
       <button class="btn narrow-only" data-a="prop">${tr('Ominaisuudet','Properties')}</button><button class="btn" data-a="done">${tr('Valmis','Done')}</button>`
    : `<span class="name">${esc(nm(state.rooms[r.id].name))}</span><button class="btn narrow-only" data-a="prop">${tr('Lattia / ominaisuudet','Floor / Properties')}</button><button class="btn" data-a="done">${tr('Valmis','Done')}</button>`;
  fab.classList.add('show');
  fab.querySelectorAll('[data-a]').forEach(b => b.onclick = () => ({
    rotL:() => rotateSel(-90), rotR:() => rotateSel(90), dup:duplicateSel, del:deleteSel,
    prop:() => drawer('panel', true), done:() => { select(null); closeDrawers(); },
  })[b.dataset.a]());
}

function clearLayout(){
  const n = state.furniture.length;
  if (!n) return toast(tr('Ei tyhjennettäviä kalusteita', 'There is no furniture to clear'));
  if (!confirm(tr(`Poistetaanko kaikki ${n} kalustetta / laitetta?\nSeinät, lattiamateriaalit ja mittaviivat säilyvät. Voit palauttaa ne painamalla Kumoa.`, `Remove all ${n} furniture / appliance items?\nWalls, flooring and measurements are kept. You can Undo this.`))) return;
  ui.sel = null; mutate(() => state.furniture = []);
  toast(tr('Sisustus tyhjennetty — Kumoa palauttaa sen', 'Layout cleared — Undo to restore'));
}

/* Sivupalkin avaus/sulku: which = 'lib' | 'panel' | null, open puuttuessa vaihdetaan tilaa.
 * Leveä näyttö: sivupalkki piilotetaan / näytetään asettelussa (valinta muistetaan); kapea näyttö: sivupalkki on kelluva laatikko, vain yksi auki kerrallaan, which = null sulkee kaikki */
const PANES = 'huxing-panes';
const panes = (() => { try { return JSON.parse(localStorage.getItem(PANES)) || {}; } catch(e) { return {}; } })();
function drawer(which, open){
  const app = $('.app'), els = {lib:$('aside.lib'), panel:$('aside.right')}, n = narrow();
  if (n){
    Object.entries(els).forEach(([k, el]) => el.classList.toggle('open', k === which && (open ?? !el.classList.contains('open'))));
  } else {
    Object.values(els).forEach(el => el.classList.remove('open'));
    if (which){
      const k = which === 'lib' ? 'hideLib' : 'hidePanel';
      panes[k] = open === undefined ? !panes[k] : !open;
      try { localStorage.setItem(PANES, JSON.stringify(panes)); } catch(e) {}
    }
  }
  app.classList.toggle('hide-lib', !!panes.hideLib); app.classList.toggle('hide-panel', !!panes.hidePanel);
  syncPaneBtns();
}
function syncPaneBtns(){
  const els = {lib:$('aside.lib'), panel:$('aside.right')}, n = narrow();
  const vis = k => n ? els[k].classList.contains('open') : !panes[k === 'lib' ? 'hideLib' : 'hidePanel'];
  $('#tgLib').classList.toggle('on', vis('lib')); $('#tgPanel').classList.toggle('on', vis('panel'));
  $('#tgLib').title = vis('lib') ? tr('Piilota kirjasto ( [ )', 'Hide library ( [ )') : tr('Näytä kirjasto ( [ )', 'Show library ( [ )');
  $('#tgPanel').title = vis('panel') ? tr('Piilota ominaisuudet ( ] )', 'Hide properties ( ] )') : tr('Näytä ominaisuudet ( ] )', 'Show properties ( ] )');
  $('#stage').classList.toggle('drawer-panel', n && vis('panel'));   // kun ominaisuuslaatikko peittää näkymän, alapalkki väistyy
}
function closeDrawers(){ if (narrow()) drawer(null); }

function roomPanel(r){
  const st = state.rooms[r.id], a = area(r.poly), [x0,y0,x1,y1] = bbox(r.poly), inside = state.furniture.filter(f => f.cx>x0&&f.cx<x1&&f.cy>y0&&f.cy<y1);
  const mats = Object.entries(MATS).map(([k,m]) => `<button class="mat ${k===st.mat?'on':''}" data-mat="${k}"><i style="background:${m.sw}"></i><span>${nm(m.name)}<small>${m.price} €/m²</small></span></button>`).join('');
  return `<section><h3>${tr('Huone','Room')}</h3>
    <div class="form"><label class="full">${tr('Nimi','Name')}<input id="rName" value="${esc(nm(st.name))}"></label></div>
    <div class="stats" style="margin-top:10px">
      <div><small>${tr('Pinta-ala','Floor area')}</small><span class="big">${fmt(a)}</span> m²</div>
      <div><small>${tr('Piiri','Perimeter')}</small><span class="big">${fmt(perim(r.poly),1)}</span> m</div>
      <div><small>${tr('Leveys','Width')}</small><span class="big">${x1-x0}</span> mm</div>
      <div><small>${tr('Syvyys','Depth')}</small><span class="big">${y1-y0}</span> mm</div></div>
    <div class="muted">${tr(`Seinäpinta-ala (kattokorkeus 2,8 m, aukkoja ei vähennetty) noin ${fmt(perim(r.poly)*2.8,1)} m²`, `Wall area (2.8m ceiling, openings not deducted) ≈ ${fmt(perim(r.poly)*2.8,1)} m²`)}</div></section>
  <section><h3>${tr('Lattiamateriaali','Flooring')}</h3><div class="mats">${mats}</div>
    <div class="total"><span>${tr('Arvioitu hinta','Estimated cost')}</span><b>${Math.round(a*MATS[st.mat].price*1.05).toLocaleString('fi-FI')} €</b></div></section>
  <section><h3>${tr('Kalusteet huoneessa','Furniture in room')} <small>${tr(`${inside.length} kpl`, `${inside.length} items`)}</small></h3>
    <table>${inside.map(f => `<tr class="click" data-fid="${f.id}"><td>${esc(nm(f.name))}</td><td class="r muted">${f.w}×${f.d}</td></tr>`).join('') || `<tr><td class="muted">${tr('Ei mitään','None')}</td></tr>`}</table>
    <div class="actions"><button class="btn" id="back">${tr('← Takaisin yleisnäkymään','← Back to overview')}</button></div></section>
    ${rulesSection(elementFindings('room', r.id))}`;
}
function bindRoomPanel(){
  const id = ui.sel.id;
  $('#rName').onchange = e => mutate(() => state.rooms[id].name = e.target.value.trim() || state.rooms[id].name);
  document.querySelectorAll('#panel [data-mat]').forEach(b => b.onclick = () => editUnit(u => EDIT().setFloor(u, id, b.dataset.mat)));
  document.querySelectorAll('#panel tr[data-fid]').forEach(tr => tr.onclick = () => select({kind:'furn', id:tr.dataset.fid}));
  $('#back').onclick = () => select(null);
}

function furnPanel(f){
  return `<section><h3>${tr('Kaluste','Furniture')}</h3>
    <div class="form">
      <label class="full">${tr('Nimi','Name')}<input id="fName" value="${esc(nm(f.name))}"></label>
      <label>${tr('Leveys','Width')} (mm)<input type="number" id="fW" value="${f.w}" min="50" step="10"></label>
      <label>${tr('Syvyys','Depth')} (mm)<input type="number" id="fD" value="${f.d}" min="50" step="10"></label>
      <label>${tr('Keskipiste','Center')} X (mm)<input type="number" id="fX" value="${Math.round(f.cx)}" step="10"></label>
      <label>${tr('Keskipiste','Center')} Y (mm)<input type="number" id="fY" value="${Math.round(f.cy)}" step="10"></label>
      <label>${tr('Kierto','Rotation')} (°)<input type="number" id="fR" value="${f.rot}" step="15"></label>
      <label>${tr('Väri','Color')}<input type="color" id="fC" value="${f.color}"></label>
    </div>
    <div class="muted" style="margin-top:8px">${tr('Pohja-ala','Footprint')} ${fmt(f.w*f.d/1e6)} m²</div>
    <div class="actions">
      <button class="btn" id="aRot">${tr('Kierrä 90°','Rotate 90°')}</button><button class="btn" id="aDup">${tr('Kopioi','Duplicate')}</button>
      <button class="btn" id="aTop">${tr('Tuo etualalle','Bring to front')}</button><button class="btn" id="aBot">${tr('Vie taka-alalle','Send to back')}</button>
      <button class="btn danger" id="aDel">${tr('Poista','Delete')}</button><button class="btn" id="back">${tr('← Takaisin','← Back')}</button>
    </div></section>
  <section class="muted" style="font-size:12px">${tr('Siirrä kalustetta vetämällä; käännä yläpisteestä; muuta kokoa oikean alakulman neliöstä. Kun "Seinäkiinnitys" on päällä, kalusteet kiinnittyvät lähellä oleviin seiniin.', 'Drag to move; drag the top dot to rotate; drag the bottom-right square to resize. With "Wall snap" on, items snap flush to nearby walls.')}</section>`;
}
function bindFurnPanel(f){
  const upd = (fn) => mutate(() => { const g = getF(f.id); if (g) fn(g); });
  const num = (id, fn) => $(id).onchange = e => { const v = parseFloat(e.target.value); if (!isNaN(v)) upd(g => fn(g, v)); };
  $('#fName').onchange = e => upd(g => g.name = e.target.value.trim() || g.name);
  num('#fW', (g,v) => g.w = Math.max(50, Math.round(v)));
  num('#fD', (g,v) => g.d = Math.max(50, Math.round(v)));
  num('#fX', (g,v) => g.cx = v); num('#fY', (g,v) => g.cy = v); num('#fR', (g,v) => g.rot = norm(v));
  $('#fC').onchange = e => upd(g => g.color = e.target.value);
  $('#aRot').onclick = () => rotateSel(90);
  $('#aDup').onclick = duplicateSel;
  $('#aDel').onclick = deleteSel;
  $('#aTop').onclick = () => mutate(() => { const i = state.furniture.findIndex(g => g.id===f.id); state.furniture.push(...state.furniture.splice(i,1)); });
  $('#aBot').onclick = () => mutate(() => { const i = state.furniture.findIndex(g => g.id===f.id); state.furniture.unshift(...state.furniture.splice(i,1)); });
  $('#back').onclick = () => select(null);
}

/* ======================= Toiminnot ======================= */
function select(sel){ ui.sel = sel; renderSel(); renderPanel(); }
function rotateSel(d){
  if (ui.sel?.kind==='furn') mutate(() => { const f = getF(ui.sel.id); f.rot = norm(f.rot + d); });
  else if (ui.sel?.kind==='fixture'){ const f = FIXTURES.find(f => f.id === ui.sel.id); if (f) moveFixtureTo(f.id, {x:f.x, y:f.y, rot:f.rotation_deg + d}); }
}
function deleteSel(){ if (ui.sel?.kind==='furn'){ const id = ui.sel.id; ui.sel = null; mutate(() => state.furniture = state.furniture.filter(f => f.id !== id)); } }
function duplicateSel(){
  if (ui.sel?.kind !== 'furn') return;
  const f = getF(ui.sel.id), n = {...f, id:uid(), cx:f.cx+200, cy:f.cy+200};
  ui.sel = {kind:'furn', id:n.id}; mutate(() => state.furniture.push(n));
}
// jos uusi kaluste osuu seinän / ikkunan päälle, se työnnetään matalamman läpäisyn suuntaan ulos seinää vasten
function pushOut(f){
  for (let n = 0; n < 4; n++){
    let moved = false;
    for (const r of snapRects()){
      const {hw, hh} = aabb(f), ox = Math.min(f.cx+hw, r[2]) - Math.max(f.cx-hw, r[0]), oy = Math.min(f.cy+hh, r[3]) - Math.max(f.cy-hh, r[1]);
      if (ox <= 0 || oy <= 0) continue;
      if (ox < oy) f.cx = f.cx < (r[0]+r[2])/2 ? r[0]-hw : r[2]+hw;
      else f.cy = f.cy < (r[1]+r[3])/2 ? r[1]-hh : r[3]+hh;
      moved = true;
    }
    if (!moved) return;
  }
}
function addItem(it, x, y){
  const [type,name,w,d,color] = it, f = F(type,name,Math.round(x/10)*10,Math.round(y/10)*10,w,d,0,color);
  pushOut(f);
  ui.sel = {kind:'furn', id:f.id};
  mutate(() => type==='rug' ? state.furniture.unshift(f) : state.furniture.push(f));
  toast(tr(`Lisätty "${name}" ${w}×${d}`, `Added "${nm(name)}" ${w}×${d}`));
}
function toggleWall(id){
  const active=WALLS.find(w=>w.id===id), w=active || PLAN.demolishedWalls.find(w=>w.id===id);
  if (!w) return;
  if (w.kind === 'load_bearing') return toast(tr('Kantavia seiniä ei voi purkaa', 'Load-bearing walls cannot be removed'));
  if (w.kind === 'external' || w.kind === 'party') return toast(tr('Ulkoseinää ei voi purkaa', 'External walls cannot be removed'));
  const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
  if(active){ if(editUnit(u=>EDIT().demolishWall(u,id))) toast(tr(`Merkitty purettavaksi ${Math.round(length)} mm seinää`, `Marked ${Math.round(length)} mm of wall for removal`)); return; }
  if(editUnit(u=>EDIT().restoreWall(u,id))) toast(tr('Seinä palautettu', 'Wall restored'));
}

function setTool(t){
  ui.tool = t; ui.mA = null; ui.mCur = null; ui.wA = null; ui.wCur = null;
  svg.setAttribute('class', 'tool-' + t);
  document.querySelectorAll('#tools .btn').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  syncModeHint();
  renderMeasure(); renderPanel();
}
function syncModeHint(){
  const hints = {select:'',
    measure:COARSE ? tr('Vedä mittaviiva tai napauta kaksi pistettä · kiinnittyy seiniin · poistu napauttamalla "Valitse"', 'Hold and drag a line, or tap two points · snaps to walls · tap "Select" to exit')
      : tr('Napsauta kahta pistettä (tai vedä) mitataksesi etäisyyden · kiinnittyy seiniin · Shift lukitsee vaaka-/pystysuuntaan · Esc peruu', 'Click two points (or drag) to measure · snaps to walls · Shift locks horizontal/vertical · Esc cancels'),
    demolish:tr('Napsauta harmaata ei-kantavaa seinää merkitäksesi sen purettavaksi, napsauta uudelleen palauttaaksesi · mustia kantavia seiniä ei voi purkaa', 'Click a grey non-bearing wall to remove it, click again to restore · black bearing walls cannot be removed'),
    wall:tr('Napsauta seinän alku- ja loppupiste · jatkuu edellisen päästä · kiinnittyy seinien päihin ja keskilinjoihin · Shift lukitsee vaaka-/pystysuuntaan · Esc lopettaa', 'Click the wall start and end · continues from the last end · snaps to wall ends and centre lines · Shift locks horizontal/vertical · Esc ends'),
    route:tr('Napsauta lähtöpiste ja määränpää · reitti väistää seiniä, kiintokalusteita ja kalusteita · kapein kohta merkitään', 'Click a start and a destination · the route avoids walls, fixtures and furniture · the narrowest point is marked'),
    fixture:tr('Napsauta kohtaa · seinän lähellä kaluste asettuu seinää vasten ja sen suuntaiseksi · tyyppi ja koko oikeassa paneelissa', 'Click a spot · near a wall the fixture sits flush and parallel to it · type and size in the right panel')};
  const h = $('#modehint'); h.textContent = hints[ui.tool]; h.classList.toggle('show', !!hints[ui.tool]);
}

/* ======================= Näkymä ======================= */
function applyView(){
  const W = svg.clientWidth, H = svg.clientHeight;
  svg.setAttribute('viewBox', `${view.x0} ${view.y0} ${W/view.s} ${H/view.s}`);
  const ratio = 1/(view.s*PX_MM);
  $('#ratio').textContent = '1:' + Math.round(ratio);
  const nice = [100,200,500,1000,2000,5000].find(v => v*view.s >= 60) || 5000;
  $('#sbBar').style.width = nice*view.s + 'px';
  $('#sbText').textContent = nice >= 1000 ? `${nice/1000} m` : `${nice} mm`;
  renderSel(); renderMeasure();
  backgroundUI.render();
}
function fitView(){
  const W = svg.clientWidth, H = svg.clientHeight;
  view.s = Math.min(W/BOUNDS.w, H/BOUNDS.h);
  view.x0 = BOUNDS.x - (W/view.s - BOUNDS.w)/2; view.y0 = BOUNDS.y - (H/view.s - BOUNDS.h)/2;
  applyView();
}
function zoomAt(ns, mx, my){
  ns = Math.max(.012, Math.min(2, ns));
  const px = view.x0 + mx/view.s, py = view.y0 + my/view.s;
  view.s = ns; view.x0 = px - mx/ns; view.y0 = py - my/ns; applyView();
}
const zoomCenter = k => zoomAt(view.s*k, svg.clientWidth/2, svg.clientHeight/2);
const setRatio = r => zoomAt(1/(r*PX_MM), svg.clientWidth/2, svg.clientHeight/2);

function toMM(e){
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

/* ======================= Kiinnitys ======================= */
const grid = () => 10;
function snapMove(f, cx, cy){
  let nx = Math.round(cx/grid())*grid(), ny = Math.round(cy/grid())*grid();
  if (!ui.layers.wallSnap) return [nx, ny];
  const {hw, hh} = aabb(f), tol = 10/view.s;
  let bx = tol, by = tol;
  for (const r of snapRects()){
    if (!(r[3] < cy-hh-tol || r[1] > cy+hh+tol)) for (const ex of [r[0], r[2]]) for (const c of [ex+hw, ex-hw]) if (Math.abs(c-cx) < bx){ bx = Math.abs(c-cx); nx = c; }
    if (!(r[2] < cx-hw-tol || r[0] > cx+hw+tol)) for (const ey of [r[1], r[3]]) for (const c of [ey+hh, ey-hh]) if (Math.abs(c-cy) < by){ by = Math.abs(c-cy); ny = c; }
  }
  return [nx, ny];
}
function snapPoint(p, shift){
  let x = Math.round(p.x/10)*10, y = Math.round(p.y/10)*10;
  const tol = 8/view.s; let bx = tol, by = tol;
  for (const r of snapRects()){
    for (const ex of [r[0], r[2]]) if (Math.abs(ex-p.x) < bx){ bx = Math.abs(ex-p.x); x = ex; }
    for (const ey of [r[1], r[3]]) if (Math.abs(ey-p.y) < by){ by = Math.abs(ey-p.y); y = ey; }
  }
  if (shift && ui.mA){ if (Math.abs(x-ui.mA.x) > Math.abs(y-ui.mA.y)) y = ui.mA.y; else x = ui.mA.x; }
  return {x, y};
}

/* ======================= Uusi seinä ja kiintokaluste (muutoskerros) ======================= */
const FIXTURE_SIZE = {grab_bar:[600,80], wc:[400,700], sink:[600,450], shower:[900,900], bathtub:[1700,750], stove:[600,600], cabinet:[600,600]};
// Screen mm (y down). Wall ends first, then a wall centre line, then the 10 mm grid.
function wallSnap(p, shift){
  const tol = 10/view.s;
  let best = null, bd = tol;
  for (const w of WALLS) for (const e of [w.a, w.b]){ const d = Math.hypot(e[0]-p.x, e[1]-p.y); if (d < bd){ bd = d; best = {x:e[0], y:e[1]}; } }
  if (best) return best;
  for (const w of WALLS){
    const f = foot(p, w); if (f.d < bd){ bd = f.d; best = {x:f.x, y:f.y}; }
  }
  if (best) return best;
  const q = {x:Math.round(p.x/10)*10, y:Math.round(p.y/10)*10};
  if (shift && ui.wA){ if (Math.abs(q.x-ui.wA.x) > Math.abs(q.y-ui.wA.y)) q.y = ui.wA.y; else q.x = ui.wA.x; }
  return q;
}
function foot(p, w){
  const [ax,ay] = w.a, [bx,by] = w.b, L = Math.hypot(bx-ax, by-ay) || 1, ux = (bx-ax)/L, uy = (by-ay)/L;
  const t = Math.max(0, Math.min(L, Math.round(((p.x-ax)*ux + (p.y-ay)*uy)/10)*10)), x = ax + ux*t, y = ay + uy*t;   // 10 mm steps along the wall
  return {x, y, d:Math.hypot(p.x-x, p.y-y), ux, uy};
}
function placeWallPoint(q){
  if (!ui.wA){ ui.wA = q; ui.wCur = q; renderMeasure(); return; }
  if (Math.hypot(q.x-ui.wA.x, q.y-ui.wA.y) < 50) return;
  const a = ui.wA, thickness_mm = ui.newWall.thickness;
  // Model coordinates are y-up; planned values are recorded as assumptions by the edit API.
  if (editUnit(u => EDIT().addWall(u, {x:a.x, y:-a.y}, {x:q.x, y:-q.y}, {thickness_mm}))){ ui.wA = q; ui.wCur = q; }
  renderMeasure();
}
// Screen-mm pose. Near a wall (and with wall snap on) the fixture's back (local -y) sits on the wall face
// and its width runs along the wall; otherwise it stays on the 10 mm grid with its current rotation.
function fixturePose(p, depth, rot = 0){
  let best = null;
  if (ui.layers.wallSnap) for (const w of WALLS){
    const h = foot(p, w); if (h.d < w.thickness/2 + depth/2 + 250 && (!best || h.d < best.d)) best = {...h, w};
  }
  if (!best) return {x:Math.round(p.x/10)*10, y:Math.round(p.y/10)*10, rot};
  let nx = -best.uy, ny = best.ux;
  if ((p.x-best.x)*nx + (p.y-best.y)*ny < 0){ nx = -nx; ny = -ny; }
  const off = best.w.thickness/2 + depth/2;
  return {x:Math.round(best.x + nx*off), y:Math.round(best.y + ny*off), rot:Math.atan2(-nx, ny) * 180 / Math.PI};
}
const modelAngle = screenDeg => Math.round(((-screenDeg % 360) + 360) % 360 * 10) / 10;
function placeFixture(p){
  const f = ui.newFixture, pose = fixturePose(p, f.depth);
  let id = null;
  if (editUnit(u => { const r = EDIT().addFixture(u, {kind:f.kind, x:pose.x, y:-pose.y, width:f.width, depth:f.depth, rotation_deg:modelAngle(pose.rot)}); id = r.id; return r; })){
    setTool('select'); select({kind:'fixture', id});
  }
}
// Screen pose → planned model pose; repeated moves update the fixture's single change.
function moveFixtureTo(id, pose){ return editUnit(u => EDIT().moveFixture(u, id, {x:pose.x, y:-pose.y, rotation_deg:modelAngle(pose.rot)})); }
/* ======================= Kulkureitti (pyörätuoli) ======================= */
const RULES = () => window.UnitModel.rules;
// Points are screen mm; the solver works in model mm (y up) and counts movable furniture as obstacles.
function solveRoute(){
  const r = ui.route, P = key => RULES().parameter(state.unit, key);
  const extra = state.furniture.map(f => ({x:f.cx, y:-f.cy, width:f.w, depth:f.d, rotation_deg:-f.rot}));
  r.result = window.UnitModel.findRoute({unit:state.unit, start:{x:r.start.x, y:-r.start.y}, goal:{x:r.goal.x, y:-r.goal.y},
    pathWidth:P('path_width_mm'), doorWidth:P('door_clear_width_mm'), extra});
}
function placeRoutePoint(p){
  if (!ui.route || ui.route.goal) ui.route = {start:p};
  else { ui.route.goal = p; solveRoute(); }
  renderMeasure(); renderPanel();
}
function routeSvg(k){
  const r = ui.route; if (!r) return '';
  let s = `<circle cx="${r.start.x}" cy="${r.start.y}" r="${5*k}" fill="#2f5d62"/>`;
  const res = r.result;
  if (r.goal) s += `<circle cx="${r.goal.x}" cy="${r.goal.y}" r="${5*k}" fill="#2f5d62"/>`;
  if (res?.reachable){
    const col = res.ok ? '#2f7d4f' : '#c9443a', n = res.narrowest;
    s += `<polyline data-role="route" points="${res.path.map(p => `${p.x},${-p.y}`).join(' ')}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    if (n) s += `<g data-role="routeNarrowest"><circle cx="${n.x}" cy="${-n.y}" r="${n.width/2}" fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>
      <text x="${n.x}" y="${-n.y - n.width/2 - 8*k}" font-size="${12*k}" text-anchor="middle" fill="${col}" font-weight="600" stroke="#fff" stroke-width="${3*k}" paint-order="stroke">${n.width} mm</text></g>`;
  }
  return s;
}
function paramSource(key){
  const p = RULES().PARAMETERS[key], src = RULES().SOURCES[p.source];
  return `<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.label)} ${esc(p.section)}</a>`;
}
function routeSection(){
  const r = ui.route, res = r?.result;
  let body = `<p class="muted">${tr('Napsauta lähtöpiste ja määränpää pohjassa.','Click a start and a destination on the plan.')}</p>`;
  if (r && !r.goal) body = `<p class="muted">${tr('Lähtöpiste valittu. Napsauta määränpää.','Start set. Click the destination.')}</p>`;
  if (res && !res.reachable) body = `<p class="route-result"><span class="rule-badge suositus">${tr('Suositus','Recommendation')}</span> ${tr('Reittiä ei löytynyt: kohteiden välillä ei ole kulkuyhteyttä.','No route: the points are not connected.')}</p>`;
  if (res?.reachable){
    const n = res.narrowest, where = n.at === 'door' ? tr(`ovella ${esc(n.opening)}`, `at door ${esc(n.opening)}`) : tr('kulkureitillä','on the route');
    body = `<p class="route-result">${res.ok ? `<span class="rule-badge ok">✓ ${tr('täyttyy','met')}</span>` : `<span class="rule-badge suositus">${tr('Suositus','Recommendation')}</span>`}
      ${tr(`Kapein kohta ${where}: ${n.width} mm, vaatimus ${n.required} mm. Reitin pituus ${(res.length_mm/1000).toFixed(1)} m.`,
        `Narrowest point ${where}: ${n.width} mm, required ${n.required} mm. Route length ${(res.length_mm/1000).toFixed(1)} m.`)}</p>
      <p class="muted">${tr('Ovilla vaatimus on oven vapaa leveys, muualla kulkureitin leveys. Ruudukon tarkkuus noin 20 mm. Kalusteet lasketaan esteiksi.','Doors use the door clear width, elsewhere the route width. Grid precision about 20 mm. Furniture counts as obstacles.')}</p>
      <p class="muted">${paramSource('door_clear_width_mm')}<br>${paramSource('path_width_mm')}</p>`;
  }
  return `<section id="routeResult"><h3>${tr('Kulkureitti','Route')} <small>${tr('ohjeellinen','advisory')}</small></h3>${body}
    ${r ? `<div class="actions"><button class="btn" id="routeClear">${tr('Tyhjennä reitti','Clear route')}</button></div>` : ''}</section>`;
}
function paramsSection(){
  const P = RULES().PARAMETERS, user = state.unit.user ?? {};
  const rows = Object.entries(P).map(([key, p]) => `<label>${esc(LANG === 'en' ? p.label_en : p.label_fi)}
    <input type="number" min="1" step="10" data-param="${esc(key)}" value="${user[key] ?? ''}" placeholder="${p.default}"><small>${tr('oletus','default')} ${p.default} mm · ${paramSource(key)}</small></label>`).join('');
  return `<section class="params"><details ${Object.keys(user).some(k => k in P) ? 'open' : ''}><summary>${tr('Mitoitusperusteet','Design parameters')}</summary>
    <p class="muted">${tr('Standardin oletukset; muuta tarvittaessa tälle kohteelle. Tyhjä palauttaa oletuksen.','Standard defaults; override for this project if needed. Empty restores the default.')}</p>${rows}</details></section>`;
}
function bindParams(){
  document.querySelectorAll('#panel [data-param]').forEach(input => input.onchange = () => {
    const v = input.value.trim();
    editUnit(u => EDIT().setUserValue(u, input.dataset.param, v === '' ? null : Number(v)));
  });
  if ($('#routeClear')) $('#routeClear').onclick = () => { ui.route = null; renderMeasure(); renderPanel(); };
}

function toolSection(){
  if (ui.tool === 'wall') return `<section id="toolOptions"><h3>${tr('Uusi seinä','New wall')} <small>${tr('muutos, ei nykytila','a change, not the survey')}</small></h3>
    <div class="form"><label class="full">${tr('Paksuus (mm)','Thickness (mm)')}<input type="number" id="nwThickness" min="20" step="10" value="${ui.newWall.thickness}"></label></div>
    <p class="muted">${tr('Uusi seinä on väliseinä ja sen mitat tallentuvat suunnitelmana (assumed). Esc lopettaa ketjun.','The new wall is a partition; its sizes are saved as planned (assumed). Esc ends the chain.')}</p></section>`;
  if (ui.tool === 'route' || ui.route) return routeSection();
  if (ui.tool === 'fixture'){
    const f = ui.newFixture, kinds = Object.entries(FIXTURE_KIND).map(([k, l]) => `<option value="${k}" ${k === f.kind ? 'selected' : ''}>${tr(...l)}</option>`).join('');
    return `<section id="toolOptions"><h3>${tr('Lisää kiintokaluste','Add fixture')} <small>${tr('muutos','a change')}</small></h3>
      <div class="form"><label class="full">${tr('Tyyppi','Type')}<select id="nfKind">${kinds}</select></label>
        <label>${tr('Leveys','Width')} (mm)<input type="number" id="nfW" min="10" step="10" value="${f.width}"></label>
        <label>${tr('Syvyys','Depth')} (mm)<input type="number" id="nfD" min="10" step="10" value="${f.depth}"></label></div>
      <p class="muted">${tr('Napsauta pohjaa. Seinän lähellä kaluste kiinnittyy seinään.','Click the plan. Near a wall the fixture attaches to it.')}</p></section>`;
  }
  return '';
}
function bindToolSection(){
  const n = q => parseFloat($(q)?.value);
  if ($('#nwThickness')) $('#nwThickness').onchange = () => { if (n('#nwThickness') > 0) ui.newWall.thickness = n('#nwThickness'); };
  if ($('#nfKind')){
    $('#nfKind').onchange = e => { const [w, d] = FIXTURE_SIZE[e.target.value]; ui.newFixture = {kind:e.target.value, width:w, depth:d}; renderPanel(); };
    $('#nfW').onchange = () => { if (n('#nfW') > 0) ui.newFixture.width = n('#nfW'); };
    $('#nfD').onchange = () => { if (n('#nfD') > 0) ui.newFixture.depth = n('#nfD'); };
  }
}

/* ======================= Osoittimen käsittely ======================= */
let drag = null, pinch = null;
const touches = new Map();                     // sormet, jotka ovat tällä hetkellä pohjapiirroksen päällä
const svgXY = (x, y) => { const r = svg.getBoundingClientRect(); return [x - r.left, y - r.top]; };
function pinchInfo(){
  const [a, b] = [...touches.values()];
  return {d:Math.max(1, Math.hypot(b.x-a.x, b.y-a.y)), c:svgXY((a.x+b.x)/2, (a.y+b.y)/2)};
}
// päätetään nykyinen veto: siirretty kaluste kirjataan kumoamishistoriaan
function endDrag(cancel){
  const d = drag; drag = null; svg.classList.remove('panning');
  if (!d) return;
  if (d.kind === 'measure'){
    if (cancel){ ui.mA = ui.mCur = null; renderMeasure(); return; }
    if (d.moved && ui.mA && ui.mCur && Math.hypot(ui.mCur.x-ui.mA.x, ui.mCur.y-ui.mA.y) > 20){
      const a = ui.mA, b = ui.mCur; ui.mA = ui.mCur = null; mutate(() => state.measures.push({a, b}));
    }
    renderMeasure(); return;                   // ei vetoa: säilytetään alkupiste ja odotetaan toista napsautusta
  }
  if (d.kind === 'pan'){
    if (!cancel && !d.moved && ui.tool === 'select') select(d.el || (d.room ? {kind:'room', id:d.room} : null));
    return;
  }
  if (d.kind === 'fixture'){
    if (!cancel && d.moved && d.pose) moveFixtureTo(d.id, d.pose); else renderFurn();
    return;
  }
  if (d.moved){ commit(d.before); renderAll(); }
}

svg.addEventListener('pointerdown', e => {
  if (e.button === 1 || e.button === 2) return;
  closeDrawers(); $('details.menu').open = false;
  if (e.pointerType !== 'mouse'){
    touches.set(e.pointerId, {x:e.clientX, y:e.clientY});
    svg.setPointerCapture(e.pointerId);
    if (touches.size >= 2){                    // toinen sormi alas: perutaan yhden sormen toiminto ja siirrytään kahden sormen zoomaukseen / panorointiin
      endDrag(drag?.kind === 'measure' || drag?.kind === 'pan');
      const {d, c} = pinchInfo();
      pinch = {d, c, s:view.s, px:view.x0 + c[0]/view.s, py:view.y0 + c[1]/view.s};
      return;
    }
  }
  if (pinch) return;
  const p = toMM(e), t = e.target;
  if (ui.tool === 'measure'){
    const q = snapPoint(p, e.shiftKey);
    if (!ui.mA){ ui.mA = q; ui.mCur = q; drag = {kind:'measure', sx:e.clientX, sy:e.clientY, moved:false}; svg.setPointerCapture(e.pointerId); }
    else { const a = ui.mA; ui.mA = null; ui.mCur = null; if (Math.hypot(q.x-a.x, q.y-a.y) > 20) mutate(() => state.measures.push({a, b:q})); }
    renderMeasure(); return;
  }
  if (ui.tool === 'wall'){ placeWallPoint(wallSnap(p, e.shiftKey)); return; }
  if (ui.tool === 'fixture'){ placeFixture(p); return; }
  if (ui.tool === 'route'){ placeRoutePoint({x:p.x, y:p.y}); return; }
  const h = t.closest('[data-handle]');
  if (h && ui.sel?.kind === 'furn'){
    drag = {kind:h.dataset.handle, id:ui.sel.id, sx:e.clientX, sy:e.clientY, before:snap(), moved:false};
  } else if (ui.tool === 'demolish' && t.closest('[data-wall]')){
    toggleWall(t.closest('[data-wall]').dataset.wall); return;
  } else if (ui.tool === 'select' && t.closest('[data-fixture]') && !t.closest('[data-fid]')){
    const id = t.closest('[data-fixture]').dataset.fixture, f = FIXTURES.find(f => f.id === id);
    if (ui.sel?.id !== id) select({kind:'fixture', id});
    drag = {kind:'fixture', id, sx:e.clientX, sy:e.clientY, ox:p.x-f.x, oy:p.y-f.y, depth:f.depth, rot:f.rotation_deg, moved:false, pose:null};
  } else if (ui.tool === 'select' && t.closest('[data-fid]')){
    const f = getF(t.closest('[data-fid]').dataset.fid);
    if (ui.sel?.id !== f.id) select({kind:'furn', id:f.id});
    drag = {kind:'move', id:f.id, sx:e.clientX, sy:e.clientY, ox:p.x-f.cx, oy:p.y-f.cy, before:snap(), moved:false};
  } else {
    const room = t.closest('[data-room]'), el = t.closest('[data-wall],[data-opening],[data-fixture]');
    const pickEl = el && (el.dataset.wall ? {kind:'wall', id:el.dataset.wall} : el.dataset.opening ? {kind:'opening', id:el.dataset.opening} : {kind:'fixture', id:el.dataset.fixture});
    drag = {kind:'pan', sx:e.clientX, sy:e.clientY, x0:view.x0, y0:view.y0, room:room && room.dataset.room, el:pickEl, moved:false};
  }
  svg.setPointerCapture(e.pointerId);
});

svg.addEventListener('pointermove', e => {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (pinch){
    if (touches.size < 2) return;
    const {d, c} = pinchInfo(), ns = Math.max(.012, Math.min(2, pinch.s * d / pinch.d));
    view.s = ns; view.x0 = pinch.px - c[0]/ns; view.y0 = pinch.py - c[1]/ns; applyView();
    return;
  }
  const p = toMM(e);
  $('#cx').textContent = Math.round(p.x) + ' mm'; $('#cy').textContent = Math.round(p.y) + ' mm';
  if (!drag){
    const room = e.target.closest && e.target.closest('[data-room]');
    $('#hover').innerHTML = room ? `<b>${esc(state.rooms[room.dataset.room].name)}</b> ${fmt(area(ROOMS.find(r=>r.id===room.dataset.room).poly))} m²` : '';
    if (ui.tool === 'measure' && ui.mA){ ui.mCur = snapPoint(p, e.shiftKey); renderMeasure(); }
    if (ui.tool === 'wall' && ui.wA){ ui.wCur = wallSnap(p, e.shiftKey); renderMeasure(); }
    return;
  }
  const far = Math.hypot(e.clientX-drag.sx, e.clientY-drag.sy) >= TAP;
  if (drag.kind === 'measure'){
    if (far) drag.moved = true;
    ui.mCur = snapPoint(p, e.shiftKey); renderMeasure(); return;
  }
  if (drag.kind === 'fixture'){
    if (!drag.moved && !far) return;
    drag.moved = true;
    drag.pose = fixturePose({x:p.x-drag.ox, y:p.y-drag.oy}, drag.depth, drag.rot);
    svg.querySelector(`#gFurn [data-fixture="${CSS.escape(drag.id)}"]`)?.setAttribute('transform', `translate(${drag.pose.x} ${drag.pose.y}) rotate(${drag.pose.rot})`);
    return;
  }
  if (drag.kind === 'pan'){
    if (!drag.moved && !far) return;
    drag.moved = true; svg.classList.add('panning');
    view.x0 = drag.x0 - (e.clientX-drag.sx)/view.s; view.y0 = drag.y0 - (e.clientY-drag.sy)/view.s; applyView(); return;
  }
  const f = getF(drag.id); if (!f) return;
  if (!drag.moved && !far) return;             // kevyt napautus ei saa saada kalustetta värähtämään
  drag.moved = true;
  if (drag.kind === 'move'){
    [f.cx, f.cy] = snapMove(f, p.x-drag.ox, p.y-drag.oy);
  } else if (drag.kind === 'rot'){
    let a = Math.atan2(p.y-f.cy, p.x-f.cx)*180/Math.PI + 90;
    f.rot = norm(e.shiftKey ? a : Math.round(a/15)*15);
  } else if (drag.kind === 'size'){
    const a = f.rot*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
    const dx = p.x-f.cx, dy = p.y-f.cy, lx = dx*c + dy*s, ly = -dx*s + dy*c;
    const ax = -f.w/2, ay = -f.d/2;
    const nw = Math.max(100, Math.round((lx-ax)/10)*10), nd = Math.max(100, Math.round((ly-ay)/10)*10);
    const mx = ax + nw/2, my = ay + nd/2;
    f.cx += mx*c - my*s; f.cy += mx*s + my*c; f.w = nw; f.d = nd;
  }
  renderFurn(); renderSel();
});

function onPointerEnd(e){
  touches.delete(e.pointerId);
  if (pinch){ if (touches.size < 2) pinch = null; return; }   // kahden sormen eleen jälkeen jäljelle jäävä sormi ei enää käynnistä toimintoa
  endDrag(e.type === 'pointercancel');
}
svg.addEventListener('pointerup', onPointerEnd);
svg.addEventListener('pointercancel', onPointerEnd);
// estetään iPad Safaria tulkitsemasta kahden sormen elettä koko sivun zoomaukseksi
['gesturestart','gesturechange','gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault()));

svg.addEventListener('wheel', e => {
  e.preventDefault();
  const r = svg.getBoundingClientRect();
  zoomAt(view.s*Math.exp(-e.deltaY*(e.ctrlKey ? .01 : .0015)), e.clientX-r.left, e.clientY-r.top);
}, {passive:false});
svg.addEventListener('dblclick', e => { if (ui.tool==='select' && e.target.closest('[data-fid]')) rotateSel(90); });
svg.addEventListener('contextmenu', e => { if (ui.tool==='measure'){ e.preventDefault(); ui.mA = null; renderMeasure(); } });


/* ======================= Näppäimet ======================= */
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  if (window.View3D?.walking()) return;
  const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
  if (mod && k === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y'){ e.preventDefault(); redo(); return; }
  if (mod && k === 'd'){ e.preventDefault(); duplicateSel(); return; }
  if (mod) return;
  if (k === '[' || k === ']'){ drawer(k === '[' ? 'lib' : 'panel'); return; }
  if (k === 'f' && e.shiftKey){ toggleFullscreen(); return; }
  if (k === 't') setView(is3D() ? '2d' : '3d');
  else if (is3D() && ['v','m','x','w','k','u','f','+','=','-'].includes(k)) return;
  else if (k === 'v') setTool('select');
  else if (k === 'm') setTool('measure');
  else if (k === 'x') setTool('demolish');
  else if (k === 'w') setTool('wall');
  else if (k === 'k') setTool('fixture');
  else if (k === 'u') setTool('route');
  else if (k === 'f') fitView();
  else if (k === 'r') rotateSel(e.shiftKey ? -90 : 90);
  else if (k === 'delete' || k === 'backspace'){ e.preventDefault(); deleteSel(); }
  else if (k === 'escape'){ if (ui.mA){ ui.mA = null; renderMeasure(); } else if (ui.wA){ ui.wA = ui.wCur = null; renderMeasure(); } else { if (ui.tool !== 'select') setTool('select'); select(null); } }
  else if (k.startsWith('arrow') && ui.sel?.kind === 'fixture'){
    e.preventDefault();
    const f = FIXTURES.find(f => f.id === ui.sel.id), st = e.shiftKey ? 100 : 10;
    if (f) moveFixtureTo(f.id, {x:f.x + (k==='arrowright' ? st : k==='arrowleft' ? -st : 0), y:f.y + (k==='arrowdown' ? st : k==='arrowup' ? -st : 0), rot:f.rotation_deg});
  }
  else if (k.startsWith('arrow') && ui.sel?.kind === 'furn'){
    e.preventDefault(); const st = e.shiftKey ? 100 : 10;
    mutate(() => { const f = getF(ui.sel.id); if (k==='arrowleft') f.cx -= st; if (k==='arrowright') f.cx += st; if (k==='arrowup') f.cy -= st; if (k==='arrowdown') f.cy += st; });
  }
  else if (k === '+' || k === '=') zoomCenter(1.25);
  else if (k === '-') zoomCenter(.8);
});

/* ======================= Kalustekirjasto ======================= */
function buildLib(){
  $('#lib').innerHTML = LIB.map((c,ci) => `<h4>${nm(c.cat)}</h4><div class="lib-grid">${c.items.map((it,ii) => {
    const [t,n,w,d,col] = it, pad = Math.max(w,d)*.08;
    return `<div class="item" data-key="${ci}:${ii}" title="${tr('Napsauta lisätäksesi tai vedä haluamaasi kohtaan pohjapiirroksessa', 'Click to add, or drag onto the plan')}">
      <svg viewBox="${-w/2-pad} ${-d/2-pad} ${w+2*pad} ${d+2*pad}">${furnSVG(t,w,d,col)}</svg><b>${esc(nm(n))}</b><small>${w}×${d}</small></div>`;
  }).join('')}</div>`).join('') + `<div class="hint">${tr(
    `Kalusteet piirretään todellisessa koossa (mm). ${COARSE ? 'Napauta lisätäksesi keskelle tai vedä oikealle pohjapiirroksen / 3D-lattian haluamaasi kohtaan (pystysuuntainen pyyhkäisy vierittää listaa).' : 'Napsauta lisätäksesi keskelle tai vedä suoraan pohjapiirrokseen / 3D-lattialle.'} Lisäyksen jälkeen voit muokata leveyttä, syvyyttä ja väriä oikealla.`,
    `Furniture is drawn at real size (mm). ${COARSE ? 'Tap to place at the center, or hold and drag right onto the plan / 3D floor (swipe up/down to scroll).' : 'Click to add at the center, or drag onto the plan / 3D floor.'} Edit size and color in the right panel afterwards.`)}</div>`;
  document.querySelectorAll('.item').forEach(el => el.addEventListener('pointerdown', e => {
    if (e.button) return;
    libDrag = {el, id:e.pointerId, sx:e.clientX, sy:e.clientY, it:itemOf(el), ghost:null};
  }));
}
const itemOf = el => { const [ci, ii] = el.dataset.key.split(':').map(Number); return LIB[ci].items[ii]; };

// Kalustekirjaston veto ja pudotus: toteutettu pointer-tapahtumilla (HTML5-veto ei ole luotettava iPadilla).
// Listalla on touch-action:pan-y, joten pystysuuntaisen pyyhkäisyn selain vierittää (laukaisee pointercancelin) ja vain vaakasuuntainen veto aloittaa pudotuksen.
let libDrag = null;
// Näyttökoordinaatit → pohjapiirroksen koordinaatit (mm). 2D:ssä pohjapiirroksen koordinaatit, 3D:ssä säteen ja lattian leikkauspiste; s = näytön pikseleitä per mm kyseisessä kohdassa
function dropPoint(x, y){
  const r = $('#stage').getBoundingClientRect();
  if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
  if (document.elementFromPoint(x, y)?.closest('aside.open,#fab,#walkOverlay,#joy,#walkExit')) return null;
  if (is3D()) return window.View3D?.groundAt(x, y) || null;
  const p = toMM({clientX:x, clientY:y}); return {x:p.x, y:p.y, s:view.s};
}
addEventListener('pointermove', e => {
  if (!libDrag || e.pointerId !== libDrag.id) return;
  const {it} = libDrag;
  if (!libDrag.ghost){
    if (Math.hypot(e.clientX-libDrag.sx, e.clientY-libDrag.sy) < TAP) return;
    const g = libDrag.ghost = document.createElement('div'); g.id = 'ghost';
    g.innerHTML = `<svg viewBox="${-it[2]/2} ${-it[3]/2} ${it[2]} ${it[3]}">${furnSVG(it[0],it[2],it[3],it[4])}</svg>`;
    document.body.appendChild(g); libDrag.el.classList.add('dragging');
  }
  // haamukuva näytetään todellisessa koossa pudotuskohdan mittakaavassa (3D:ssä lähellä suurempi, kaukana pienempi)
  const g = libDrag.ghost, s = Math.max(dropPoint(e.clientX, e.clientY)?.s || (is3D() ? .05 : view.s), .02);
  Object.assign(g.style, {width:Math.max(28, it[2]*s)+'px', height:Math.max(20, it[3]*s)+'px', left:e.clientX+'px', top:e.clientY+'px'});
  const lib = $('aside.lib');
  if (narrow() && lib.classList.contains('open') && e.clientX > lib.getBoundingClientRect().right) drawer(null);   // laatikko sulkeutuu automaattisesti vedettäessä sen ulkopuolelle
});
function endLibDrag(e, ok){
  if (!libDrag || e.pointerId !== libDrag.id) return;
  const d = libDrag; libDrag = null;
  d.el.classList.remove('dragging');
  if (d.ghost){
    d.ghost.remove();
    if (!ok) return;
    const p = dropPoint(e.clientX, e.clientY);
    if (p) addItem(d.it, p.x, p.y);
    else if (is3D() && e.clientX > $('#stage').getBoundingClientRect().left) toast(tr('Pudota lattialle', 'Drop it on the floor'));
    return;
  }
  if (!ok) return;
  // napautus: sijoitetaan valitun huoneen keskelle, muuten näkymän keskelle (3D:ssä näytön keskikohtaa vastaava lattiakohta)
  let p = null;
  if (ui.sel?.kind === 'room'){ const b = bbox(ROOMS.find(r => r.id===ui.sel.id).poly); p = {x:(b[0]+b[2])/2, y:(b[1]+b[3])/2}; }
  else if (is3D()){ const r = $('#stage').getBoundingClientRect(); p = window.View3D.groundAt(r.left + r.width/2, r.top + r.height/2); }
  if (!p) p = {x:view.x0 + svg.clientWidth/2/view.s, y:view.y0 + svg.clientHeight/2/view.s};
  addItem(d.it, p.x, p.y);
  closeDrawers();
}
addEventListener('pointerup', e => endLibDrag(e, true));
addEventListener('pointercancel', e => endLibDrag(e, false));

/* ======================= Tuonti ja vienti ======================= */
function download(name, blob){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
function exportPNG(){
  if (is3D()) return window.View3D.shot();
  const clone = svg.cloneNode(true), W = 3200, H = Math.round(W*BOUNDS.h/BOUNDS.w);
  clone.setAttribute('viewBox', `${BOUNDS.x} ${BOUNDS.y} ${BOUNDS.w} ${BOUNDS.h}`);
  clone.setAttribute('width', W); clone.setAttribute('height', H);
  clone.querySelector('#gSel').innerHTML = '';
  clone.querySelector('#gGrid').innerHTML = `<rect x="-20000" y="-20000" width="55000" height="55000" fill="${ui.layers.grid?'url(#grid)':'#f7f4ee'}"/>`;
  const bg = document.createElementNS('http://www.w3.org/2000/svg','rect');
  Object.entries({x:-20000,y:-20000,width:55000,height:55000,fill:'#f7f4ee'}).forEach(([k,v]) => bg.setAttribute(k,v));
  clone.insertBefore(bg, clone.querySelector('#gGrid'));
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(img, 0, 0, W, H);
    cv.toBlob(b => download(tr('sisustussuunnitelma', 'floor-plan-design') + '.png', b));
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
}

/* ======================= Sekalaista ======================= */
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }

/* ======================= 2D / 3D -vaihto ======================= */
let viewMode = '2d', switching = false;
const is3D = () => viewMode === '3d';
const TIPS = () => COARSE
  ? {'2d':tr('Napauta tai vedä kirjastosta · yksi sormi panoroi · nipistä zoomataksesi · valitun kalusteen alapalkki kiertää / kopioi / poistaa', 'Tap or drag from the library · 1 finger pans · pinch zooms · bottom bar rotates / duplicates / deletes'),
     '3d':tr('Yksi sormi kiertää · kaksi sormea zoomaa / panoroi · napauta kalustetta tai lattiaa muokataksesi · napauta ovea avataksesi', '1 finger orbits · 2 fingers zoom / pan · tap furniture or floor to edit · tap doors to open')}
  : {'2d':tr('Vedä kaluste pohjapiirrokseen · vieritä zoomataksesi · vedä tyhjästä panoroidaksesi · T = 3D', 'Drag furniture onto the plan · scroll to zoom · drag empty space to pan · T for 3D'),
     '3d':tr('3D pysyy synkronoituna pohjapiirroksen kanssa · paneelin muutokset tulevat heti voimaan · T = 2D', '3D stays in sync with the plan · panel edits apply instantly · T for 2D')};
async function setView(m){
  if (m === viewMode || switching) return;
  if (!window.View3D) return toast(tr('3D-moottori latautuu vielä tai lataus epäonnistui (three.js vaatii verkkoyhteyden)', '3D engine is still loading or failed to load (three.js needs a network connection)'));
  switching = true; document.body.classList.add('busy');
  viewMode = m;
  if (m === '3d'){ if (ui.tool !== 'select') setTool('select'); ui.mA = null; document.body.classList.add('m3d'); await window.View3D.enter(); }
  else { document.body.classList.remove('m3d'); await window.View3D.exit(); applyView(); }
  $('#tip').textContent = TIPS()[m];
  switching = false; document.body.classList.remove('busy');
}
document.querySelectorAll('.menu-pop .btn').forEach(b => b.addEventListener('click', () => b.closest('details').open = false));
document.querySelectorAll('#viewSeg .btn').forEach(b => b.onclick = () => setView(b.dataset.view));

document.querySelectorAll('#tools .btn').forEach(b => b.onclick = () => setTool(b.dataset.tool));
document.querySelectorAll('#layers .btn').forEach(b => b.onclick = () => {
  const k = b.dataset.layer; ui.layers[k] = !ui.layers[k]; b.classList.toggle('on', ui.layers[k]);
  if (k === 'dims') $('#gDims').setAttribute('display', isDefaultUnit() && ui.layers.dims ? 'inline' : 'none');
  else if (k !== 'wallSnap') renderAll();
});
$('#zoomIn').onclick = () => zoomCenter(1.25);
$('#zoomOut').onclick = () => zoomCenter(.8);
$('#fit').onclick = fitView;
$('#s60').onclick = () => { setRatio(60); toast(tr('Näytetään mittakaavassa 1:60 (sama kuin alkuperäisessä piirroksessa)', 'Showing at 1:60 (same scale as the original plan)')); };
$('#s100').onclick = () => setRatio(100);
// Touch releases remain responsive even when Chromium suppresses the click after a drag.
for (const [id, action] of [['undo',undo],['redo',redo]]){
  const button=$('#'+id); let down=null;
  button.onpointerdown=e=>{down={x:e.clientX,y:e.clientY};};
  button.onpointerup=e=>{
    if ((e.pointerType==='touch'||e.pointerType==='pen') && down && Math.hypot(e.clientX-down.x,e.clientY-down.y)<TAP) action();
    down=null;
  };
  button.onpointercancel=()=>{down=null;};
  button.onclick=e=>{if(e.pointerType!=='touch'&&e.pointerType!=='pen')action();};
}
$('#clearAll').onclick = clearLayout;

/* Koko näyttö: standardi-API + Safarin (iPad) webkit-etuliitteellinen versio */
const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function toggleFullscreen(){
  const de = document.documentElement;
  if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else {
    const req = de.requestFullscreen || de.webkitRequestFullscreen;
    if (!req) return toast(tr('Selain ei tue koko näytön tilaa — Safarissa voit käyttää "Lisää Koti-valikkoon" ja avata sivun koko näytöllä', 'Fullscreen is not supported here — in Safari, use "Add to Home Screen" to open it fullscreen'));
    Promise.resolve(req.call(de)).catch(() => toast(tr('Koko näyttöön siirtyminen epäonnistui', 'Could not enter fullscreen')));
  }
}
function syncFullscreen(){
  const on = !!fsEl(), b = $('#fullscreen');
  b.textContent = '⛶ ' + (on ? tr('Poistu koko näytöstä', 'Exit fullscreen') : tr('Koko näyttö', 'Fullscreen'));
  b.title = (on ? tr('Poistu koko näytöstä', 'Exit fullscreen') : tr('Koko näyttö', 'Fullscreen')) + ' (Shift+F)';
}
$('#fullscreen').onclick = toggleFullscreen;
['fullscreenchange', 'webkitfullscreenchange'].forEach(t => document.addEventListener(t, syncFullscreen));
// kun avattu kotinäytöltä erillisenä sovelluksena, se on jo koko näytöllä, joten painike piilotetaan
if (navigator.standalone || matchMedia('(display-mode: standalone)').matches) $('#fullscreen').hidden = true;
$('#tgLib').onclick = () => drawer('lib');
$('#tgPanel').onclick = () => drawer('panel');
// kosketusnäytöllä valikon ulkopuolelle napauttaminen sulkee Tiedosto-valikon
document.addEventListener('pointerdown', e => { const m = $('details.menu'); if (m.open && !m.contains(e.target)) m.open = false; });
matchMedia('(max-width:1100px)').addEventListener('change', () => drawer(null));
drawer(null);                                  // palautetaan paneelien edellinen piilotustila
$('#exportPng').onclick = exportPNG;
$('#exportJson').onclick = () => download(tr('sisustussuunnitelma', 'floor-plan-design') + '.json', new Blob([JSON.stringify(state, null, 2)], {type:'application/json'}));
$('#importJson').onclick = () => $('#fileIn').click();
$('#fileIn').onchange = e => {
  const file = e.target.files[0]; if (!file) return;
  backgroundUI.cancelPending(); const generation=++planImportGeneration;
  (async () => {
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Suunnitelma ylittää 8 MiB:n rajan');
      const next=window.UnitModel.parseDesign(JSON.parse(await file.text()), defaults);
      await backgroundUI.prepare(next.background ?? null);
      if (generation !== planImportGeneration) return;
      // Persist before swapping the live plan, including recovery from corrupt storage.
      window.UnitModel.saveDesign(localStorage,next);
      const b=snap(); state=next; storageBlocked=false; cancelPlanImport();
      pushHistory(undoStack,b); redoStack.length=0; project(); ui.sel=null;
      fitView(); renderAll(); toast(tr('Suunnitelma tuotu','Plan imported'));
    } catch(err){
      if (generation !== planImportGeneration) return;
      console.error(err); toast(tr('Virheellinen tuonti tai tallennus epäonnistui. Aiempi suunnitelma säilyi.','Invalid import or save failed. Previous plan preserved.'));
    }
  })();
  e.target.value = '';
};
$('#reset').onclick = () => { if (confirm(tr('Palautetaanko oletussuunnitelma? (voi kumota)', 'Reset to the default design? (undoable)'))){
  cancelPlanImport(); backgroundUI.cancelPending(); const b=snap(), wasBlocked=storageBlocked;
  state=structuredClone(defaults); storageBlocked=false; project(); ui.sel=null;
  if (!commit(b)) storageBlocked=wasBlocked; fitView(); renderAll();
} };
// Näytön suunnan vaihto, otsikkorivin rivitys ym. muuttavat piirtoalueen kokoa; kun koko palautuu nollasta (esim. ensimmäinen asettelu), sovitetaan ikkunaan uudelleen
// muissa kokomuutoksissa (paneelien piilotus / näyttö ym.) näkymän keskikohta pysyy paikallaan
let lastW = 0, lastH = 0;
new ResizeObserver(() => {
  const w = svg.clientWidth, h = svg.clientHeight; if (!w) return;
  if (!lastW) fitView();
  else { view.x0 -= (w - lastW)/2/view.s; view.y0 -= (h - lastH)/2/view.s; applyView(); }
  lastW = w; lastH = h;
}).observe(svg);

function setLang(l){
  LANG = l; try { localStorage.setItem(LANG_KEY, l); } catch(e) {}
  applyStaticLang(); syncFullscreen(); syncModeHint(); syncPaneBtns();
  buildLib(); renderOpenings(); renderAll();
  $('#tip').textContent = TIPS()[viewMode];
  window.View3D?.relang();
}
$('#langBtn').onclick = () => setLang(LANG === 'en' ? 'fi' : 'en');

applyStaticLang(); syncFullscreen();
buildDefs(); buildLib(); renderOpenings(); renderDims();
$('#tip').textContent = TIPS()['2d'];
fitView(); renderAll();
