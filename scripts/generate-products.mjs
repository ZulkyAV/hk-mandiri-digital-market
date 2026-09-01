import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TARGET_COUNT = Number.parseInt(process.env.TARGET_COUNT || '900', 10)
const PAGE_SIZE = 60
const API_ROOT = 'https://webcommerce-gw.alfagift.id/v2'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = path.join(ROOT, 'src', 'data', 'products.json')

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

function headers() {
  return {
    accept: 'application/json',
    'accept-language': 'id',
    devicemodel: 'chrome',
    devicetype: 'Web',
    fingerprint: 'hNvsXdRTVhrqH5gGgHkI8OnvtKOGC8E/vIk1u9NwkKyV1i1yorHlQQr52UMqtait',
    latitude: '0',
    longitude: '0',
    referer: 'https://alfagift.id/',
    trxid: String(Math.floor(Math.random() * 10_000_000_000)),
  }
}

async function fetchJson(url) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: headers(),
        signal: AbortSignal.timeout(40_000),
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      if (attempt === 5) throw error
      await sleep(attempt * 1_500)
    }
  }
  throw new Error('Tidak dapat mengambil katalog')
}

function categoryFor(product) {
  const top = clean(product.categoryNameLvl0).toLowerCase()
  const detail = `${product.productName} ${product.categoryNameLvl1} ${product.categoryNameLvl2}`.toLowerCase()

  if (/pet foods|makanan hewan/.test(top)) return 'Makanan Hewan'
  if (/personal care|kesehatan|ibu & anak/.test(top)) return 'Perawatan Diri'
  if (/kebutuhan rumah|lifestyle/.test(top)) return 'Kebutuhan Rumah'
  if (/segar|beku|frozen|es krim|ice cream|nugget|sosis/.test(`${top} ${detail}`)) return 'Makanan Beku'
  if (/minuman/.test(top)) return 'Minuman'
  if (/biskuit|wafer|snack|camilan|keripik|permen|cokelat|chocolate|kacang/.test(detail)) return 'Camilan'
  if (/beras|tepung|gula|minyak goreng|minyak masak|garam/.test(detail)) return 'Sembako'
  if (/bumbu|saus|sambal|kecap|santan|penyedap|rempah/.test(detail)) return 'Bumbu & Masak'
  if (/susu|sarapan|sereal|cereal|oat|roti|selai/.test(detail)) return 'Susu & Sarapan'
  if (/perlengkapan dapur|alat masak|wadah|tisu|pembersih/.test(detail)) return 'Kebutuhan Rumah'
  return 'Makanan'
}

function quantityInBaseUnit(name) {
  const match = clean(name).toLowerCase().match(/([\d.,]+)\s*(kg|g|ml|l)\b/)
  if (!match) return 500
  const amount = Number.parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(amount)) return 500
  return match[2] === 'kg' || match[2] === 'l' ? amount * 1_000 : amount
}

function estimatePrice(name, category, seed) {
  const text = name.toLowerCase()
  const amount = Math.min(Math.max(quantityInBaseUnit(name), 30), 10_000)
  const variation = 0.9 + (seed % 23) / 100

  if (/air mineral|mineral water/.test(text)) return Math.max(3_000, Math.round((3_500 * amount / 600 * variation) / 500) * 500)
  if (/mie|mi instan|instant noodle/.test(text) && amount <= 180) return 3_000 + (seed % 4) * 500
  if (/minyak goreng|minyak masak/.test(text)) return Math.round((19_000 * amount / 1_000 * variation) / 500) * 500
  if (/beras/.test(text)) return Math.round((15_000 * amount / 1_000 * variation) / 500) * 500
  if (/detergen|deterjen|rinso/.test(text)) return Math.round((24_000 * amount / 800 * variation) / 500) * 500

  const baseByCategory = {
    Makanan: 11_000,
    Minuman: 8_000,
    Sembako: 16_000,
    Camilan: 9_000,
    'Bumbu & Masak': 8_000,
    'Susu & Sarapan': 18_000,
    'Makanan Beku': 25_000,
    'Kebutuhan Rumah': 20_000,
    'Perawatan Diri': 28_000,
    'Makanan Hewan': 24_000,
  }
  const base = baseByCategory[category] || 12_000
  const sizeMultiplier = 0.65 + Math.sqrt(amount / 500) * 0.48
  return Math.round(Math.min(Math.max(base * sizeMultiplier * variation, 2_500), 250_000) / 500) * 500
}

