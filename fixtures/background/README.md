# Synteettiset pohjakuvat

Ei henkilötietoja tai oikeaa asuntoa. Alkuperäiset tavut toimivat tuonti- ja
vientitestien vertailuna.

- calibration-600x400.png: 600×400; merkkien keskukset (50,200), (550,200),
  väli 500 lähdepikseliä. Testin 4000 mm antaa 8 mm/lähdepikseli.
- tiny.png: kelvollinen 1×1 valkoinen PNG.
- photo.jpg: 3×2 JPEG; photo-orientation-6.jpg sisältää lisäksi EXIF-kierron 6,
  jolloin selaimen orientoitu koko on 2×3. Alkuperäistä JPEG:tä ei muuteta.
- vector-two-page.pdf: sivut 200×100 ja 100×200 PDF-pistettä;
  jälkimmäisen kierto 90°, joten lähdekoordinaatisto on 200×100.
- vector-one-page.pdf: yksi 200×100 vektorisivu.
- scanned-one-page.pdf: yksi sivu ja upotettu synteettinen JPEG.
- scanned-oversized-image.pdf: 200×100 pisteen sivu, jonka 5000×5000 harmaakuva
  (pakattuja nollatavuja) ylittää 20 miljoonan pikselin purkurajan. Noin 25 KiB:n
  tiedosto testaa, ettei liian suuri skannaus katoa onnistuneeksi tulkitusta sivusta.
- encrypted.pdf: pieni salattu testiasiakirja; broken.pdf on tahallisesti rikki.

Selainkokeet renderöivät alkuperäiset aineistot paikallisella PDF.js-workerilla.
Kosketuskalibrointi käyttää napautuksia, siirto Chromiumin kosketustapahtumia.
Kilpailutilannetesti viivästyttää lukijaa, ei aseta editorin tilaa.
