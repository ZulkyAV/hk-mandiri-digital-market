export type Product = {
  id: string
  code: string
  name: string
  brand: string
  category: string
  price: number
  originalPrice: number
  stock: number
  imageUrl: string
  isFlashSale: boolean
  discountPercent: number
}

export type CartItem = {
  product: Product
  quantity: number
}
