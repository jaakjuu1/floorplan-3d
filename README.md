# Kodin muutostyökuva

Selaimessa toimiva asunnon muutostyö- ja esteettömyyssuunnittelun työkalu.
Asunnon nykytila mallinnetaan kerran (tuotu malli tai pohjakuvasta jäljennetty),
muutokset piirretään sen päälle erilliseksi muutoskerrokseksi, ja 2D-pohja,
3D-näkymä sekä ohjeelliset säännöt johdetaan samasta mallista. Jokaisella mitalla
on alkuperä (mitattu, piirustuksesta luettu tai oletus). Kehitys ja
tuotantokäännös käyttävät Viteä; ensisijainen käyttöympäristö on työpöytäselain.

Arkkitehtuuri ja vaiheet: [ARKKITEHTUURI.md](docs/kodin-muutostyokuva/ARKKITEHTUURI.md),
[CHECKLIST.md](docs/kodin-muutostyokuva/CHECKLIST.md). Nykytila ja kokeiluohje:
[TILA.md](docs/kodin-muutostyokuva/TILA.md).

## Muutostyön suunnittelu

**Nykytila pohjakuvasta (V1.1–V1.2)**
- Tuo PDF/PNG/JPEG-pohjakuva, kohdista ja kalibroi kahdella pisteellä
- Jäljennä seinäketjut, ovet ja ikkunat (kaksi napautusta aukon reunoille) sekä
  huoneet. Jäljennös menee nykytilaan, mitat `inferred`/`archive_drawing`
  liitteen SHA-256- ja sivuviitteellä

**Muutoskerros (2D ja 3D)**
- Valitse seinä, aukko tai kiintokaluste 2D- tai 3D-näkymästä; paneeli näyttää
  mitat alkuperineen ja muutostoiminnot
- Pura ja palauta seinä, muuta oven karmiaukkoa ja vapaata leveyttä, poista
  kynnys, vaihda lattia tai kiintokaluste
- Uusi seinä (`W`, suunta lukittuu suoraksi ja pää napsahtaa seiniin; Shift = vapaa kulma) ja kiintokaluste kuten tukikahva (`K`); kiintokalusteen siirto
  vetämällä, nuolinäppäimillä ja `R`-kierrolla
- Muutoslista yleisnäkymässä, yksittäisen muutoksen peruminen; purettava
  keltaisena, uusi ja muutettu punaisena
- 3D:n elementit ovat Three.js-objekteja metodeineen, esim.
  `View3D.model.wall('w2').demolish()` (`src/model/edit.ts`)

**Säännöt ja esteettömyys**
- Ohjeelliset säännöt virallisine lähteineen (asunto-osakeyhtiölaki,
  rakentamislaki, kosteus- ja esteettömyysasetukset, vammaispalvelulaki).
  Ne näkyvät, kun muutos tai valinta koskee niitä, eivätkä estä muokkausta
- Muokattavat mitoitusperusteet (standardin oletukset), suurin vapaa ympyrä,
  wc:n sivutila, kulkureitti (`U`) kapeimman kohdan raportilla ja 3D-kävely
  pyörätuolitilassa. Lähteet: [SAANNOT.md](docs/kodin-muutostyokuva/SAANNOT.md)

## Ominaisuudet

**2D-pohjapiirros**
- Näytetään alkuperäisessä mittakaavassa 1:60 / 1:100, mitat millimetreinä
- Vedä vasemmasta kalustekirjastosta yli 60 kalustetta ja kodinkonetta (makuuhuone, olohuone, ruokailu ja keittiö, kylpyhuone, kodinkoneet, työhuone ja vapaa-aika)
- Siirrä vetämällä, kierrä (Shift = vapaa kulma), muuta kokoa; kalusteet kiinnittyvät automaattisesti seiniin
- Mittatyökalu (kiinnittyy lähellä oleviin seiniin, Shift lukitsee vaaka- tai pystysuuntaan)
- Pura ei-kantavia seiniä; kantavat seinät on merkitty erikseen
- Tasojen kytkimet: mitat, huoneiden nimet, kalusteet, ruudukko, kantavat seinät

**3D-näkymä**
- Useita kuvakulmia: kierto ylhäältä, viisto ja suoraan ylhäältä; huonelistasta napsauttamalla lennetään haluttuun huoneeseen
- Kävelytila: työpöydällä WASD + hiiri, kosketuslaitteilla virtuaalinen ohjaussauva; ovia voi avata ja sulkea napauttamalla
- Täysikorkeat / leikatut seinät, auringon ajan liukusäädin, yökuvan valaistus
- Yksityiskohtaiset kalustemallit: kaapinovien saumat ja kahvat, pehmustetut sängynpäädyt, metalli- ja keraamipinnat ympäristöheijastuksilla jne.
- Kalusteita voi valita ja vetää myös 3D-näkymässä, ja muutokset synkronoituvat reaaliajassa 2D-pohjaan

