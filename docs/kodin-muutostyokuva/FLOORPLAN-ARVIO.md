# juancuiule/floorplan — hyödylliset periaatteet Kodin muutostyökuvalle

Arvio 2026-10-02. Vertailu: oma FP:n V1.1-toimitus `33796eb`, kanoninen
`unit-v1` sekä seuraavaksi mahdollinen rajattu pohjakuvan jäljentäminen.
Tutkittu julkisen repon `main`-versio on
[`4aaab5cec04f3f955a4d1166715134c71a9873ac`](https://github.com/juancuiule/floorplan/tree/4aaab5cec04f3f955a4d1166715134c71a9873ac).
Alla faktat perustuvat tämän version lähdekoodiin; ehdotukset ovat meidän
sovelluksemme tarpeista tehtyjä johtopäätöksiä. Sovelluskoodia ei muutettu.

## Arvio lyhyesti

Projekti sopii periaatteiden lähteeksi etenkin sisustamisen ja vaihtoehtoisen
rakenteen kokeiluun. Meille arvokkain asia on samaan lähtömalliin perustuvan
muutosnäkymän johdonmukaisuus: seinän poisto muuttaa sekä geometriaa että sitä
käyttäviä toimintoja. Kanonisen mallin tai tallennuksen korvaajaksi projekti ei
sovi. Meillä `baseline + changes` sekä mittojen alkuperätiedot ovat jo tätä
vahvempi perusta.

## Varmennetut periaatteet ja soveltuvuus

| Varmennettu toteutus | Hyöty meille | Soveltaminen |
| --- | --- | --- |
| `Plan` sisältää kiinteän kuoren, aukot, huoneet ja suunnittelusäännöt. `DecorFile` sisältää layoutin kalusteet, pintamateriaalit ja suunnitelmaviitteen. | Lähtötilan ja ehdotuksen erottaminen. | Säilytetään oma `baseline + changes`; kalusteet, liite ja editoritila pysyvät suunnitelmakuoressa. Ei uutta rinnakkaista Plan/Layout-mallia. |
| `activeShell()` johtaa lähtökuoresta muutosnäkymän, myös seinän mukana poistuvat aukot ja siihen kiinnitetyt osat. Esteet käyttävät `activeWalls()`- ja `activeBulges()`-näkymiä. | Sama geometria renderöintiin ja myöhempiin tarkistuksiin. | Käytetään edelleen `apply()`/`projectUnit()`-ketjua. Uusi snap tai tarkistus ei saa lukea eri mallia kuin editorin kuva. |
| Bounds, huoneiston sisäpiste ja muut esityksen tarvitsemat luvut johdetaan geometriasta. | Vähentää käsin ylläpidettäviä ja ristiriitaisia arvoja. | Mallista johdettavat luvut lasketaan, mutta johdettua lukua ei muuteta kenttämittaukseksi. |
| Uuden esineen luonnos jätetään tallennuksesta pois; siirrettävä esine tallennetaan vanhaan paikkaan, kunnes pudotus hyväksytään. Historia tallentaa hyväksytyt muutokset. | Peruuta ei jätä keskeneräistä geometriaa tiedostoon tai historiaan. | Jäljentämisen osoitinluonnos pidetään erillään hyväksytystä mallista; yksi valmis seinä/polygoni on yksi kumottava muutos. |
| Osaseinäpoisto säilyttää jäljelle jäävän seinän tunnisteen ja korjaa aukkojen offsetit. Kiinnitetyn esineen hostin säilyminen tarkistetaan. | Viitteiden elinkaari ei ole pelkkää kuvan piilottamista. | Kun aukkojen ja seinämuutosten työkalut laajenevat, tarkistetaan kaikki riippuvat viitteet yhdessä. Ei lisätä osaseinäpoistoa jäljentämisen sivutuotteena. |
| Rakennemuutos vaikuttaa testeissä kulkemiseen, kalusteen törmäykseen, seinäsnappiin sekä mittauksen esteisiin. | Käyttäytymisen läpileikkaava testi paljastaa vanhaan geometriaan jäävän toiminnon. | Seuraavan osuuden testit tarkistavat 2D/3D-kuvan, viennin, historian ja alkuperätiedot samalla jäljennetyllä elementillä. |

Lähteet: [Plan](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/model/plan.ts),
[DecorFile](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/model/decor.ts),
[activeShell ja host-viitteet](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/project/structure.ts#L110),
[johdetut luvut](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/project/derived.ts),
[esteiden mallilähde](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/plan/obstacles.ts#L41),
[committedOf ja historia](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/decor/store.ts#L579),
[rakenteen läpileikkaavat testit](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/unit/structure.test.ts#L146).

Meillä vastaava perusta on jo tiedostoissa `src/model/apply.ts`,
`src/model/render-unit.ts`, `src/io/design.ts` ja `src/io/unit.ts`.
`src/model/validate.ts` tarkistaa skeeman lisäksi esimerkiksi duplikaattitunnukset,
seinän nollapituuden, aukon sopimisen isäntäseinään sekä huonepolygonin
sulkeutumisen, pinta-alan ja itseleikkauksen. Se tarkistaa myös alkuperätiedot.
Vertailuprojektin yksinkertaisempi lähtömalli ei tuo syytä purkaa näitä.

## Pääagentin 3D-, käyttöliittymä- ja suorituskykyhavainnot

**Piirretään tarvittaessa, ei jatkuvasti.** `Scene.tsx` käyttää
`frameloop="demand"`-asetusta, aluksi 60 lämmittelyruutua ja sen jälkeen
muutoksen pyytämää `invalidate()`-kutsua. Varjojen automaattinen päivitys on
pois päältä; `requestShadowUpdate()` ajoittaa tarvittavat varjoruudut.
Meidän `src/view3d/view3d.js:1146–1158` renderöi aktiivista 3D-näkymää jatkuvassa
RAF-silmukassa. Periaate voisi vähentää paikallaan olevan näkymän GPU-kuormaa
ilman Reactiin siirtymistä. Hyötyä akulle tai Z Fold3:n nopeudelle ei ole mitattu.
Ennen muutosta mitataan nykyinen toteutus ja testataan kameran vaimennus,
ovianimaatiot, kävely, valinta, näkymän vaihto ja kuvavienti: jokaisen tulee
herättää renderöinti ja pysähtyä oikein. Lähteet:
[Scene](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/scene/Scene.tsx),
[varjojen ajoitus](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/scene/shadows.ts).

**Mittarit ennen optimointia.** `FrameCounter` julkaisee draw callien,
kolmioiden, geometrioiden ja tekstuurien määrät. `scripts/perf.mjs` erottaa
idle-ruudut pakotetusta jatkuvasta renderöinnistä sekä sallii DPR:n vaihtamisen.
Canvas rajaa DPR:n välille 1–1,5. Meille hyödyllinen toimitustodiste olisi
samasta pienestä mallista mitattu lepo, kameran liike ja kalusteen siirto
390×844-näkymässä sekä oikealla testipuhelimella. Pelkkä lepotilan ruutumäärä
ei ole GPU:n maksiminopeuden mittaus. Skriptien Metal-käynnistysargumentteja
ei siirretä Windows/Android-ympäristöön. Lähde:
[suorituskykyskripti](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/scripts/perf.mjs).

**Staattisen esityksen yhdistäminen säilyttää loogiset tunnisteet.** `Merged.tsx`
yhdistää samanmateriaalista staattista geometriaa. Liikkuvat osat voivat jäädä
yhdistämättä (`noMerge`), valinta säilyttää `decorId`/`host`-parent-ketjun ja
väliaikainen geometria vapautetaan lopuksi. Tämä on myöhempi optimointimalli,
jos mittarit näyttävät draw callien olevan pullonkaula. Kanonisia seiniä,
aukkoja tai niiden lähdeviitteitä ei yhdistetä renderöintimeshin mukana.
Lähteet: [Merged](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/scene/Merged.tsx),
[osumasta lähde-elementtiin](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/decor/placement.ts).

**Näkyvä, ohitettava napsautusapu.** `guides.ts` palauttaa sekä siirtokorjauksen
että apuviivat ja etäisyysmerkinnät. Laskenta on erillään Reactista ja tapahtuu
pinnan 2D-koordinaatistossa. Tämä sopii päätepisteiden yhdistämisen ja
kohtisuoruuden esikatselun lähtöperiaatteeksi jäljentämisessä. Repon 30 mm:n
napsautusrajaa ei kopioida: kosketuksen osumatoleranssi johdetaan CSS-pikseleistä
mallin millimetreiksi nykyisen zoomin mukaan. Se on käyttöliittymän toleranssi,
ei lähdemitan tarkkuus. Avusteelle tarvitaan puhelimessa näkyvä ohitus.
`placement.ts` pyöristää x/z:n senttimetreihin; meidän mittausgeometriaamme
tätä pyöristystä ei siirretä. Lähteet:
[napsautuslaskenta](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/decor/guides.ts),
[sijoittelun pyöristys](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/decor/placement.ts).

**Testiskriptin nimi ei takaa regressiotarkistusta.**
`tests/e2e/render-on-demand.mjs` tallentaa kuvia ja tulostaa ruutumääriä, mutta
ei esitä niiden tuloksille assert-ehtoja. `package.json`-tiedoston `test:e2e`
ajaa vain `smoke.mjs`-skriptin. Meille kopioitava periaate on animaatioiden
testaaminen, ei oletus kaikkien näiden skriptien automaattisesta läpäisystä.
Omissa testeissä ruudun pitäisi muuttua toiminnon aikana ja rauhoittua sen
jälkeen; kosketusele tehdään oikeilla osoitintapahtumilla. Lähteet:
[render-on-demand-tarkastelu](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/e2e/render-on-demand.mjs),
[ajokomennot](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/package.json).

Prioriteetti: ensin rajattu jäljentämistyökalu nykyiseen malliin, sitten
testipuhelimen suorituskykymittaus ja sen perusteella mahdollinen tarvittaessa
renderöinti. Geometrian yhdistäminen, sisustusvaihtoehtojen A/B-käyttöliittymä
ja monimutkaiset valaistusefektit jätetään myöhemmäksi. React/React Three Fiber
ei ole näiden periaatteiden soveltamisen edellytys.

## Mitä ei kannata siirtää sellaisenaan

**Suorakulmioihin ja tiettyyn asuntoon sidottu geometria.** Huoneet, lattiat ja
katot ovat `Rect`-alueita. `wallFrame()` osaa yleisen suoran suunnan, mutta
osaseinän säilyttämisen `axisRange()`/`wallRect()` valitsevat vain x- tai
z-akselin. Tästä ei voi päätellä mielivaltaisen vinon tai monikulmaisen
huoneiston kattavaa tukea. Meidän huonepolygoneja ja millimetrimallia ei pidä
muuttaa suorakulmioiksi. Lähteet:
[geometriatyypit](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/model/types.ts),
[wallFrame](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/geometry/walls.ts#L28),
[akselisuuntainen osaseinä](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/project/structure.ts#L68).

**TypeScript-tyyppi ei korvaa tuontivalidointia.** Suunnitelmat tuodaan
`import.meta.glob<Plan>()`-kutsulla ja valitaan tunnisteen avulla. Tässä
latauspolussa ei ole ajonaikaista skeema- tai topologiatarkistusta.
Käyttöohje luettelee ladattavien suunnitelmien skeeman, seinäliitosten, aukkojen
ja huoneiden validoinnin edelleen puuttuvaksi. Layoutin lukeminen tarkistaa
lähinnä objektin ja `items`-taulukon; se ei validoi jokaista kalustetta tai
`version`-kenttää. Lähteet:
[plan-lataus](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/project/plan.ts),
[layoutin lukeminen](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/decor/store.ts#L187),
[ohjeen puuttuvat osat](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/docs/your-own-floorplan.md#toward-a-platform).

**Sallittujen seinäpoistojen lista ei ole rakennetekninen arvio.**
`walls.removable` rajaa poistettavat seinät suunnitelman kirjoittajan listaan;
`normalizeStructure()` suodattaa muut tunnukset pois. Tämä on hyvä
käyttöliittymän raja, mutta listan oikeellisuutta tai rakennetta koodi ei
todista. Meillä kantavuuden väite tarvitsee nykyiset lähdeviitteensä;
käyttäjän klikkaus tai pohjakuvan jäljentäminen ei todista sitä. Lähteet:
[sääntöjen data](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/model/plan.ts#L53),
[rakenteen normalisointi](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/model/structure.ts#L25).

**Kulkutilan värit ovat heuristiikka.** `clearancesOf()` ampuu yhdeksän sädettä
kalusteen joka sivulta, hakee lähimmän esteen enintään neljän metrin päästä,
ohittaa alle kahden senttimetrin raot ja luokittelee rajat 0,45/0,60 metriin.
Tämä voi myöhemmin auttaa esittämään suunnittelun ongelmakohtia. Se ei osoita
esteettömyysvaatimusten täyttymistä, kääntöympyrää, koko kulkureitin jatkuvuutta
tai ovilehden pyyhkäisytilaa. Ehdotus: palataan erilliseen ohjeelliseen
kulkutilan näyttöön vasta jäljentämisen ja kenttämittausten jälkeen, omien
tarkistettujen sääntöjen pohjalta. Lähteet:
[clearance-algoritmi ja rajat](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/plan/clearance.ts),
[sen yksikkötestit](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/unit/clearance.test.ts).

**Tallennusratkaisu ei vastaa paikallista toimitustamme.** Layoutit ja
kuva-aineistot kirjoitetaan Viten kehityspalvelimen API:n kautta repon
tiedostoihin. Staattisen julkaisun puuttuva API käsitellään tilana, jossa
tallennus ei ole käytettävissä. Autosave merkitsee sisällön `lastSaved`-tilaan
ennen PUTin onnistumista, ei tarkista HTTP-statusta ja nielee verkkovirheen.
Suoraan tiedostoon kirjoittava API tarkistaa `items`-taulukon mutta ei koko
mallia. Tällaista virhekäyttäytymistä ei siirretä meille. Nykyinen paikallinen
tallennus ja JSON-vienti säilytetään, ja virhe ei saa korvata toimivaa mallia.
Lähteet:
[API:n puuttuminen](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/decor/store.ts#L181),
[autosave](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/src/decor/store.ts#L729),
[PUT-tallennus](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/server/studioApi.ts#L185),
[layout-tiedostojen elinkaari](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/server/layouts.ts).

## Seuraavan rajatun jäljentämisosan suositus

1. Luonnostellaan yksi seinä tai suljettu huonepolygoni nykyisen kalibroidun
   taustakuvan päällä. Näyttö- ja lähdepisteet muunnetaan nykyisen yhteisen
   koordinaattimuunnoksen kautta millimetreiksi. Ei uutta 3D-pohjaista
   kanonista koordinaatistoa eikä automaattista kuvantulkintaa.
2. Luonnos ei muuta baselinea, tallennusta tai mittastatuksia ennen
   hyväksymistä. Peruuttaminen pudottaa vain luonnoksen. Hyväksyminen validoi
   irrotetun malliehdokkaan ja tekee yhden kumottavan muutoksen.
3. Jäljennettyjen koordinaattien ja piirustuksesta luettujen mittojen tila
   pysyy `inferred/archive_drawing`, ja lähdeviite yhdistää alkuperäisen
   liitteen SHA-256-tunnisteen sekä sivun. Napsautus tai snap ei anna
   kenttämittauksen tarkkuutta eikä mittaajan kuittausta.
4. Noudatetaan nykyisen [arkkitehtuurin](ARKKITEHTUURI.md) §5.6/§6.5:n
   erottelua: jäljentäminen mallintaa olemassa olevaa asuntoa, ja varsinaiset
   muutostyöt kuuluvat `changes`-kerrokseen. Lähtöpiirustuksessa olevan seinän
   jäljentäminen ei tarkoita `add_wall`-muutosehdotusta. Nykytilan malliehdokas
   validoidaan ennen hyväksymistä; keskeneräinen luonnos ei korvaa toimivaa
   suunnitelmaa. Tästä ei tarvitse keksiä uutta Plan/Layout-sopimusta.
5. Lisätään pieni synteettinen vinon seinän tai ei-suorakulmaisen huoneen
   fixture. Testataan luonnoksen peruutus, yksi hyväksytty historiavaihe,
   2D/3D-projektio, JSON-kierros ja alkuperätiedot sekä todellinen
   kosketuskäyttö. Näin kopioidaan vertailuprojektin testien periaate ilman
   sen asuntoon sidottua geometriarajausta.

Tämä on ehdotus seuraavan osuuden rajaukseksi, ei toteutettu ominaisuus eikä
CHECKLISTin kuittaus. V1.1:n avoimet pilotti-, liite-esimerkki- ja
kenttätestipäätökset säilyvät avoimina.

## Tarkistusten ja lisenssin tila

Luettu tarkistetun commitin mallityypit, suunnitelman lataus, johdettu geometria,
rakenteen muutosnäkymä, esteet, clearance, layoutin tila ja tallennus sekä
niiden olennaiset yksikkötestit. Lähdekoodista varmennettuja testitapauksia ovat
esimerkiksi seinän osapoisto ja host-viitteet, lähtömallin säilyminen,
layout-kierros, luonnoksen poissulkeminen tallennuksesta ja rikkinäisen
layoutin autosaven keskeytys. Testit löytyvät
[structure.test.ts](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/unit/structure.test.ts),
[store.test.ts](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/unit/store.test.ts),
[walls.test.ts](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/unit/walls.test.ts),
[layouts.test.ts](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/unit/layouts.test.ts)
ja [layoutsClient.test.ts](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/tests/unit/layoutsClient.test.ts).

Vertailuprojektia ei asennettu eikä sen testejä tai suorituskykymittauksia
ajettu tässä arvioinnissa. Testien olemassaolo ja koodin tarkastelu eivät
vahvista niiden läpäisyä tai puhelimen suorituskykyä. Oma aiempi V1.1:n CI
ei myöskään todista tämän ulkopuolisen projektin toimivuutta.

Tarkistetun commitin koko tiedostopuusta ei löytynyt nimeltään
LICENSE/LICENCE/COPYING/NOTICE-tiedostoa, ja GitHubin repo-API ilmoitti
`license: null`. Tämä on tarkistuksen havainto, ei juridinen arvio.
Tästä arviosta ei voi päätellä koodin tai kuvatiedostojen uudelleenkäytön ehtoja;
arvio koskee periaatteita. Käyttöohje kertoo lisäksi
`public/artwork`-kuvien olevan omistajan oma kirjasto. Lähteet:
[tarkistettu tiedostopuu](https://api.github.com/repos/juancuiule/floorplan/git/trees/4aaab5cec04f3f955a4d1166715134c71a9873ac?recursive=1),
[repo-metatiedot](https://api.github.com/repos/juancuiule/floorplan),
[kuvakirjaston ohje](https://github.com/juancuiule/floorplan/blob/4aaab5cec04f3f955a4d1166715134c71a9873ac/docs/your-own-floorplan.md#5-hang-your-artwork).
