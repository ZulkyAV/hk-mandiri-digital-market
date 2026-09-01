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

## Cloudflare Workers

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node.js version: `22`

Folder `dist` dipublikasikan sebagai Static Assets dan fallback SPA diatur melalui
`wrangler.jsonc`.

## Sumber katalog

Katalog awal dibuat dari data produk retail Indonesia agar nama dan foto berasal dari
pasangan data yang sama. Harga adalah estimasi untuk kebutuhan demo, sedangkan stok
merupakan data contoh. Sebelum dipakai untuk produksi, ganti katalog demo dengan data
dan aset resmi milik HK Mandiri atau distributor yang memberi izin penggunaan.