**Suunnitelma ja tilastot**
- Huoneiden pinta-alat ja asunnon nettopinta-ala lasketaan automaattisesti
- Vaihda jokaisen huoneen lattiamateriaali (tammiparketti, laatta, marmori, terrazzo, matto jne.); kustannusarvio (€) lasketaan pinta-alasta + 5 % hukka
- Kumoa / tee uudelleen; suunnitelma tallentuu automaattisesti selaimen paikalliseen tallennustilaan
- Käyttöliittymän kielen vaihto suomi / English (painike ylhäällä oikealla, oletuksena suomi, valinta muistetaan)
- Vie PNG-kuvana, vie / tuo suunnitelma JSON-tiedostona

## Pika-aloitus

```bash
git clone <repositorion-osoite>
cd <repositorion-hakemisto>
npm install
npm run dev
```

Avaa terminaalin näyttämä paikallinen osoite. Tarvitset Node.js 22.12+ tai 24+.
Tuotantoversion muodostaminen ja paikallinen esikatselu:

```bash
npm run build
npm run preview
```

Three.js 0.160.0 sisältyy käännökseen npm-paketista. HTML:n avaaminen suoraan
tiedostona ei enää käynnistä sovellusta. Tallennukset säilyvät samalla selaimen
alkuperällä (protokolla, palvelin ja portti). Jos siirryt vanhasta `file://`- tai
toisesta palvelinosoitteesta, vie suunnitelma vanhassa sovelluksessa JSONina ja
tuo se uuteen osoitteeseen.

## Pikanäppäimet

| Näppäin | Toiminto |
| --- | --- |
| `T` | Vaihda 2D / 3D |
| `V` / `M` / `X` | Valitse / mittaa / pura seinä |
| `W` / `K` / `U` | Uusi seinä / kiintokaluste / kulkureitti |
| Nuolet, `R` | Siirrä (Shift 100 mm) ja kierrä valittua kalustetta tai kiintokalustetta |
| `R` / `Shift+R` | Kierrä valittua kalustetta 90° myötä- / vastapäivään |
| `Delete` / `Backspace` | Poista valittu kaluste tai suunniteltu lisäys, merkitse kartoitettu seinä purettavaksi, poista jäljennös nykytilasta |
| `Ctrl/⌘ + D` | Kopioi valittu kaluste |
| `Ctrl/⌘ + Z`, `Ctrl/⌘ + Shift + Z` | Kumoa, tee uudelleen |
| `F` | Sovita ikkunaan |
| `+` / `-` | Lähennä / loitonna |
| `[` / `]` | Näytä / piilota vasen kalustekirjasto, oikea paneeli |
| `Shift + F` | Koko näyttö |
| `Esc` | Peru nykyinen toiminto |
| Kävely: `WASD` / nuolet, `Shift`, `E` | Liiku, juokse, avaa / sulje ovi |

## Teknologiat

