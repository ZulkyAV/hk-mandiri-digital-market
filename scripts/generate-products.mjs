import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TARGET_COUNT = Number.parseInt(process.env.TARGET_COUNT || '900', 10)
const PAGE_SIZE = 100
const SOURCES = [
  { key: 'food', label: 'Makanan', api: 'https://world.openfoodfacts.org/cgi/search.pl', maxPages: 10 },
  { key: 'beauty', label: 'Perawatan', api: 'https://world.openbeautyfacts.org/cgi/search.pl', maxPages: 4 },
  { key: 'products', label: 'Rumah', api: 'https://world.openproductsfacts.org/cgi/search.pl', maxPages: 3 },
  { key: 'pet', label: 'Hewan', api: 'https://world.openpetfoodfacts.org/cgi/search.pl', maxPages: 6 },
]
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = path.join(ROOT, 'src', 'data', 'products.json')
const CACHE_DIR = path.join(ROOT, '.catalog-cache')

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim()

function hash(value) {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function categoryFor(product, sourceKey) {
  const text = `${product.product_name} ${(product.categories_tags || []).join(' ')}`.toLowerCase()
  if (sourceKey === 'beauty') return 'Perawatan Diri'
  if (sourceKey === 'products') return 'Kebutuhan Rumah'
  if (sourceKey === 'pet') return 'Makanan Hewan'
  if (/olive|zaitun|cooking oil|minyak goreng/.test(text)) return 'Sembako'
  if (/water|drink|beverage|juice|tea|coffee|kopi|soda|syrup|sirup|susu|milk|minuman/.test(text)) return 'Minuman'
  if (/rice|beras|flour|tepung|sugar|gula|oil|minyak|salt|garam|sembako/.test(text)) return 'Sembako'
  if (/biscuit|cookie|wafer|chip|snack|candy|chocolate|cokelat|permen|keripik|camilan/.test(text)) return 'Camilan'
  if (/sauce|sambal|soy|kecap|seasoning|bumbu|spice|rempah|coconut milk|santan/.test(text)) return 'Bumbu & Masak'
  if (/cereal|oat|breakfast|sarapan|jam|selai|bread|roti/.test(text)) return 'Susu & Sarapan'
  if (/frozen|ice cream|es krim|nugget|sosis/.test(text)) return 'Makanan Beku'
  if (/soap|shampoo|detergent|toothpaste|sabun|sampo|pasta gigi|cleaner|pembersih/.test(text)) return 'Kebutuhan Rumah'
  return 'Makanan'
}

function quantityInBaseUnit(quantity = '') {
  const match = clean(quantity).toLowerCase().match(/([\d.,]+)\s*(kg|g|ml|l)\b/)
  if (!match) return 500
  const amount = Number.parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(amount)) return 500
  if (match[2] === 'kg' || match[2] === 'l') return amount * 1000
  return amount
}

function estimatePrice(product, category, seed) {
  const amount = Math.min(Math.max(quantityInBaseUnit(product.quantity), 50), 5000)
  const text = `${product.product_name} ${product.brands} ${(product.categories_tags || []).join(' ')}`.toLowerCase()
  const variation = 0.92 + (seed % 17) / 100

  if (/olive|zaitun/.test(text)) return Math.round((150_000 * Math.max(amount, 250) / 1000 * variation) / 500) * 500
  if (/(indomie|mie sedaap|instant noodle|mi instan|mie instan|mi goreng)/.test(text) && amount <= 180) return 3_500 + (seed % 3) * 500
  if (/(air mineral|mineral water|bottled water|aqua|le minerale)/.test(text)) return Math.round((3_500 * Math.max(amount, 330) / 600 * variation) / 500) * 500
  if (/(teh pucuk|teh botol|jasmine tea|iced tea)/.test(text) && amount <= 600) return 4_000 + (seed % 3) * 500
  if (/(cooking oil|minyak goreng)/.test(text)) return Math.round((19_000 * Math.max(amount, 500) / 1000 * variation) / 500) * 500
  if (/(rice|beras)/.test(text)) return Math.round((15_000 * Math.max(amount, 1000) / 1000 * variation) / 500) * 500
  if (/(detergent|deterjen|rinso)/.test(text)) return Math.round((24_000 * Math.max(amount, 700) / 800 * variation) / 500) * 500
  if (/(uht|fresh milk|susu cair)/.test(text)) return Math.round((19_500 * Math.max(amount, 200) / 1000 * variation) / 500) * 500
  const baseByCategory = {
    Minuman: 7500,
    Sembako: 14500,
    Camilan: 8500,
    'Bumbu & Masak': 7000,
    'Susu & Sarapan': 17000,
    'Makanan Beku': 22000,
    'Kebutuhan Rumah': 18000,
    'Perawatan Diri': 25000,
    'Makanan Hewan': 28000,
    Makanan: 10500,
  }
  const base = baseByCategory[category]
  const sizeMultiplier = 0.62 + Math.sqrt(amount / 500) * 0.52
  const raw = Math.min(Math.max(base * sizeMultiplier * variation, 2500), 185000)
  return Math.round(raw / 500) * 500
}

