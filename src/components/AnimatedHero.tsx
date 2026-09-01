import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { productImageFallback } from '../lib/catalog'
import type { Product } from '../types'

type AnimatedHeroProps = {
  products: Product[]
  onShop: () => void
}

const copy = [
  {
    eyebrow: 'Belanja harian jadi gampang',
    title: 'Lebih lengkap, lebih hemat.',
    description: 'Ratusan kebutuhan rumah dalam satu tempat. Tinggal cari, pilih, lalu pesan.',
  },
  {
    eyebrow: 'Flash sale setiap hari',
    title: 'Harga merah, dompet cerah.',
    description: 'Temukan produk favorit dengan promo spesial yang berganti setiap hari.',
  },
  {
    eyebrow: 'HK Mandiri dekat di hati',
    title: 'Kebutuhanmu, kami siapin.',
    description: 'Dari camilan sampai sembako, semuanya siap masuk keranjang.',
  },
]

export function AnimatedHero({ products, onShop }: AnimatedHeroProps) {
  const [active, setActive] = useState(0)
  const featured = useMemo(() => {
    const flash = products.filter((product) => product.isFlashSale)
    return [flash[4] || products[4], products[18], products[35]].filter(Boolean)
  }, [products])

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % copy.length), 5200)
    return () => window.clearInterval(timer)
  }, [])

  const go = (direction: number) => {
    setActive((current) => (current + direction + copy.length) % copy.length)
  }

  return (
    <section className="hero" aria-label="Promo utama">
      <div className="hero__confetti" aria-hidden="true">
        {Array.from({ length: 13 }, (_, index) => <i key={index} />)}
      </div>
      <div className="hero__copy" key={`copy-${active}`}>
        <span className="hero__eyebrow"><Sparkles size={16} /> {copy[active].eyebrow}</span>
        <h1>{copy[active].title}</h1>
        <p>{copy[active].description}</p>
        <button type="button" className="hero__button" onClick={onShop}>
          Belanja sekarang <ArrowRight size={18} />
        </button>
      </div>
      <div className="hero__visual" key={`visual-${active}`}>
        <span className="hero__burst">HEMAT<br /><b>SETIAP HARI</b></span>
        <div className="hero__product-stage">
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
        <span className="hero__promo-pill"><Zap size={16} fill="currentColor" /> PROMO!</span>
      </div>
      <button type="button" className="hero__arrow hero__arrow--left" onClick={() => go(-1)} aria-label="Promo sebelumnya">
        <ChevronLeft size={22} />
      </button>
      <button type="button" className="hero__arrow hero__arrow--right" onClick={() => go(1)} aria-label="Promo berikutnya">
        <ChevronRight size={22} />
      </button>
      <div className="hero__dots" role="tablist" aria-label="Pilih promo">
        {copy.map((item, index) => (
          <button
            type="button"
            key={item.title}
            className={index === active ? 'is-active' : ''}
            aria-label={`Promo ${index + 1}`}
            aria-selected={index === active}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </section>
  )
}
