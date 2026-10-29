# Sancak ⚑

Avrupa haritasında **sıra tabanlı** strateji oyunu. Şehirlerini büyüt, tarlalarını sula, demirci ve liman kur, ordunu generallerinle yönet, bütün rakipleri yık.

**Oyna:** depo herkese açık olduğunda https://mehmetustattsc.github.io/sancak/ (GitHub Pages ücretsiz planda yalnız açık depolarda çalışır).
Telefonda tarayıcı menüsünden "Ana ekrana ekle" ile uygulama gibi kurulur, ilk açılıştan sonra internetsiz de çalışır.

## Durum (sürüm 0.3)
- **Orta Çağ**, iki sefer: İber Yarımadası (6 ülke, kara savaşı) ve İtalya ve Akdeniz (6 ülke + tarafsız adalar, deniz savaşı)
- Yakın Çağ ve Modern Çağ menüde "Yakında" olarak duruyor
- Referanslar: European War 4 (harita, generaller), War Regions (sadelik), Medieval: Total War (arazi, kale, general etkisi)

## Kurallar özeti
| Konu | Kural |
|---|---|
| Tur | Oyuncu hamlelerini yapar, "Devam et" der; rakipler sırayla oynar (izle, hızlandır ya da atla) |
| Birlik | Her hücrede tek birlik, can çubuğu, seviye (▲). Kılıçlı > Atlı > Okçu > Kılıçlı (×1,5). Kendi birliklerinin içinden geçilir |
| Saldırı | Saldıran yerinde kalır; boşalan hücreye başka birlik sürülür. Atlı düşmanı yok ederse 1 hücre daha gider |
| Kule | Her tur bir tane, kendi boş araziye; 2 turda biter, inşaatta yarı savunma; saldırmaz, karşılık verir |
| Ticaret | Başkentte tur başına 3 takas: 10 gıda→12 altın, 18 altın→10 gıda, 25 altın→2 demir, 2 demir→14 altın |
| Kaynak | Altın (şehir), Gıda (tarla + şehir; her birlik 1 yer), Demir (demirci) |
| Şehir | 6 seviye; gelir, savunma (+%8/sv), iyileşme. Ele geçirilen şehir 1 seviye düşer |
| Kale | 4 seviye; savunma +%30 … +%90 |
| Demirci | 3 seviye; demir üretir, atlıyı açar, 2–3. seviyede tecrübeli birlik |
| Tarla | 2 seviye; 2 / 4 gıda |
| Liman | 2 seviye; kadırga üretir. Kara birliği limandan denize çıkınca nakliyeye biner |
| General | Birliğe atanır; güç +%30…+%50, kendi türünde ek +%20…+%40, tur başı +10 iyileşme, yetenek. Birlik ölürse 3 tur yaralı |
| Zafer | Şehirlerin %60'ını al ya da bütün rakipleri yık. Yıldızlar tur sayısına göre |

## Proje yapısı
| Yol | İçerik |
|---|---|
| `src/engine.js` | Kurallar, savaş, ekonomi, yapay zekâ (DOM yok, Node'da da çalışır) |
| `src/art.js` | Birlik figürleri, bayraklar, general portreleri, bina simgeleri (SVG) |
| `src/ui.js`, `src/style.css`, `src/index.html` | Arayüz |
| `src/maps.json` | `tools/mapgen.py` ile Natural Earth verisinden üretilen hex haritalar |
| `public/` | Manifest, service worker, simgeler |
| `tools/build.py` | Tek dosyalık oyunu `web/` klasörüne derler |
| `tests/` | Yapay zekâ simülasyonu ve tarayıcı testleri |

## Geliştirme
```bash
npm test            # motor + denge kontrolü (bot bota karşı)
npm run build       # web/index.html
npm run test:smoke  # tarayıcıda menüler, seçim, hareket, saldırı, şehir, tur, kayıt, deniz
npm run serve       # http://localhost:8080
node tests/sim.js 6 # her ülke için 6 oyunluk denge tablosu
```
Haritayı yeniden üretmek için Natural Earth `ne_50m_admin_0_countries.geojson` gerekir: `NE=<klasör>/ python3 tools/mapgen.py`.

Her `main` gönderiminde testler çalışır, geçerse oyun GitHub Pages'e yayınlanır.

## Lisans
Kod © Mehmet. Harita verisi: [Natural Earth](https://www.naturalearthdata.com/) (kamu malı).
