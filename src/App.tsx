import {
  BadgePercent,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Grid2X2,
  Headphones,
  Home,
  Mail,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatedHero } from './components/AnimatedHero'
import { CartDrawer } from './components/CartDrawer'
import { ProductCard } from './components/ProductCard'
import productsData from './data/products.json'
import { CONTACTS } from './lib/catalog'
import type { CartItem, Product } from './types'

const products = productsData as Product[]
const PAGE_SIZE = 30

const categoryIcon: Record<string, string> = {
  Semua: '🛍️',
  Makanan: '🍜',
  Minuman: '🥤',
  Sembako: '🌾',
  Camilan: '🍪',
  'Bumbu & Masak': '🧂',
  'Susu & Sarapan': '🥛',
  'Makanan Beku': '❄️',
  'Kebutuhan Rumah': '🧴',
  'Perawatan Diri': '🧼',
  'Makanan Hewan': '🐾',
}

function useCountdown() {
  const calculate = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    const remaining = Math.max(0, end.getTime() - now.getTime())
    return {
      hours: String(Math.floor(remaining / 3_600_000)).padStart(2, '0'),
      minutes: String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, '0'),
      seconds: String(Math.floor((remaining % 60_000) / 1000)).padStart(2, '0'),
    }
  }
  const [time, setTime] = useState(calculate)
  useEffect(() => {
    const timer = window.setInterval(() => setTime(calculate()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return time
}

function App() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Semua')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('hk-mandiri-cart') || '[]')
    } catch {
      return []
    }
  })
  const catalogRef = useRef<HTMLElement>(null)
  const countdown = useCountdown()

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((product) => product.category)))
    return ['Semua', ...values.sort((a, b) => a.localeCompare(b, 'id'))]
  }, [])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: products.length }
    for (const product of products) counts[product.category] = (counts[product.category] || 0) + 1
    return counts
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchCategory = category === 'Semua' || product.category === category
      const matchSearch = !query || `${product.name} ${product.brand}`.toLowerCase().includes(query)
      return matchCategory && matchSearch
    })
  }, [category, search])

  const flashProducts = useMemo(() => products.filter((product) => product.isFlashSale).slice(0, 12), [])
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    localStorage.setItem('hk-mandiri-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [category, search])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2100)
    return () => window.clearTimeout(timer)
  }, [toast])

  const goToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        return current.map((item) => item.product.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item)
      }
      return [...current, { product, quantity: 1 }]
    })
    setToast(`${product.brand || product.name} ditambahkan`)
  }

  const changeQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      setCart((current) => current.filter((item) => item.product.id !== id))
      return
    }
    setCart((current) => current.map((item) => item.product.id === id
      ? { ...item, quantity: Math.min(quantity, item.product.stock) }
      : item))
  }

  const selectCategory = (value: string) => {
    setCategory(value)
    setMobileMenu(false)
    window.setTimeout(goToCatalog, 50)
  }

  return (
    <div className="app-shell">
      <div className="top-strip">
        <div className="container">
          <span><Sparkles size={14} /> Belanja hemat, kebutuhan lengkap!</span>
          <div><a href={`mailto:${CONTACTS.primaryEmail}`}>{CONTACTS.primaryEmail}</a><i /> <a href={`https://wa.me/${CONTACTS.phoneDigits}`} target="_blank" rel="noreferrer">{CONTACTS.phoneDisplay}</a></div>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-main">
          <a href="#top" className="brand" aria-label="HK Mandiri beranda">
            <span className="brand__mark">HK</span>
            <span className="brand__words"><b>MANDIRI</b><small>DIGITAL MARKET</small></span>
          </a>
          <div className="search-box">
            <Search size={19} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => search && goToCatalog()}
              onKeyDown={(event) => event.key === 'Enter' && goToCatalog()}
              placeholder="Cari dari 900 produk..."
              aria-label="Cari produk"
            />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="Hapus pencarian"><X size={17} /></button>}
            <button type="button" className="search-submit" onClick={goToCatalog} aria-label="Cari"><Search size={20} /></button>
          </div>
          <button type="button" className="cart-button" onClick={() => setCartOpen(true)}>
            <span className="cart-button__icon"><ShoppingCart size={21} />{totalItems > 0 && <b>{totalItems > 99 ? '99+' : totalItems}</b>}</span>
            <span><small>Belanjaanmu</small><strong>Keranjang</strong></span>
          </button>
          <button type="button" className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Menu"><Menu /></button>
        </div>
        <nav className={`main-nav${mobileMenu ? ' is-open' : ''}`}>
          <div className="container">
            <a href="#top" onClick={() => setMobileMenu(false)}><Home size={17} /> Beranda</a>
            <button type="button" onClick={() => selectCategory('Semua')}><Grid2X2 size={17} /> Semua Produk</button>
            <a href="#flash-sale" onClick={() => setMobileMenu(false)}><Zap size={17} /> Flash Sale <em>HOT</em></a>
            <a href="#contact" onClick={() => setMobileMenu(false)}><Headphones size={17} /> Hubungi Kami</a>
            <span className="main-nav__spacer" />
            <span className="catalog-total"><Boxes size={16} /> {products.length} produk tersedia</span>
          </div>
        </nav>
      </header>

      <main id="top">
        <div className="container hero-wrap">
          <AnimatedHero products={products} onShop={goToCatalog} />
        </div>

        <section className="benefit-strip container" aria-label="Keunggulan HK Mandiri">
          <div><span><PackageCheck /></span><p><b>Produk lengkap</b><small>900 pilihan kebutuhan</small></p></div>
          <div><span><ShieldCheck /></span><p><b>Belanja nyaman</b><small>Pesan langsung ke admin</small></p></div>
          <div><span><Truck /></span><p><b>Siap diantar</b><small>Konfirmasi area via WhatsApp</small></p></div>
          <div><span><Headphones /></span><p><b>Admin responsif</b><small>Siap bantu pesananmu</small></p></div>
        </section>

        <section className="section container category-section" id="categories">
          <div className="section-heading">
            <div><span className="section-kicker">PILIH KEBUTUHAN</span><h2>Belanja per kategori</h2></div>
            <button type="button" onClick={() => selectCategory('Semua')}>Lihat semua <ChevronRight size={17} /></button>
          </div>
          <div className="category-grid">
            {categories.map((item) => (
              <button type="button" className={category === item ? 'is-active' : ''} key={item} onClick={() => selectCategory(item)}>
                <span>{categoryIcon[item] || '🛒'}</span>
                <b>{item}</b>
                <small>{categoryCounts[item] || 0} produk</small>
              </button>
            ))}
          </div>
        </section>

        <section className="flash-section" id="flash-sale">
          <div className="container">
            <div className="flash-header">
              <div className="flash-title"><span><Zap fill="currentColor" /></span><div><small>PROMO TERBATAS</small><h2>Flash Sale Hari Ini</h2></div></div>
              <div className="countdown"><Clock3 size={18} /><span>Berakhir dalam</span><b>{countdown.hours}</b><i>:</i><b>{countdown.minutes}</b><i>:</i><b>{countdown.seconds}</b></div>
            </div>
            <div className="flash-track">
              {flashProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} compact />)}
            </div>
          </div>
        </section>

        <section className="section container catalog-section" id="products" ref={catalogRef}>
          <div className="section-heading catalog-heading">
            <div><span className="section-kicker">KATALOG HK MANDIRI</span><h2>{search ? `Hasil untuk “${search}”` : category === 'Semua' ? 'Semua produk' : category}</h2><p>{filteredProducts.length} produk ditemukan</p></div>
            <div className="catalog-filter">
              <label htmlFor="category-select">Kategori</label>
              <select id="category-select" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          {filteredProducts.length > 0 ? (
            <>
              <div className="product-grid">
                {filteredProducts.slice(0, visibleCount).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
              </div>
              {visibleCount < filteredProducts.length && (
                <button type="button" className="load-more" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
                  Tampilkan lebih banyak <span>{Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)} produk</span>
                </button>
              )}
            </>
          ) : (
            <div className="empty-results"><Search size={35} /><h3>Produknya belum ketemu</h3><p>Coba kata pencarian lain atau pilih semua kategori.</p><button type="button" onClick={() => { setSearch(''); setCategory('Semua') }}>Lihat semua produk</button></div>
          )}
        </section>

        <section className="contact-section" id="contact">
          <div className="container contact-card">
            <div className="contact-copy"><span className="section-kicker">BUTUH BANTUAN?</span><h2>Ngobrol langsung dengan HK Mandiri</h2><p>Tanya stok, area pengantaran, atau konfirmasi pesanan. Admin kami siap membantu.</p></div>
            <div className="contact-actions">
              <a className="contact-whatsapp" href={`https://wa.me/${CONTACTS.phoneDigits}`} target="_blank" rel="noreferrer"><span>WA</span><div><small>WhatsApp</small><b>{CONTACTS.phoneDisplay}</b></div><ChevronRight /></a>
              <a href={`mailto:${CONTACTS.primaryEmail}`}><Mail /><div><small>Email utama</small><b>{CONTACTS.primaryEmail}</b></div></a>
              <a href={`mailto:${CONTACTS.secondaryEmail}`}><Mail /><div><small>Email alternatif</small><b>{CONTACTS.secondaryEmail}</b></div></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div><a href="#top" className="brand brand--footer"><span className="brand__mark">HK</span><span className="brand__words"><b>MANDIRI</b><small>DIGITAL MARKET</small></span></a><p>Kebutuhan harian lengkap, hemat, dan lebih dekat.</p></div>
          <div><h3>Belanja</h3><a href="#categories">Kategori</a><a href="#flash-sale">Flash Sale</a><a href="#products">Semua Produk</a></div>
          <div><h3>Kontak</h3><a href={`mailto:${CONTACTS.primaryEmail}`}>{CONTACTS.primaryEmail}</a><a href={`mailto:${CONTACTS.secondaryEmail}`}>{CONTACTS.secondaryEmail}</a><a href={`https://wa.me/${CONTACTS.phoneDigits}`}>{CONTACTS.phoneDisplay}</a></div>
          <div className="footer-badge"><Store /><p><b>HK Mandiri</b><small>Digital Market</small></p><CheckCircle2 /></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} HK Mandiri. Semua hak dilindungi.</span><span>Katalog versi demo · Harga dan stok merupakan estimasi</span></div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Navigasi mobile">
        <a href="#top"><Home /><span>Beranda</span></a>
        <a href="#categories"><Grid2X2 /><span>Kategori</span></a>
        <a href="#flash-sale"><BadgePercent /><span>Promo</span></a>
        <button type="button" onClick={() => setCartOpen(true)}><span className="mobile-cart-icon"><ShoppingCart />{totalItems > 0 && <b>{totalItems > 99 ? '99+' : totalItems}</b>}</span><span>Keranjang</span></button>
      </nav>

      <CartDrawer open={cartOpen} items={cart} onClose={() => setCartOpen(false)} onChange={changeQuantity} onRemove={(id) => setCart((current) => current.filter((item) => item.product.id !== id))} />
      <div className={`toast${toast ? ' is-visible' : ''}`} role="status"><CheckCircle2 size={18} /> {toast}</div>
    </div>
  )
}

export default App
