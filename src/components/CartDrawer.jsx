import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageState";
import { useAuthStore } from "../store/useAuthStore";

const getItemPrice = (product, productDetail = null) => {
  const source = productDetail || product;
  return source.salesPrice > 0 && source.salesPrice < source.price
    ? source.salesPrice
    : source.price;
};

export default function CartDrawer() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuthStore();
  const {
    cartItems,
    cartCount,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + getItemPrice(item.product, item.productDetail) * item.quantity,
    0,
  );

  useEffect(() => {
    if (!isCartOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isCartOpen, closeCart]);

  const goToCart = () => {
    closeCart();
    navigate("/cart");
  };

  return (
    <>
      {isCartOpen && (
        <button
          type="button"
          aria-label={t("Close shopping bag")}
          onClick={closeCart}
          className="fixed inset-0 z-40 cursor-default bg-black/35 backdrop-blur-[1px]"
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("Shopping bag")}
        dir={language === "ar" ? "rtl" : "ltr"}
        className={`fixed inset-y-0 z-50 flex w-[min(92vw,420px)] flex-col bg-white shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${
          language === "ar" ? "left-0" : "right-0"
        } ${isCartOpen ? "translate-x-0" : language === "ar" ? "-translate-x-full" : "translate-x-full"}`}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EFE6DD] px-5">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {t("Shopping bag")} ({cartCount})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("Close shopping bag")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1A1A1A] transition hover:bg-[#F5EBE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03382E]"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="mb-5 text-gray-500">{t("Your shopping cart is currently empty")}</p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate("/");
                }}
                className="bg-[#03382E] px-5 py-3 font-semibold text-white"
              >
                {t("Continue shopping")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map(({ product, productDetail, quantity }) => {
                const source = productDetail || product;
                const price = getItemPrice(product, productDetail);
                const detailId = productDetail?._id || null;
                const available = Number(source.quantityOnHand) || 0;

                return (
                  <article
                    key={`${product._id}-${detailId || "base"}`}
                    className="flex gap-3 border-b border-[#EFE6DD] pb-4"
                  >
                    <img
                      src={productDetail?.imagesList?.[0]}
                      alt={product.name}
                      className="h-24 w-20 shrink-0 rounded-sm bg-[#F5EBE6] object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-[#1A1A1A]">{product.name}</h3>
                          {productDetail && (
                            <p className="mt-1 text-xs text-gray-500">
                              {productDetail.size} · {productDetail.color?.name}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-gray-500">{price} EGP</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product._id, detailId)}
                          aria-label={`${t("Remove")} ${product.name}`}
                          className="text-xs font-medium text-[#9B2C2C] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03382E]"
                        >
                          {t("Remove")}
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-[#EFE6DD]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product._id, Math.max(1, quantity - 1), detailId)}
                            disabled={quantity <= 1}
                            aria-label={`${t("Decrease quantity")} ${product.name}`}
                            className="px-3 py-1.5 font-bold text-[#03382E] disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-9 text-center text-sm">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product._id, quantity + 1, detailId)}
                            disabled={quantity >= available}
                            aria-label={`${t("Increase quantity")} ${product.name}`}
                            className="px-3 py-1.5 font-bold text-[#03382E] disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-[#03382E]">
                          {(price * quantity).toFixed(2)} EGP
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <footer className="shrink-0 border-t border-[#EFE6DD] bg-white p-5">
            <div className="mb-4 flex items-center justify-between text-lg font-bold text-[#03382E]">
              <span>{t("Subtotal")}</span>
              <span>{subtotal.toFixed(2)} EGP</span>
            </div>
            <button
              type="button"
              onClick={goToCart}
              className="w-full bg-[#03382E] px-5 py-3.5 font-semibold text-white transition hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A368]"
            >
              {t("View bag")}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
