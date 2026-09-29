# Kodin sisustussuunnittelu

Selaimessa toimiva asunnon sisustussuunnittelutyökalu: sijoita kalusteita 2D-pohjapiirrokseen, muokkaa seiniä, mittaa etäisyyksiä ja vaihda yhdellä painalluksella Three.js-pohjaiseen 3D-näkymään, jossa voit katsella kohdetta ylhäältä tai kävellä sisällä ensimmäisen persoonan näkymässä. Kehitys ja tuotantokäännös käyttävät Viteä.

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
| `R` / `Shift+R` | Kierrä valittua kalustetta 90° myötä- / vastapäivään |
| `Delete` / `Backspace` | Poista valittu kaluste |
| `Ctrl/⌘ + D` | Kopioi valittu kaluste |
| `Ctrl/⌘ + Z`, `Ctrl/⌘ + Shift + Z` | Kumoa, tee uudelleen |
| `F` | Sovita ikkunaan |
| `+` / `-` | Lähennä / loitonna |
| `[` / `]` | Näytä / piilota vasen kalustekirjasto, oikea paneeli |
| `Shift + F` | Koko näyttö |
| `Esc` | Peru nykyinen toiminto |
| Kävely: `WASD` / nuolet, `Shift`, `E` | Liiku, juokse, avaa / sulje ovi |

## Teknologiat

- HTML / CSS, Vite ja TypeScript; nykyinen editori säilyy aluksi JavaScriptinä
- 2D-pohjapiirros piirretään SVG:llä
- 3D-näkymä käyttää [Three.js](https://threejs.org/) r160 -kirjastoa (OrbitControls, PointerLockControls, RoundedBoxGeometry, RoomEnvironment, CSS2DRenderer)
- Tiedot tallennetaan `localStorage`en

## Oman pohjapiirroksen käyttö

Nykyisen editorin pohjapiirrostiedot ovat edelleen kovakoodattuja:

- `ROOMS`: huoneiden monikulmiot, nimet ja oletuslattiamateriaali
- `WALLS` / `WINS`: seinät ja ikkuna-aukot
- `MATS`: lattiamateriaalien nimet ja yksikköhinnat
- `LIB`: kalustekirjasto (tyyppi, nimi, oletuskoko, väri)
- `buildFurniture()`: eri kalustetyyppien 3D-mallit

Muokkaamalla näitä tietoja voit ottaa käyttöön oman pohjapiirroksesi.

## V0: yhteisen huoneistomallin perusta

Tässä osuudessa toteutetaan selainpohja ja erillinen `unit-v1`-mallisopimus.
Editorin nykyinen JSON ja `huxing-design-v1`-tallennus säilyvät ennallaan.
`unit-v1` ei vielä korvaa editorin demoasuntoa tai tallennusmuotoa. Seuraava
V0-osuus kytkee mallin 2D/3D-editoriin. PDF/PNG/JPEG-pohjapiirustustuonti kuuluu V1:een.

Kanoninen malli on `rakennuspiirustus-automaatio`-repon Pydantic-malli
`src/rakennuskuva/unit_models.py`. Sen vienti kopioidaan
`schemas/unit-input-v1.schema.json`-tiedostoon. `npm run types:generate` tuottaa
TypeScript-tyypit; `npm run types:check` havaitsee vanhentuneen tuloksen.

- `src/io/unit.ts`: validoiva `parseUnit`, JSON-luku/vienti ja keskitetty y-akselin muunnos.
- `src/model/apply.ts`: seitsemän muutosoperaatiota; lähtömalli ja operaatiot säilyvät muuttumattomina.
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
`E2E_PHASE` erottaa ennen/jälkeen-kuvat. Baseline-testi ohjaa vanhan sovelluksen
estetyn CDN-latauksen testissä samaan paikalliseen Three.js-versioon.

RK:ssa ajetaan `uv run pytest -q`, `uv run python tools/export_unit_schema.py --check`
ja `uv run python tools/sync_skills.py --check`. RK:n CI vertaa sopimuskopioita
FP:n samannimiseen haaraan; julkisen FP:n CI ei tarvitse pääsyä yksityiseen RK-repoon.
Rajaus ja etenemispoikkeama: [V0-SOPIMUS.md](docs/kodin-muutostyokuva/V0-SOPIMUS.md).
