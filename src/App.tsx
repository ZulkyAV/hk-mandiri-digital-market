import {
  BadgePercent,
  ChevronRight,
  Grid2X2,
  Home,
  Mail,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatedHero } from './components/AnimatedHero'
import { CartDrawer } from './components/CartDrawer'
import { ProductCard } from './components/ProductCard'
import productsData from './data/products'
import { CONTACTS, formatRupiah, productImageFallback } from './lib/catalog'
import type { CartItem, Product } from './types'

const products = productsData as Product[]
const PAGE_SIZE = 30

const featuredCategories = [
  'Sembako',
  'Makanan',
  'Minuman',
  'Perawatan Diri',
  'Kebutuhan Rumah',
  'Camilan',
]

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

  const categories = useMemo(() => {
    const values = Array.from(new Set(products.map((product) => product.category)))
    return ['Semua', ...values.sort((a, b) => a.localeCompare(b, 'id'))]
  }, [])

  const categoryProducts = useMemo(() => {
    const entries = featuredCategories.map((name) => [
      name,
      products.filter((product) => product.category === name).slice(0, 3),
    ])
    return Object.fromEntries(entries) as Record<string, Product[]>
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchCategory = category === 'Semua' || product.category === category
      const matchSearch = !query || `${product.name} ${product.brand}`.toLowerCase().includes(query)
      return matchCategory && matchSearch
    })
  }, [category, search])

  const flashProducts = useMemo(
    () => products.filter((product) => product.isFlashSale).slice(0, 3),
    [],
  )
  const popularProducts = useMemo(
    () => products.filter((product) => !product.isFlashSale).slice(0, 6),
    [],
  )
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

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
    setToast(`${product.name} ditambahkan`)
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
      <header className="site-header">
        <div className="container header-main">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileMenu((current) => !current)}
            aria-label="Buka menu"
          >
            {mobileMenu ? <X /> : <Menu />}
          </button>

          <a href="#top" className="brand" aria-label="HK Mandiri beranda">
            <span className="brand__hk">HK</span>
            <span>MANDIRI</span>
          </a>

          <div className="search-box search-box--desktop">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && goToCatalog()}
              placeholder="Cari produk..."
              aria-label="Cari produk"
            />
            <button type="button" onClick={goToCatalog} aria-label="Cari"><Search /></button>
          </div>

          <button type="button" className="cart-button" onClick={() => setCartOpen(true)}>
            <ShoppingCart />
            <span>Keranjang</span>
            {totalItems > 0 && <b>{totalItems > 99 ? '99+' : totalItems}</b>}
          </button>
        </div>

        <div className="container mobile-search-row">
          <div className="search-box">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && goToCatalog()}
              placeholder="Cari produk..."
              aria-label="Cari produk"
            />
            <button type="button" onClick={goToCatalog} aria-label="Cari"><Search /></button>
          </div>
        </div>

        <nav className="main-nav" aria-label="Navigasi utama">
          <div className="container">
            <a className="is-active" href="#top"><Home /> <span>Beranda</span></a>
            <a href="#categories"><Grid2X2 /> <span>Kategori</span></a>
            <a href="#flash-sale"><BadgePercent /> <span>Promo</span></a>
            <button type="button" onClick={() => setCartOpen(true)}><ShoppingBag /> <span>Pesanan</span></button>
          </div>
        </nav>

        <div className={`mobile-menu-panel${mobileMenu ? ' is-open' : ''}`}>
          <a href="#products" onClick={() => setMobileMenu(false)}>Semua produk</a>
          <a href="#contact" onClick={() => setMobileMenu(false)}>Kontak HK Mandiri</a>
          <a href={`https://wa.me/${CONTACTS.phoneDigits}`} target="_blank" rel="noreferrer">WhatsApp admin</a>
        </div>
      </header>

      <main id="top">
        <div className="container storefront-grid">
          <div className="storefront-main">
            <AnimatedHero products={products} onShop={goToCatalog} />

            <section className="home-section category-section" id="categories">
              <div className="home-heading">
                <h2>Kategori</h2>
                <button type="button" onClick={() => selectCategory('Semua')}>Lihat Semua <ChevronRight /></button>
              </div>
              <div className="category-grid">
                {featuredCategories.map((item) => (
                  <button type="button" key={item} onClick={() => selectCategory(item)}>
                    <span className="category-visual">
                      {(categoryProducts[item] || []).slice(0, 3).map((product, index) => (
                        <img
                          key={product.id}
                          className={`category-product category-product--${index + 1}`}
                          src={product.imageUrl}
                          alt=""
                          loading="lazy"
                          onError={productImageFallback}
                        />
                      ))}
                    </span>
                    <b>{item}</b>
                  </button>
                ))}
              </div>
            </section>

            <section className="home-section promo-section" id="flash-sale">
              <div className="home-heading">
                <h2>Promo Hari Ini</h2>
                <button type="button" onClick={goToCatalog}>Lihat Semua <ChevronRight /></button>
              </div>
              <div className="promo-grid">
                <button type="button" className="promo-callout" onClick={goToCatalog}>
                  <small>DISKON SPESIAL</small>
                  <span>HINGGA</span>
                  <strong>30%</strong>
                  <p>Belanja makin hemat hari ini!</p>
                  <BadgePercent />
                </button>
                {flashProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} compact />
                ))}
              </div>
            </section>

            <section className="home-section popular-section">
              <div className="home-heading">
                <h2>Produk Populer</h2>
                <button type="button" onClick={goToCatalog}>Lihat Semua <ChevronRight /></button>
              </div>
              <div className="popular-grid">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} compact />
                ))}
              </div>
            </section>
          </div>

          <aside className="cart-summary" aria-label="Ringkasan keranjang">
            <div className="cart-summary__header">
              <h2>Keranjang</h2>
              <span>{totalItems}</span>
            </div>
            <div className="cart-summary__items">
              {cart.length === 0 ? (
                <div className="cart-summary__empty">
                  <ShoppingCart />
                  <b>Keranjang masih kosong</b>
                  <p>Tambahkan produk untuk melihat ringkasan pesanan.</p>
                </div>
              ) : cart.slice(0, 4).map(({ product, quantity }) => (
                <article className="cart-summary__item" key={product.id}>
                  <span><img src={product.imageUrl} alt="" onError={productImageFallback} /></span>
                  <div><b>{product.name}</b><small>{quantity} x {formatRupiah(product.price)}</small></div>
                  <button type="button" onClick={() => setCart((current) => current.filter((item) => item.product.id !== product.id))} aria-label={`Hapus ${product.name}`}><Trash2 /></button>
                </article>
              ))}
              {cart.length > 4 && <button type="button" className="more-cart-items" onClick={() => setCartOpen(true)}>+{cart.length - 4} produk lainnya</button>}
            </div>
            <div className="cart-summary__footer">
              <div><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div>
              <button type="button" onClick={() => setCartOpen(true)} disabled={cart.length === 0}>Lihat Keranjang</button>
            </div>
          </aside>
        </div>

        <section className="container catalog-section" id="products" ref={catalogRef}>
          <div className="catalog-heading">
            <div>
              <small>KATALOG HK MANDIRI</small>
              <h2>{search ? `Hasil pencarian “${search}”` : category === 'Semua' ? 'Jelajahi Semua Produk' : category}</h2>
              <p>{filteredProducts.length} produk ditemukan</p>
            </div>
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Pilih kategori">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div className="product-grid">
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  <ProductCard key={product.id} product={product} onAdd={addToCart} />
                ))}
              </div>
              {visibleCount < filteredProducts.length && (
                <button type="button" className="load-more" onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}>
                  Tampilkan lebih banyak <span>{Math.min(PAGE_SIZE, filteredProducts.length - visibleCount)} produk</span>
                </button>
              )}
            </>
          ) : (
            <div className="empty-results">
              <Search />
              <h3>Produknya belum ketemu</h3>
              <p>Coba kata pencarian lain atau pilih semua kategori.</p>
              <button type="button" onClick={() => { setSearch(''); setCategory('Semua') }}>Lihat semua produk</button>
            </div>
          )}
        </section>

        <section className="contact-section" id="contact">
          <div className="container contact-card">
            <div><Store /><span><small>BELANJA LEBIH DEKAT</small><h2>HK Mandiri siap bantu kebutuhanmu.</h2></span></div>
            <div className="contact-links">
              <a href={`https://wa.me/${CONTACTS.phoneDigits}`} target="_blank" rel="noreferrer">WhatsApp <b>{CONTACTS.phoneDisplay}</b></a>
              <a href={`mailto:${CONTACTS.primaryEmail}`}><Mail /> {CONTACTS.primaryEmail}</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <a href="#top" className="brand"><span className="brand__hk">HK</span><span>MANDIRI</span></a>
          <p>Katalog demo · Harga dan stok merupakan estimasi.</p>
          <span>© {new Date().getFullYear()} HK Mandiri</span>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onChange={changeQuantity}
        onRemove={(id) => setCart((current) => current.filter((item) => item.product.id !== id))}
      />
      <div className={`toast${toast ? ' is-visible' : ''}`} role="status">{toast}</div>
    </div>
  )
}

export default App
