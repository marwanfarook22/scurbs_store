import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "cart";

const CartContext = createContext(null);

function loadCart() {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return [];

    const parsedCart = JSON.parse(storedCart);
    if (!Array.isArray(parsedCart)) {
      throw new Error("Saved cart data is not an array.");
    }

    return parsedCart.filter(
      (item) =>
        item?.product?._id &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch (error) {
    console.error("Failed to load cart from localStorage:", error);
    return [];
  }
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cartItems]);

  const addToCart = (product, quantity = 1, productDetail = null) => {
    if (!product?._id || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error(
        "A valid product and positive integer quantity are required.",
      );
    }

    setCartItems((items) => {
      const detailId = productDetail?._id || null;
      const existingItem = items.find(
        (item) =>
          item.product._id === product._id &&
          (item.productDetail?._id || null) === detailId,
      );

      if (existingItem) {
        return items.map((item) =>
          item.product._id === product._id &&
          (item.productDetail?._id || null) === detailId
            ? { ...item, quantity: item.quantity + quantity, product, productDetail }
            : item,
        );
      }

      return [...items, { product, productDetail, quantity }];
    });
  };

  const updateQuantity = (productId, quantity, productDetailId = null) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Cart quantity must be a positive integer.");
    }

    setCartItems((items) =>
      items.map((item) =>
        item.product._id === productId &&
        (item.productDetail?._id || null) === productDetailId
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const removeFromCart = (productId, productDetailId = null) => {
    setCartItems((items) =>
      items.filter(
        (item) =>
          !(
            item.product._id === productId &&
            (item.productDetail?._id || null) === productDetailId
          ),
      ),
    );
  };

  const clearCart = () => setCartItems([]);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [cartItems, cartCount, isCartOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return context;
}