function brandFromName(name) {
  const words = clean(name).split(' ')
  if (words.length <= 2) return words[0] || 'Produk'
  const second = words[1]
  return /^(indonesia|baby|kids|pro|plus)$/i.test(second) ? `${words[0]} ${second}` : words[0]
}

async function getCategories() {
  const data = await fetchJson(`${API_ROOT}/categories`)
  return (data.categories || []).map((category) => ({
    id: category.categoryId,
    name: category.categoryName,
    page: 0,
    totalPage: Number.POSITIVE_INFINITY,
  }))
}

async function getProducts(category) {
  const params = new URLSearchParams({
    sortDirection: 'asc',
    start: String(category.page),
    limit: String(PAGE_SIZE),
  })
  const data = await fetchJson(`${API_ROOT}/products/category/${category.id}?${params}`)
  category.totalPage = Number.isFinite(data.totalPage) ? data.totalPage : 0
  category.page += 1
  return data.products || []
}

async function run() {
  const categories = await getCategories()
  const rawProducts = []
  const seen = new Set()

  while (rawProducts.length < TARGET_COUNT) {
    const active = categories.filter((category) => category.page <= category.totalPage)
    if (active.length === 0) break

    const batches = await Promise.allSettled(active.map((category) => getProducts(category)))
    let addedThisRound = 0
    const productLists = batches
      .filter((batch) => batch.status === 'fulfilled')
      .map((batch) => batch.value)
    const largestBatch = Math.max(0, ...productLists.map((products) => products.length))

    for (let row = 0; row < largestBatch; row += 1) {
      for (const productList of productLists) {
        const product = productList[row]
        if (!product) continue
        const id = clean(product.productId || product.sku)
        const name = clean(product.productName)
        const imageUrl = clean(product.image)
        if (!id || !name || !imageUrl.startsWith('https://c.alfagift.id/')) continue
        if (seen.has(id)) continue
        seen.add(id)
        rawProducts.push(product)
        addedThisRound += 1
        if (rawProducts.length >= TARGET_COUNT) break
      }
      if (rawProducts.length >= TARGET_COUNT) break
    }

    process.stdout.write(`Katalog terkumpul ${rawProducts.length}/${TARGET_COUNT}\n`)
    if (addedThisRound === 0) break
    await sleep(350)
  }

  if (rawProducts.length < TARGET_COUNT) {
    throw new Error(`Katalog hanya mendapatkan ${rawProducts.length} produk; target ${TARGET_COUNT}`)
  }

  const products = rawProducts.slice(0, TARGET_COUNT).map((product) => {
    const name = clean(product.productName)
    const code = clean(product.sku || product.plu || product.productId)
    const seed = hash(`${product.productId}-${name}`)
    const category = categoryFor(product)
    const price = estimatePrice(name, category, seed)
    const isFlashSale = seed % 8 === 0
    const discountPercent = isFlashSale ? [10, 15, 20, 25, 30][seed % 5] : 0

    return {
      id: `prd-${product.productId}`,
      code,
      name,
      brand: brandFromName(name),
      category,
      price,
      originalPrice: isFlashSale ? Math.ceil(price / (1 - discountPercent / 100) / 500) * 500 : price,
      stock: 120 + (seed % 781),
      imageUrl: clean(product.image),
      isFlashSale,
      discountPercent,
    }
  })

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(products, null, 2)}\n`, 'utf8')
  process.stdout.write(`Selesai: ${products.length} produk ditulis ke ${OUTPUT}\n`)
}

await run()
