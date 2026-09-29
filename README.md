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
