import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE = {
  products: 'amanah_products',
  banners: 'amanah_banners',
  cart: 'amanah_cart',
  reviews: 'amanah_reviews',
  admin: 'amanah_admin_auth',
  orders: 'amanah_orders',
}

const defaultProduct = {
  id: '',
  name: '',
  category: 'Talbeena',
  price: '',
  stock: '',
  image: '/logo.svg',
  description: '',
  featured: false,
}

const defaultBanner = {
  id: '',
  title: '',
  message: '',
  active: true,
}

const getLocal = (key, fallback) => {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const encode = (data) =>
  Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

function App() {
  const [products, setProducts] = useState([])
  const [banners, setBanners] = useState([])
  const [cart, setCart] = useState([])
  const [reviews, setReviews] = useState({})
  const [orders, setOrders] = useState([])
  const [route, setRoute] = useState(window.location.hash || '#/')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const [adminPassword, setAdminPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem(STORAGE.admin) === 'true')
  const [productForm, setProductForm] = useState(defaultProduct)
  const [bannerForm, setBannerForm] = useState(defaultBanner)

  const [checkout, setCheckout] = useState({ name: '', phone: '', address: '' })
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [reviewDraft, setReviewDraft] = useState({ name: '', rating: 5, comment: '' })

  useEffect(() => {
    const handleHash = () => setRoute(window.location.hash || '#/')
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const localProducts = getLocal(STORAGE.products, null)
      const localBanners = getLocal(STORAGE.banners, null)
      const localCart = getLocal(STORAGE.cart, [])
      const localReviews = getLocal(STORAGE.reviews, {})
      const localOrders = getLocal(STORAGE.orders, [])

      if (localProducts) {
        setProducts(localProducts)
      } else {
        const response = await fetch('/data/products.json')
        const initialProducts = await response.json()
        setProducts(initialProducts)
      }

      if (localBanners) {
        setBanners(localBanners)
      } else {
        const response = await fetch('/data/banners.json')
        const initialBanners = await response.json()
        setBanners(initialBanners)
      }

      setCart(localCart)
      setReviews(localReviews)
      setOrders(localOrders)
    }

    loadData()
  }, [])

  useEffect(() => localStorage.setItem(STORAGE.products, JSON.stringify(products)), [products])
  useEffect(() => localStorage.setItem(STORAGE.banners, JSON.stringify(banners)), [banners])
  useEffect(() => localStorage.setItem(STORAGE.cart, JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem(STORAGE.reviews, JSON.stringify(reviews)), [reviews])
  useEffect(() => localStorage.setItem(STORAGE.orders, JSON.stringify(orders)), [orders])

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category))],
    [products],
  )

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const inCategory = category === 'All' || product.category === category
        const inSearch =
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase())
        return inCategory && inSearch
      }),
    [products, category, search],
  )

  const cartItems = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((p) => p.id === item.id)
          if (!product) return null
          return { ...product, quantity: item.quantity }
        })
        .filter(Boolean),
    [cart, products],
  )

  const cartTotal = cartItems.reduce((total, item) => total + Number(item.price) * item.quantity, 0)
  const activeBanners = banners.filter((banner) => banner.active)

  const selectedProductId = route.startsWith('#/product/') ? route.replace('#/product/', '') : ''
  const selectedProduct = products.find((product) => product.id === selectedProductId)

  const navigate = (nextRoute) => {
    window.location.hash = nextRoute
  }

  const addToCart = (productId) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId)
      if (existing) {
        return prev.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...prev, { id: productId, quantity: 1 }]
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: Number(quantity) } : item)),
    )
  }

  const handleAdminLogin = (event) => {
    event.preventDefault()
    const expected = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
    if (adminPassword === expected) {
      setIsAdmin(true)
      localStorage.setItem(STORAGE.admin, 'true')
      setAdminPassword('')
    } else {
      setCheckoutMessage('Incorrect admin password.')
    }
  }

  const saveProduct = (event) => {
    event.preventDefault()
    const id = productForm.id || slugify(productForm.name)
    const payload = {
      ...productForm,
      id,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      featured: Boolean(productForm.featured),
      image: productForm.image || '/logo.svg',
    }

    setProducts((prev) => {
      const exists = prev.some((product) => product.id === id)
      return exists ? prev.map((product) => (product.id === id ? payload : product)) : [...prev, payload]
    })

    setProductForm(defaultProduct)
  }

  const saveBanner = (event) => {
    event.preventDefault()
    const id = bannerForm.id || slugify(bannerForm.title)
    const payload = { ...bannerForm, id, active: Boolean(bannerForm.active) }

    setBanners((prev) => {
      const exists = prev.some((banner) => banner.id === id)
      return exists ? prev.map((banner) => (banner.id === id ? payload : banner)) : [...prev, payload]
    })

    setBannerForm(defaultBanner)
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    if (!cartItems.length) {
      setCheckoutMessage('Your cart is empty.')
      return
    }

    const orderSummary = cartItems
      .map((item) => `${item.name} x ${item.quantity}`)
      .join(', ')

    const payload = {
      'form-name': 'orders',
      products: orderSummary,
      quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      customerName: checkout.name,
      phone: checkout.phone,
      address: checkout.address,
    }

    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(payload),
      })

      setOrders((prev) => [{ ...payload, createdAt: new Date().toISOString() }, ...prev])
      setCart([])
      setCheckout({ name: '', phone: '', address: '' })
      setCheckoutMessage('Thank you! Your order has been submitted successfully.')
    } catch {
      setCheckoutMessage('Order submission failed. Please try again.')
    }
  }

  const submitReview = (event) => {
    event.preventDefault()
    if (!selectedProduct) return

    const nextReview = {
      name: reviewDraft.name || 'Anonymous',
      rating: Number(reviewDraft.rating),
      comment: reviewDraft.comment,
      createdAt: new Date().toISOString(),
    }

    setReviews((prev) => ({
      ...prev,
      [selectedProduct.id]: [nextReview, ...(prev[selectedProduct.id] || [])],
    }))

    setReviewDraft({ name: '', rating: 5, comment: '' })
  }

  const renderHero = () => (
    <section className="hero">
      <div>
        <p className="tag">Takmeeli Talbeena by Al Amanah Store</p>
        <h1>Pure nutrition for every home</h1>
        <p>
          Discover premium Talbeena blends and wellness essentials with trusted quality,
          fresh stock, and easy ordering.
        </p>
        <div className="hero-actions">
          <button onClick={() => navigate('#/checkout')}>Order Now</button>
          <button className="secondary" onClick={() => window.scrollTo({ top: 620, behavior: 'smooth' })}>
            Explore Products
          </button>
        </div>
      </div>
      <img src="/logo.svg" alt="Al Amanah Store logo" className="hero-logo" />
    </section>
  )

  const renderCatalog = () => (
    <section className="section">
      <div className="section-head">
        <h2>Product Catalog</h2>
        <div className="filters">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid">
        {filteredProducts.map((product) => (
          <article key={product.id} className="card">
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p className="meta">Stock: {product.stock}</p>
            <div className="row">
              <strong>${Number(product.price).toFixed(2)}</strong>
              <button onClick={() => addToCart(product.id)}>Add to Cart</button>
            </div>
            <button className="link" onClick={() => navigate(`#/product/${product.id}`)}>
              View details
            </button>
          </article>
        ))}
      </div>
    </section>
  )

  const renderCart = () => (
    <section className="section">
      <div className="section-head">
        <h2>Shopping Cart</h2>
        <button className="secondary" onClick={() => navigate('#/checkout')}>
          Checkout
        </button>
      </div>
      {!cartItems.length ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="cart-list">
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <div>
                <h3>{item.name}</h3>
                <p>${Number(item.price).toFixed(2)} each</p>
              </div>
              <div className="row">
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                />
                <button className="secondary" onClick={() => removeFromCart(item.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <p className="total">Total: ${cartTotal.toFixed(2)}</p>
        </div>
      )}
    </section>
  )

  const renderCheckout = () => (
    <section className="section narrow">
      <h2>Checkout & Order</h2>
      <p>
        Submit your order via Netlify Forms. You will receive a confirmation message after
        submission.
      </p>
      <form name="orders" data-netlify="true" netlify-honeypot="bot-field" hidden>
        <input name="products" />
        <input name="quantity" />
        <input name="customerName" />
        <input name="phone" />
        <input name="address" />
      </form>
      <form className="panel" onSubmit={submitOrder}>
        <label>
          Customer Name
          <input
            required
            value={checkout.name}
            onChange={(event) => setCheckout((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label>
          Phone Number
          <input
            required
            value={checkout.phone}
            onChange={(event) => setCheckout((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </label>
        <label>
          Address
          <textarea
            required
            rows="3"
            value={checkout.address}
            onChange={(event) => setCheckout((prev) => ({ ...prev, address: event.target.value }))}
          />
        </label>
        <button type="submit">Place Order</button>
      </form>
      {checkoutMessage ? <p className="notice">{checkoutMessage}</p> : null}
    </section>
  )

  const renderProductDetail = () => {
    if (!selectedProduct) {
      return (
        <section className="section narrow">
          <h2>Product not found</h2>
        </section>
      )
    }

    const productReviews = reviews[selectedProduct.id] || []

    return (
      <section className="section narrow">
        <button className="secondary" onClick={() => navigate('#/')}>
          Back to home
        </button>
        <article className="card detail">
          <img src={selectedProduct.image} alt={selectedProduct.name} />
          <h2>{selectedProduct.name}</h2>
          <p>{selectedProduct.description}</p>
          <p className="meta">Available stock: {selectedProduct.stock}</p>
          <strong>${Number(selectedProduct.price).toFixed(2)}</strong>
          <button onClick={() => addToCart(selectedProduct.id)}>Add to Cart</button>
        </article>

        <div className="panel">
          <h3>Customer Reviews</h3>
          <form onSubmit={submitReview} className="review-form">
            <input
              placeholder="Your name"
              value={reviewDraft.name}
              onChange={(event) => setReviewDraft((prev) => ({ ...prev, name: event.target.value }))}
            />
            <select
              value={reviewDraft.rating}
              onChange={(event) =>
                setReviewDraft((prev) => ({ ...prev, rating: Number(event.target.value) }))
              }
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} Star
                </option>
              ))}
            </select>
            <textarea
              required
              placeholder="Share your feedback"
              rows="3"
              value={reviewDraft.comment}
              onChange={(event) => setReviewDraft((prev) => ({ ...prev, comment: event.target.value }))}
            />
            <button type="submit">Submit Review</button>
          </form>
          <div className="reviews">
            {productReviews.length ? (
              productReviews.map((review, index) => (
                <article key={`${review.createdAt}-${index}`} className="review-item">
                  <p>
                    <strong>{review.name}</strong> · {review.rating}/5
                  </p>
                  <p>{review.comment}</p>
                </article>
              ))
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
        </div>
      </section>
    )
  }

  const renderAdmin = () => {
    if (!isAdmin) {
      return (
        <section className="section narrow">
          <h2>Admin Login</h2>
          <p>Use your password from VITE_ADMIN_PASSWORD.</p>
          <form onSubmit={handleAdminLogin} className="panel">
            <label>
              Password
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
              />
            </label>
            <button type="submit">Login</button>
          </form>
        </section>
      )
    }

    return (
      <section className="section">
        <div className="section-head">
          <h2>Admin Dashboard</h2>
          <button
            className="secondary"
            onClick={() => {
              setIsAdmin(false)
              localStorage.removeItem(STORAGE.admin)
            }}
          >
            Logout
          </button>
        </div>

        <div className="admin-layout">
          <div className="panel">
            <h3>Manage Products</h3>
            <form onSubmit={saveProduct} className="stack">
              <input
                placeholder="Name"
                required
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                placeholder="Category"
                required
                value={productForm.category}
                onChange={(event) =>
                  setProductForm((prev) => ({ ...prev, category: event.target.value }))
                }
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                required
                value={productForm.price}
                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
              />
              <input
                type="number"
                min="0"
                placeholder="Stock"
                required
                value={productForm.stock}
                onChange={(event) => setProductForm((prev) => ({ ...prev, stock: event.target.value }))}
              />
              <input
                placeholder="Image URL"
                value={productForm.image}
                onChange={(event) => setProductForm((prev) => ({ ...prev, image: event.target.value }))}
              />
              <textarea
                placeholder="Description"
                required
                rows="3"
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
              <label className="inline">
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, featured: event.target.checked }))
                  }
                />
                Featured Product
              </label>
              <button type="submit">Save Product</button>
            </form>
            <div className="records">
              {products.map((product) => (
                <div key={product.id} className="record-item">
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      ${Number(product.price).toFixed(2)} · Stock {product.stock}
                    </p>
                  </div>
                  <div className="row">
                    <button className="secondary" onClick={() => setProductForm(product)}>
                      Edit
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setProducts((prev) => prev.filter((item) => item.id !== product.id))}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Manage Promotional Banners</h3>
            <form onSubmit={saveBanner} className="stack">
              <input
                placeholder="Title"
                required
                value={bannerForm.title}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <textarea
                placeholder="Message"
                required
                rows="2"
                value={bannerForm.message}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, message: event.target.value }))}
              />
              <label className="inline">
                <input
                  type="checkbox"
                  checked={bannerForm.active}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, active: event.target.checked }))}
                />
                Active Banner
              </label>
              <button type="submit">Save Banner</button>
            </form>
            <div className="records">
              {banners.map((banner) => (
                <div key={banner.id} className="record-item">
                  <div>
                    <strong>{banner.title}</strong>
                    <p>{banner.message}</p>
                  </div>
                  <div className="row">
                    <button className="secondary" onClick={() => setBannerForm(banner)}>
                      Edit
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setBanners((prev) => prev.filter((item) => item.id !== banner.id))}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h3>Submitted Orders</h3>
            <p className="meta">Netlify submissions are also available in your Netlify dashboard and email.</p>
            <div className="records">
              {orders.length ? (
                orders.map((order, index) => (
                  <div key={`${order.createdAt}-${index}`} className="record-item stack-view">
                    <strong>{order.customerName}</strong>
                    <p>{order.products}</p>
                    <p>
                      {order.phone} · {order.address}
                    </p>
                  </div>
                ))
              ) : (
                <p>No order submissions yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.svg" alt="Al Amanah Store" />
          <div>
            <h1>Al Amanah Store</h1>
            <p>Takmeeli Talbeena</p>
          </div>
        </div>
        <nav>
          <button className="link" onClick={() => navigate('#/')}>
            Home
          </button>
          <button className="link" onClick={() => navigate('#/checkout')}>
            Checkout
          </button>
          <button className="link" onClick={() => navigate('#/admin')}>
            Admin
          </button>
        </nav>
      </header>

      {activeBanners.length ? (
        <section className="banners">
          {activeBanners.map((banner) => (
            <article key={banner.id}>
              <strong>{banner.title}</strong>
              <p>{banner.message}</p>
            </article>
          ))}
        </section>
      ) : null}

      {route === '#/checkout' && renderCheckout()}
      {route === '#/admin' && renderAdmin()}
      {route.startsWith('#/product/') && renderProductDetail()}
      {route === '#/' && (
        <>
          {renderHero()}
          {renderCatalog()}
          {renderCart()}
          <section className="section company">
            <h2>About Al Amanah Store</h2>
            <p>
              We are dedicated to providing nutritious Takmeeli Talbeena and carefully selected
              wellness products for families who value halal, healthy, and trusted food choices.
            </p>
            <h3>Contact</h3>
            <p>Phone: +92 300 0000000</p>
            <p>Email: orders@alamanahstore.com</p>
            <p>Address: Lahore, Pakistan</p>
          </section>
        </>
      )}
    </div>
  )
}

export default App