- HTML / CSS, Vite ja TypeScript; 2D/3D-esityskerros on JavaScriptiä
- 2D-pohjapiirros piirretään SVG:llä
- 3D-näkymä käyttää [Three.js](https://threejs.org/) r160 -kirjastoa (OrbitControls, PointerLockControls, RoundedBoxGeometry, RoomEnvironment, CSS2DRenderer)
- Tiedot tallennetaan `localStorage`en

## Oman pohjapiirroksen käyttö

Tiedosto → Tuo JSON hyväksyy kanonisen `unit-v1`-huoneistomallin, sovelluksen
oman suunnitelmaviennin ja vanhan editorin JSON-viennin. Tuonti tarkistaa sekä
rakenteen että muutosoperaatioiden lopputilan ennen nykyisen suunnitelman vaihtoa.
Ominaisuudet → Pohjakuva → Tuo PDF/PNG/JPEG avaa paikallisen esikatselun.
Valitse PDF-sivu ja hyväksy esikatselu. Avaa kohdistuksen lukitus, syötä tunnettu
etäisyys millimetreinä ja napauta Kalibroi kaksi pistettä. Valitse kaksi pistettä
pohjakuvasta; ensimmäisen pisteen sijainti säilyy. X/Y (mallin millimetrit,
y ylöspäin), kierto, siirto sormella, läpinäkyvyys ja näkyvyys säätyvät samassa
paneelissa. Lukitse kohdistus lopuksi. Sivun tai tiedoston vaihtaminen nollaa
kalibroinnin. Piirustusmitta pysyy `inferred/archive_drawing`-tietona.

Yksi alkuperäinen liite säilyy suunnitelmakuoren `background.source.data`-kentässä
base64-muodossa sekä paikallistallennuksessa että JSON-viennissä. Liitettä ei
lähetetä palvelimelle; PDF.js ja worker sisältyvät paikalliseen käännökseen.
Tuonti ja kalibrointi eivät muuta huoneistomallia tai sen mittojen statuksia.
Rajat: tiedosto 2 MiB, esikatselu 4 miljoonaa pikseliä, kuvan purkukoko
20 miljoonaa pikseliä ja PDF 100 sivua. Tallennuskiintiön täyttyessä muutos
perutaan ja aiempi suunnitelma säilyy. Historia rajataan myös 16 MiB:iin
kumpaakin pinoa kohden. PWA/offline-asennus ei vielä kuulu toimitukseen.
Kalibroinnin jälkeen saman paneelin "Jäljennä nykytila" -osio jäljentää seinät,
aukot ja huoneet nykytilaan.
Puhelimessa avaa Ominaisuudet; kalibrointitila sulkee paneelin ja näyttää
piirtoalueella Lopeta-painikkeen. Käytä yläreunan zoom-painikkeita tarvittaessa.

Demoasunnon rakenne on `examples/demo-unit.json`:ssa. Sen mitat ovat vanhasta
piirrostoteutuksesta siirrettyjä oletuksia (`assumed`, `archive_drawing`), eivät
kenttämittauksia. Tarkkuutta tai mittausten kuittaajaa ei ole keksitty.
Kalustekirjasto ja lattiamateriaalien hinnasto säilyvät editorissa.

## V0: yhteinen huoneistomalli ja editori

2D- ja 3D-näkymät johdetaan samasta `unit-v1`-mallista. Lähtötila (`baseline`)
säilyy muuttumattomana; purku ja lattiamateriaalin vaihto tallentuvat
`changes`-operaatioiksi. Tavoitetilan muodostaa yhteinen `apply`.

Suunnitelmavienti on `kodin-design-v2`: se sisältää kanonisen mallin `unit`-kentässä
sekä irtokalusteet, huoneiden näyttönimet ja editorin näyttömittaukset. Jälkimmäiset
eivät ole kanonisia kenttämittauksia. Pelkkä huoneistomalli voidaan viedä RK:hon
suunnitelman `unit`-kentästä.

V1.1 lisää valinnaisen `background`-kentän samaan suunnitelmakuoreen;
vanhat v2-viennit ja V0:n siirto säilyvät luettavina. Tallennusmuoto ja
koordinaatit: [V1.1-SOPIMUS.md](docs/kodin-muutostyokuva/V1.1-SOPIMUS.md).

Vanha `huxing-design-v1` siirretään automaattisesti uuteen tallennusavaimeen.
Alkuperäinen avain säilyy koskemattomana ja vanha JSON säilyy myös viennin
`legacy`-kentässä. Siirto on toistettava. Jos tallennus on vioittunut, sovellus
ilmoittaa virheestä ja estää automaattitallennuksen, kunnes tuot kelvollisen
suunnitelman tai palautat oletussuunnitelman. Ota vanhasta tallennuksesta tai
JSON-viennistä kopio ennen sen poistamista; sovellus ei poista sitä puolestasi.

Kanoninen malli on `rakennuspiirustus-automaatio`-repon Pydantic-malli
`src/rakennuskuva/unit_models.py`. Sen vienti kopioidaan
`schemas/unit-input-v1.schema.json`-tiedostoon. `npm run types:generate` tuottaa
TypeScript-tyypit; `npm run types:check` havaitsee vanhentuneen tuloksen.

- `src/io/unit.ts`: validoiva `parseUnit`, JSON-luku/vienti ja keskitetty y-akselin muunnos.
- `src/model/apply.ts`: seitsemän muutosoperaatiota; lähtömalli ja operaatiot säilyvät muuttumattomina.
- `src/model/render-unit.ts`: yhteinen keskilinjaseinien, aukkojen ja huoneiden näyttögeometria.
- `src/io/design.ts`: suunnitelman validointi ja palautettava tallennussiirto.
- `src/plan2d/editor.js`, `src/view3d/view3d.js`: nykyisen editorin näkymät.
- `examples/demo-unit.json`: nykyinen demoasunto kanonisessa muodossa, sama tiedosto RK:ssa.
- `examples/accessibility-unit.json`: synteettinen kylpyhuone ja eteinen, kapea ovi ja kynnys.
- `fixtures/unit/` ja `fixtures/apply/`: molemmissa repoissa ajettavat samat JSON-tapaukset.

Tarkistukset:

```bash
npm ci
npm run types:check
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
node tools/check-contract-sync.mjs --rk ../rakennuspiirustus-automaatio
```

Playwright käyttää valmiiksi asennettua Chromiumia: Windowsissa oletus on Edge;
muussa ympäristössä aseta `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` selaimen poluksi.
Testit kattavat työpöydän ja 390×844-kosketusnäkymän. Selainasennusta ei tehdä.
Kuvakaappaukset tallennetaan `docs/kodin-muutostyokuva/screenshots/`-hakemistoon.
`E2E_PHASE=model` erottaa integraation kuvat aiemmista lähtötilan kuvista.
Vinot seinät piirtyvät molemmissa näkymissä; kalusteiden seinään napsautus
tukee tässä vaiheessa akselinsuuntaisia seiniä.

RK:ssa ajetaan `uv run pytest -q`, `uv run python tools/export_unit_schema.py --check`
ja `uv run python tools/sync_skills.py --check`. RK:n CI vertaa sopimuskopioita
FP:n samannimiseen haaraan; julkisen FP:n CI ei tarvitse pääsyä yksityiseen RK-repoon.
Rajaus ja etenemispoikkeama: [V0-SOPIMUS.md](docs/kodin-muutostyokuva/V0-SOPIMUS.md).
