import { Plus, ShoppingBag } from 'lucide-react'
import { formatRupiah, productImageFallback } from '../lib/catalog'
import type { Product } from '../types'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
  compact?: boolean
}

export function ProductCard({ product, onAdd, compact = false }: ProductCardProps) {
  return (
    <article className={`product-card${compact ? ' product-card--compact' : ''}`}>
      <div className="product-card__media">
        {product.isFlashSale && (
          <span className="discount-badge">-{product.discountPercent}%</span>
        )}
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={productImageFallback}
        />
      </div>
      <div className="product-card__body">
        <h3 title={product.name}>{product.name}</h3>
        <div className="product-card__price-row">
          <strong>{formatRupiah(product.price)}</strong>
          {product.isFlashSale && product.originalPrice > product.price && (
            <del>{formatRupiah(product.originalPrice)}</del>
          )}
        </div>
        <div className="product-card__footer">
          <span className="stock-label"><ShoppingBag size={14} /> Stok {product.stock}</span>
          <button type="button" className="add-button" onClick={() => onAdd(product)} aria-label={`Tambah ${product.name}`}>
            <Plus size={17} /> <span>Tambah</span>
          </button>
        </div>
      </div>
    </article>
  )
}