function displayName(product) {
  const brand = clean(product.brands?.split(',')[0])
  const rawName = clean(product.product_name)
    .replace(/^\d{8,14}\s*[-–:]?\s*/, '')
    .replace(/(\d[\d.,]*)\s*(kg|g|ml|l)\s+\2\b/gi, '$1$2')
  const rawQuantity = clean(product.quantity)
  const quantity = /\d[\d.,]*\s*(kg|g|ml|l)\b/i.test(rawQuantity) ? rawQuantity : ''
  const nameHasBrand = rawName.toLowerCase().includes(brand.toLowerCase())
  const nameHasQuantity = /\d[\d.,]*\s*(kg|g|ml|l)\b/i.test(rawName)
  return clean(`${nameHasBrand ? '' : brand} ${rawName} ${nameHasQuantity ? '' : quantity}`)
}

async function fetchPage(source, page) {
  const cacheName = source.key === 'food' ? `popularity-page-${page}.json` : `${source.key}-popularity-page-${page}.json`
  const cacheFile = path.join(CACHE_DIR, cacheName)
  try {
    return { rows: JSON.parse(await readFile(cacheFile, 'utf8')), cached: true }
  } catch {
    // Cache belum ada; lanjut ambil dari API.
  }

  const params = new URLSearchParams({
    action: 'process',
    json: '1',
    tagtype_0: 'countries',
    tag_contains_0: 'contains',
    tag_0: 'indonesia',
    sort_by: 'popularity',
    off_query: '1',
    page_size: String(PAGE_SIZE),
    page: String(page),
    fields: 'code,product_name,brands,image_front_url,quantity,categories_tags,countries_tags',
  })

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const response = await fetch(`${source.api}?${params}`, {
        headers: { 'User-Agent': 'HKMandiriCatalog/1.0 (https://github.com/ZulkyAV/hk-mandiri-digital-market)' },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const rows = (await response.json()).products || []
      await mkdir(CACHE_DIR, { recursive: true })
      await writeFile(cacheFile, JSON.stringify(rows), 'utf8')
      return { rows, cached: false }
    } catch (error) {
      if (attempt === 10) throw error
      const backoff = Math.min(30_000, 6_500 + attempt * 2_000)
      process.stdout.write(`${source.label} ${page} tertunda (${error.message}); coba lagi ${attempt}/10\n`)
      await sleep(backoff)
    }
  }
  return { rows: [], cached: false }
}

async function run() {
  const products = []
  const seenCodes = new Set()
  const seenNames = new Set()

  for (const source of SOURCES) {
    for (let page = 1; page <= source.maxPages && products.length < TARGET_COUNT; page += 1) {
      const { rows, cached } = await fetchPage(source, page)
      for (const row of rows) {
        const code = clean(row.code)
        const brand = clean(row.brands?.split(',')[0])
        const imageUrl = clean(row.image_front_url)
        const name = displayName(row)
        const normalizedName = name.toLowerCase()

        if (!code || !/[a-z]/i.test(brand) || !name || !imageUrl.startsWith('https://images.open')) continue
        if (seenCodes.has(code) || seenNames.has(normalizedName)) continue

        const seed = hash(`${code}-${name}`)
        const category = categoryFor(row, source.key)
        const price = estimatePrice(row, category, seed)
        const isFlashSale = seed % 9 === 0
        const discountPercent = isFlashSale ? [10, 15, 20, 25, 30][seed % 5] : 0

        products.push({
          id: `prd-${code}`,
          code,
          name,
          brand,
          category,
          price,
          originalPrice: isFlashSale ? Math.ceil(price / (1 - discountPercent / 100) / 500) * 500 : price,
          stock: 120 + (seed % 781),
          imageUrl: imageUrl.replace(/\.200\.jpg$/, '.400.jpg'),
          isFlashSale,
          discountPercent,
        })
        seenCodes.add(code)
        seenNames.add(normalizedName)
        if (products.length === TARGET_COUNT) break
      }
      process.stdout.write(`${source.label} ${page}: ${products.length}/${TARGET_COUNT} produk\n`)
      if (!cached) await sleep(6_500)
    }
  }

  if (products.length < TARGET_COUNT) {
    throw new Error(`Hanya menemukan ${products.length} produk valid; target ${TARGET_COUNT}.`)
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(products, null, 2)}\n`, 'utf8')
  process.stdout.write(`Selesai: ${products.length} produk ditulis ke ${OUTPUT}\n`)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
