# V0:n toteutussopimus

## Ensimmäinen tekninen osuus (lähtötilanne)

Ensimmäinen rajaus 2026-09-29 oli kanoninen huoneistosopimus ja selainpohja.
V0 ei valmistunut kokonaan siinä osuudessa: nykyisen demo-asunnon muunto,
semanttisen mallin kytkentä editoriin, vinot seinät ja vanhan tilan siirto
siirtyivät jäljempänä kuvattuun editori-integraatioon.
V1:n pohjapiirustustuontia ei toteuteta.

Käyttäjä sallii V0:n etenemisen vaiheen −1 pilottikohteen ja liite-esimerkkien
keskeneräisyydestä huolimatta. Avoimia kohtia ei kuitata; ne tarvitaan ennen
vastaavia kenttä- ja hyväksymistestejä.

## Omistus ja järjestys

- A (Luna): `tmp/rakennuspiirustus-automaatio/`-repon
  `src/rakennuskuva/unit_models.py`, `unit_apply.py`,
  `tools/export_unit_schema.py`, `tests/test_unit*.py` sekä generoitu
  `schemas/unit-input-v1.schema.json`. Vanha project-input-v2 säilyy ennallaan.
- C (Luna): FP:n `tests/e2e/`, `playwright.config.ts`, `tools/serve-static.mjs`,
  `fixtures/unit/`, `fixtures/apply/`, `examples/accessibility-unit.json`,
  `tools/check-contract-sync.mjs` ja testien kuvakaappaukset. C tuottaa ensin
  nykyisen editorin läpäisevän savutestin. Fixturet vasta A:n mallin valmistuttua.
- B (Luna): FP:n `index.html`, `src/legacy/`, `src/main.ts`, `package.json`,
  `package-lock.json`, `tsconfig.json`, `vite.config.ts`. Rakennemuutos vasta C:n
  vihreän alkutestin jälkeen. Ensimmäinen siirto säilyttää vanhan toimintalogiikan.
- Pääagentti: FP:n `src/model/`, `src/io/unit.ts`, generoidut tyypit ja
  skeemakopio, mallin testiajuri, CI, dokumentit, integraatio ja Git molemmissa
  repoissa. Pakettilisäykset sovitaan B:n kanssa, ei rinnakkaisia lockfile-muutoksia.
- Sol: valmiin integraation lukukatselmointi testien jälkeen, ei tiedostomuutoksia.

## Yhteinen sopimus

RK:n nykyisessä `input_models.py`:ssä on Measurement mutta ei huoneistomallia.
Uuden mallin kanoninen määrittely tulee A:n Pydantic-toteutuksesta. TS-tyypit
generoidaan sen skeemasta; käsin ylläpidettyä rinnakkaista tyyppisopimusta ei tehdä.

- `schema_version: "unit-v1"`, koordinaatit millimetreinä, x oikealle ja y ylös.
  Arkkitehtuurin §5:n elementit ja alkuperäkentät ovat lähtökohta. Uusi mittausmalli
  on erillinen vanhasta v2:sta, jonka vapaa method-kenttä säilyy yhteensopivana.
- Mitat ovat Measurement-olioita myös muutosoperaatioissa. Tuntematon tarkkuus
  on null; lähdeviitettä tai kuittaajaa ei keksitä. Piirustus/rekisteri/oletus ei
  kelpaa measured-menetelmäksi. Vanhat menetelmänimet muunnetaan vain tuontirajalla.
- Huoneen monikulmio sisältää lopuksi alkupisteen. Id:t ovat yksilöllisiä koko
  baselinessa; viittaukset tarkistetaan. Tuntemattomat kentät hylätään.
- `apply(baseline, changes)` palauttaa uuden baselinen muuttamatta syötteitä.
  Operaatiot suoritetaan järjestyksessä. Tuntematon kohde, päällekkäinen id ja
  virheellinen lopputila hylätään. Mittausten alkuperä säilyy.
  Puuttuvat valinnaiset kentät säilyvät puuttuvina; baselinen kuusi kokoelmaa
  palautetaan aina listoina. Pythonin JSON-vertailussa käytetään
  `model_dump(mode="json", by_alias=True, exclude_unset=True)`.
- Seitsemän operaatiota: demolish_wall, add_wall, modify_opening,
  remove_threshold, add_fixture, replace_fixture ja change_finish (§5.6).
  Seinän purku poistaa sen aukot sekä niiden kynnykset. Korvaava kaluste säilyttää
  kohteen id:n. Pintamuutos päivittää huoneen floor/walls-kentät.
  Kohdetilasta poistetaan myös poistettuihin elementteihin viittaavat raakamitat;
  alkuperäisen baselinen mittaukset ja niiden alkuperä säilyvät koskemattomina.
- Yhteinen apply-fixture on `{ "baseline": ..., "changes": [...],
  "expected": ... }` tai virhetapauksessa `{ "baseline": ..., "changes": [...],
  "error": true }`. Molemmat testiajurit tarkistavat myös syötteen muuttumattomuuden.
- Validointifixture on `{ "input": ..., "valid": true/false }`.
  C ja A sopivat konkreettiset esimerkit valmiin Pydantic-mallin perusteella.
- TS:n `parseUnit(unknown)` validoi ja palauttaa UnitInputs-arvon;
  `apply(baseline, changes)` noudattaa yllä olevaa sopimusta.
  Koordinaattien näyttömuunnos keskitetään `src/io/unit.ts`:ään.
  Näitä rajapintoja testataan tässä osassa ilman nykyisen editorin tilamallin vaihtoa.

## Todennus

