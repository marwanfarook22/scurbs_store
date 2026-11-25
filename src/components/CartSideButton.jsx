import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageState";

export default function CartSideButton() {
  const { cartCount, openCart } = useCart();
  const { language, t } = useLanguage();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`${t("Shopping bag")}: ${cartCount} ${t("items")}`}
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`fixed top-1/2 z-30 flex min-h-12 -translate-y-1/2 items-center gap-2 rounded-sm border border-[#D9D1C7] bg-white px-3 py-2 text-sm font-bold text-[#03382E] shadow-lg transition hover:bg-[#03382E] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03382E] ${
        language === "ar" ? "left-0 rounded-s-none" : "right-0 rounded-e-none"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14l1 13H4L5 8zm4 0a3 3 0 016 0" />
      </svg>
      <span>{t("Bag")}</span>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#C5A368] px-1 text-xs text-white">
        {cartCount}
      </span>
    </button>
  );
}
