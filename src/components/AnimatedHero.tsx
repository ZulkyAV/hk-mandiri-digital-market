import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { productImageFallback } from '../lib/catalog'
import type { Product } from '../types'

type AnimatedHeroProps = {
  products: Product[]
  onShop: () => void
}

const slides = [
  {
    title: 'Belanja Kebutuhanmu',
    description: 'Lengkap, hemat, dan terpercaya untuk kebutuhan sehari-harimu.',
    button: 'Belanja Sekarang',
  },
  {
    title: 'Promo Setiap Hari',
    description: 'Harga pilihan untuk sembako, makanan, minuman, dan kebutuhan rumah.',
    button: 'Lihat Promo',
  },
  {
    title: 'Semua Jadi Mudah',
    description: 'Cari produk, masukkan keranjang, lalu konfirmasi pesanan ke admin.',
    button: 'Mulai Belanja',
  },
]

export function AnimatedHero({ products, onShop }: AnimatedHeroProps) {
  const [active, setActive] = useState(0)
  const featured = useMemo(() => {
    const preferred = ['Sembako', 'Makanan', 'Minuman', 'Kebutuhan Rumah']
    return preferred
      .map((category) => products.find((product) => product.category === category))
      .filter((product): product is Product => Boolean(product))
      .slice(0, 4)
  }, [products])

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5200)
    return () => window.clearInterval(timer)
  }, [])

  const go = (direction: number) => {
    setActive((current) => (current + direction + slides.length) % slides.length)
  }

  return (
    <section className="hero" aria-label="Promo utama">
      <div className="hero__copy" key={slides[active].title}>
        <h1>{slides[active].title}</h1>
        <p>{slides[active].description}</p>
        <button type="button" onClick={onShop}>{slides[active].button}</button>
      </div>

      <div className="hero__visual" aria-hidden="true">
        <div className="hero__products">
          {featured.map((product, index) => (
            <img
              key={product.id}
              className={`hero__product hero__product--${index + 1}`}
              src={product.imageUrl}
              alt=""
              onError={productImageFallback}
            />
          ))}
        </div>
        <div className="hero__basket"><i /><i /><i /><i /></div>
      </div>

      <button type="button" className="hero__arrow hero__arrow--left" onClick={() => go(-1)} aria-label="Promo sebelumnya"><ChevronLeft /></button>
      <button type="button" className="hero__arrow hero__arrow--right" onClick={() => go(1)} aria-label="Promo berikutnya"><ChevronRight /></button>
      <div className="hero__dots">
        {slides.map((slide, index) => (
          <button
            type="button"
            key={slide.title}
            className={index === active ? 'is-active' : ''}
            onClick={() => setActive(index)}
            aria-label={`Promo ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