Nykyinen editori ja Vite-versio: oikea Chromium, työpöytä ja 390×844 kosketus,
2D/3D, lisäys, purku, vienti/tuonti sekä vanhan tallennuksen uudelleenavaus.
RK: `uv run pytest -q` ja `uv run python tools/sync_skills.py --check`.
FP: tyyppigeneroinnin tarkistus, TypeScript-tarkistus, yhteiset fixturet,
tuotantokäännös ja Playwright. Kopioiden vertailu ja molempien repojen CI.

## V0:n editori-integraatio (2026-09-29)

Lähtötila tarkistettu: FP 697d6ca, RK 5e156cf, molemmat haarassa
claude/gracious-franklin-kg3pr1. FP:n muiden .gitignore ja .ignore säilytetään.
Lähtötestit: TS 30, Python 107, Chromium 2 (työpöytä ja 390×844 kosketus).

Järjestys: demo ja adapteri; editori ja tallennus; regressiot ja kuvien tarkistus;
Sol-lukukatselmointi; korjaukset ja tarkistukset; commitit, pushit ja CI.
Vaiheen −1 etenemispoikkeama säilyy. V1 ei kuulu työhön.

Tiedosto-omistus:
- A / Luna: examples/demo-unit.json, src/model/render-unit.ts,
  src/model/demo-presentation.ts, tests/render-unit.test.ts; RK:n demo-kopio,
  tests/test_demo_unit.py ja molempien tools/check-contract-sync.mjs (jos RK:ssa on kopio).
- B / Luna: src/legacy/editor.js, src/legacy/view3d.js ja niiden siirto
  src/plan2d/editor.js sekä src/view3d/view3d.js; src/main.ts; index.html tarvittaessa.
- C / Luna: tests/e2e/, tests/design.test.ts, fixtures/editor/ ja puhelinkuvat.
- Pääagentti: src/io/design.ts, package.json, dokumentit, muu integraatio ja Git.
  RK:ssa lisäksi minimaalinen `rk unit validate --input` ja sen CLI-testi;
  komento validoi mallin ja apply-tuloksen, ei hyväksy virallista tulostetta.
- Sol: vain valmiin kokonaisuuden lukukatselmointi.
Kaikki työskentelevät samassa työpuussa; muiden muutoksia ei palauteta.

Rajapinnat (kanoninen Pydantic unit-v1 ei muutu):
- projectUnit(unit: UnitInputs) render-unit.ts:ssä johtaa tavoitetilan applylla.
  Palauttaa { rooms, walls, openings, fixtures, demolishedWalls, bounds } näyttömillimetreissä.
  Room: {id,name,poly:[number,number][],mat,at:[number,number],counted?:boolean}.
  Wall: {id,a:[number,number],b:[number,number],thickness,kind,polygon,
  segments: {a,b,polygon}[],height?:number}. Aukot vähennetään segments-listasta.
  Opening: {id,host_wall,kind,a,b,polygon,thickness,width,height,sill,swing,
  h:[number,number],c:[number,number],o:[number,number],entry?:boolean,name?:string}.
  Aukon a/b ovat keskilinjalla; h on saranapiste, c sulkusuunta ja o avautumissuunta.
  bounds: {x,y,w,h}. Puuttuvat korkeudet saavat vain näyttöoletuksen.
  Fixtures ovat apply-tuloksen kiintokalusteita, jotka piirretään vain luettavana
  erillään editorin irtokalusteista. Kulmamuunnos keskitetään myös io/unit.ts:ään.
  Baseline ja muutokset pysyvät koskemattomina. demolishedWalls on lähtöseinien
  esitys purettujen seinien valintaa/palautusta varten. Koordinaattimuunnos vain io/unit.ts.
- Demo pitää vanhat seinä-id:t w0…w47 siirtoa varten. Aukkojen host-seinät voivat
  olla erillisiä aukon pituisia seinäosia. Esityksen poikkeamat (matala seinä,
  nimien asemointi, erkkerien laskenta, ulko-oven väri) ovat demo-presentation.ts:ssä,
  eivät toinen rakennegeometria. Huoneet ja rakenneseinät luetaan aina JSONista.
  Demoasetuksia käytetään vain demoasunnolle. Oven saranan paikka johdetaan
  aukon sijainnista ja isäntäseinän suunnasta, jotta aukon siirtäminen toimii.
- Design: {schema_version:'kodin-design-v2',unit:UnitInputs,furniture:[],rooms:{},
  measures:[],legacy?:unknown}. rooms säilyttää editorin nimimuutokset ja mat-valinnan;
  lattian muutos kirjoitetaan myös change_finish-operaationa ja renderöidään applysta.
  Irtokalusteet ja näyttömittaukset eivät ole kanonisia kenttämittauksia.
- design.ts: parseDesign(input, defaults), loadDesign(storage, defaults),
  saveDesign(storage, design); DEFAULT_STORE='kodin-design-v2', LEGACY_STORE='huxing-design-v1'.
  defaults on kelvollinen Design, jonka editori muodostaa demosta + defaultFurnituresta.
  parseDesign hyväksyy uuden suunnitelman, kanonisen unit-v1:n ja vanhan editoritilan.
  Pelkkä unit-tuonti saa tyhjän irtokalustelistan. Kaikki tarkistetaan ennen tilan vaihtoa.
  Vanha raakadata säilyy legacy-kentässä ja localStoragen alkuperäinen avain koskemattomana.
  Epäkelpoista uutta tallennusta ei korvata automaattisesti demolla.
- main.ts asettaa window.UnitModel={demoUnit,projectUnit,parseDesign,loadDesign,saveDesign}
  ennen klassisen editoriskriptin latausta. JS-editori pysyy muuten nykyisessä muodossa.
