# HK Mandiri Digital Market

Katalog minimarket digital HK Mandiri dengan 900 produk, flash sale, pencarian,
filter kategori, keranjang belanja, dan pemesanan melalui WhatsApp.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Validasi dan build produksi:

```bash
npm run check
npm run build
```

## Cloudflare Pages

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `22`

File `_redirects` dan `_headers` sudah disediakan di folder `public`.

## Sumber katalog

Data nama, merek, dan foto produk bersumber dari jaringan Open Food Facts. Harga adalah
estimasi harga pasar untuk kebutuhan katalog awal, sedangkan stok merupakan data
contoh. Data tersedia di bawah lisensi ODbL; foto produk tersedia di
bawah lisensi CC BY-SA.
