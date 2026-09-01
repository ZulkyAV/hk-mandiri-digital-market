import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { CONTACTS, formatRupiah, productImageFallback } from '../lib/catalog'
import type { CartItem } from '../types'

type CartDrawerProps = {
  open: boolean
  items: CartItem[]
  onClose: () => void
  onChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}

export function CartDrawer({ open, items, onClose, onChange, onRemove }: CartDrawerProps) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const order = () => {
    const lines = items.map((item, index) =>
      `${index + 1}. ${item.product.name}\n   ${item.quantity} x ${formatRupiah(item.product.price)}`,
    )
    const message = [
      'Halo HK Mandiri, saya ingin memesan:',
      '',
      ...lines,
      '',
      `Total: ${formatRupiah(total)}`,
      '',
      'Mohon konfirmasi ketersediaan dan ongkirnya. Terima kasih!',
    ].join('\n')
    window.open(`https://wa.me/${CONTACTS.phoneDigits}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <button type="button" className={`drawer-backdrop${open ? ' is-open' : ''}`} onClick={onClose} aria-label="Tutup keranjang" />
      <aside className={`cart-drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <div className="cart-drawer__header">
          <div><ShoppingCart size={21} /><h2>Keranjang</h2><span>{items.length}</span></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup"><X size={22} /></button>
        </div>
        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <div><ShoppingCart size={34} /></div>
              <h3>Keranjang masih kosong</h3>
              <p>Yuk, pilih produk kebutuhanmu dulu.</p>
              <button type="button" onClick={onClose}>Mulai belanja</button>
            </div>
          ) : items.map(({ product, quantity }) => (
            <article className="cart-item" key={product.id}>
              <div className="cart-item__image"><img src={product.imageUrl} alt="" onError={productImageFallback} /></div>
              <div className="cart-item__detail">
                <h3>{product.name}</h3>
                <strong>{formatRupiah(product.price)}</strong>
                <div className="quantity-control">
                  <button type="button" onClick={() => onChange(product.id, quantity - 1)} aria-label="Kurangi"><Minus size={14} /></button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => onChange(product.id, quantity + 1)} aria-label="Tambah"><Plus size={14} /></button>
                </div>
              </div>
              <button type="button" className="cart-item__remove" onClick={() => onRemove(product.id)} aria-label="Hapus"><Trash2 size={17} /></button>
            </article>
          ))}
        </div>
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div><span>Total belanja</span><strong>{formatRupiah(total)}</strong></div>
            <button type="button" className="checkout-button" onClick={order}>Pesan via WhatsApp</button>
            <small>Harga dan ketersediaan akan dikonfirmasi admin.</small>
          </div>
        )}
      </aside>
    </>
  )
}
