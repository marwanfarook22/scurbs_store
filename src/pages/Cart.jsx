import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { useCart } from "../context/CartContext";
import { useAuthStore } from "../store/useAuthStore";
import { useLanguage } from "../context/LanguageState";
import { buildWhatsAppUrl } from "../utils/whatsapp";

const paymentLabels = {
  cod: "Cash on Delivery",
  instapay: "InstaPay",
  wallet: "E-Wallet",
};

const getItemPrice = (product, productDetail = null) => {
  const source = productDetail || product;
  return source.salesPrice > 0 && source.salesPrice < source.price
    ? source.salesPrice
    : source.price;
};

export default function Cart() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user, updateUser } = useAuthStore();
  const savedPhone = user?.phone || user?.phoneNumber || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneAlreadyRegistered, setPhoneAlreadyRegistered] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [formData, setFormData] = useState({
    governorate: "",
    city: "",
    detailedAddress: "",
    phone: savedPhone,
    secondaryPhone: "",
    paymentMethod: "cod",
  });

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + getItemPrice(item.product, item.productDetail) * item.quantity,
    0,
  );
  const hasUnavailableItems = cartItems.some((item) => {
    const source = item.productDetail || item.product;
    return !Number.isFinite(source.quantityOnHand) || source.quantityOnHand < item.quantity;
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "phone") setPhoneAlreadyRegistered(false);
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error(t("Please log in before confirming your order."));
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast.error(t("Your shopping cart is empty."));
      return;
    }

    if (hasUnavailableItems) {
      toast.error(t("Please adjust unavailable product quantities before confirming your order."));
      return;
    }

    if (!savedPhone && !formData.phone.trim()) {
      toast.error(t("Please enter your phone number to complete your order."));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post("/bills", {
        shippingAddress: {
          governorate: formData.governorate.trim(),
          city: formData.city.trim(),
          detailedAddress: formData.detailedAddress.trim(),
        },
        items: cartItems.map(({ product, productDetail, quantity }) => ({
          product: product._id,
          productId: product._id,
          productDetailId: productDetail?._id || null,
          quantity,
        })),
        paymentMethod: formData.paymentMethod,
        ...(!savedPhone && { phone: formData.phone.trim() }),
        secondaryPhone: formData.secondaryPhone.trim(),
      });

      const bill = response.data.data;
      if (!bill?.billNumber || !Array.isArray(bill.items)) {
        throw new Error(t("The server returned an incomplete response after creating the order."));
      }

      if (!savedPhone) {
        updateUser({
          ...user,
          phone: formData.phone.trim(),
          phoneNumber: formData.phone.trim(),
        });
      }
      setCompletedOrder(bill);
      clearCart();
      toast.success(
        t("Your order {number} was placed successfully.").replace(
          "{number}",
          bill.billNumber,
        ),
      );
    } catch (error) {
      if (error.response?.data?.code === "PHONE_ALREADY_REGISTERED") {
        setPhoneAlreadyRegistered(true);
        toast.error(t("This phone number is already registered to another account."));
        return;
      }
      toast.error(
        error.response?.data?.message ||
          error.message ||
          t("Unable to place the order. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    const storePhone = import.meta.env.VITE_STORE_WHATSAPP;
    const orderNumber = completedOrder.billNumber || completedOrder._id?.slice(-6);
    const shippingAddress = completedOrder.shippingAddress || {};
    const address = [
      shippingAddress.governorate,
      shippingAddress.city,
      shippingAddress.detailedAddress,
    ]
      .filter(Boolean)
      .join("، ");
    const itemsLines = (completedOrder.items || [])
      .map((item, index) => {
        const variant = [item.color, item.size].filter(Boolean).join(" - ");
        const variantText = variant ? ` (${variant})` : "";
        const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
        return `${index + 1}. ${item.name}${variantText} × ${item.quantity} = ${subtotal.toFixed(2)} EGP`;
      })
      .join("\n");
    const whatsappMessage = [
      "مرحباً IATROS SCRUB 👋",
      `أرغب في تأكيد طلبي رقم: #${orderNumber}`,
      "",
      `👤 الاسم: ${completedOrder.customerInfo?.name || user?.name || ""}`,
      `📞 الهاتف: ${completedOrder.customerInfo?.phone || savedPhone}`,
      `📍 العنوان: ${address}`,
      "",
      "🛍️ تفاصيل الطلب:",
      itemsLines,
      "",
      `💰 الإجمالي: ${Number(completedOrder.totalAmount || 0).toFixed(2)} EGP`,
    ].join("\n");
    let whatsappUrl = "";
    let whatsappError = "";
    if (storePhone) {
      try {
        whatsappUrl = buildWhatsAppUrl(storePhone, whatsappMessage);
      } catch (error) {
        whatsappError = error.message;
      }
    }

    return (
      <section className="mx-auto my-12 max-w-2xl border border-[#EFE6DD] bg-white p-8 text-center shadow-sm">
        <CheckCircle2
          size={52}
          aria-hidden="true"
          className="mx-auto mb-4 text-[#03382E]"
        />
        <h1 className="text-2xl font-bold text-[#03382E]">
          {t("Your order {number} was placed successfully.").replace(
            "{number}",
            completedOrder.billNumber,
          )}
        </h1>
        <p className="mt-3 text-gray-600">
          {t("Send your order details to our store on WhatsApp to confirm it quickly.")}
        </p>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 font-semibold text-white transition hover:bg-[#1ebe5d]"
          >
            {t("Confirm order via WhatsApp")}
          </a>
        ) : (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {whatsappError || t("Store WhatsApp is not configured.")}
          </p>
        )}
        <Link
          to="/orders"
          className="mt-5 block text-sm font-semibold text-[#03382E] underline"
        >
          {t("View my orders")}
        </Link>
      </section>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C5A368]">
          IATROS SCRUB
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#1A1A1A]">
          {t("Shopping cart and checkout")}
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-sm border border-[#EFE6DD] bg-white p-10 text-center shadow-sm">
          <p className="mb-5 text-lg text-gray-600">{t("Your shopping cart is currently empty.")}</p>
          <Link
            to="/"
            className="inline-block bg-[#03382E] px-6 py-3 font-semibold text-white transition hover:bg-black"
          >
            {t("Continue shopping")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4" aria-label={t("Cart items")}>
            {cartItems.map(({ product, productDetail, quantity }) => {
              const source = productDetail || product;
              const available = Number(source.quantityOnHand) || 0;
              const price = getItemPrice(product, productDetail);
              const detailId = productDetail?._id || null;

              return (
                <article
                  key={`${product._id}-${detailId || "base"}`}
                  className="flex gap-4 border border-[#EFE6DD] bg-white p-4 shadow-sm"
                >
                  <img
                    src={productDetail?.imagesList?.[0]}
                    alt={product.name}
                    className="h-28 w-24 shrink-0 bg-[#F5EBE6] object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-[#1A1A1A]">
                          {product.name}
                        </h2>
                        {productDetail && (
                          <p className="mt-1 text-sm text-gray-500">
                            {productDetail.size} · {productDetail.color?.name}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          {price} EGP {t("per item")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product._id, detailId)}
                        className="h-fit text-sm font-medium text-[#9B2C2C] hover:underline"
                        aria-label={`${t("Remove")} ${product.name}`}
                      >
                        {t("Remove")}
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <div className="flex items-center border border-[#EFE6DD]">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              product._id,
                              Math.max(1, quantity - 1),
                              detailId,
                            )
                          }
                          disabled={quantity <= 1}
                          className="px-3 py-1.5 font-bold text-[#03382E] disabled:opacity-40"
                          aria-label={`${t("Decrease quantity")} ${product.name}`}
                        >
                          −
                        </button>
                        <span className="min-w-10 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(product._id, quantity + 1, detailId)
                          }
                          disabled={quantity >= available}
                          className="px-3 py-1.5 font-bold text-[#03382E] disabled:opacity-40"
                          aria-label={`${t("Increase quantity")} ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-[#03382E]">
                        {(price * quantity).toFixed(2)} EGP
                      </span>
                    </div>
                    {quantity > available && (
                      <p className="mt-2 text-sm text-[#9B2C2C]">
                        {t("Available now:")} {available}. {t("Adjust the quantity to continue.")}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
            <button
              type="button"
              onClick={clearCart}
              className="text-sm font-medium text-gray-500 hover:text-[#9B2C2C]"
            >
              {t("Clear cart")}
            </button>
          </section>

          <form
            onSubmit={handleSubmit}
            className="h-fit space-y-6 border border-[#EFE6DD] bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">
                {t("Delivery information")}
              </h2>
              {isAuthenticated ? (
                <p className="mt-2 text-sm text-gray-600">
                  {user?.name}
                  {savedPhone ? ` · ${savedPhone}` : ""}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[#9B2C2C]">
                  {t("You must log in to complete your order.")}{" "}
                  <Link to="/login" className="font-semibold underline">
                    {t("Login")}
                  </Link>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-gray-700">
                {t("Governorate")}
                <input
                  name="governorate"
                  value={formData.governorate}
                  onChange={handleChange}
                  required
                  autoComplete="address-level1"
                  className="w-full border border-[#D9D1C7] px-3 py-2.5 text-[#1A1A1A] focus:border-[#03382E] focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700">
                {t("City / Area")}
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  autoComplete="address-level2"
                  className="w-full border border-[#D9D1C7] px-3 py-2.5 text-[#1A1A1A] focus:border-[#03382E] focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
                {t("Detailed address")}
                <textarea
                  name="detailedAddress"
                  value={formData.detailedAddress}
                  onChange={handleChange}
                  required
                  rows={3}
                  autoComplete="street-address"
                  className="w-full border border-[#D9D1C7] px-3 py-2.5 text-[#1A1A1A] focus:border-[#03382E] focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
                {t("Phone Number")}
                {savedPhone ? (
                  <p className="border border-[#D9D1C7] bg-[#FAF8F6] px-3 py-2.5 text-[#03382E]">
                    {savedPhone}
                  </p>
                ) : (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                    aria-invalid={phoneAlreadyRegistered}
                    aria-describedby={
                      phoneAlreadyRegistered ? "phone-already-registered" : undefined
                    }
                    className={`w-full border px-3 py-2.5 text-[#1A1A1A] focus:outline-none ${
                      phoneAlreadyRegistered
                        ? "border-red-500 focus:border-red-500"
                        : "border-[#D9D1C7] focus:border-[#03382E]"
                    }`}
                  />
                )}
                {!savedPhone && phoneAlreadyRegistered && (
                  <p
                    id="phone-already-registered"
                    role="alert"
                    className="flex items-center gap-1.5 text-sm font-medium text-red-700"
                  >
                    <CheckCircle2 size={16} aria-hidden="true" />
                    {t("This phone number is already registered to another account.")}
                  </p>
                )}
              </label>
              <label className="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
                {t("Additional phone number (optional)")}
                <input
                  type="tel"
                  name="secondaryPhone"
                  value={formData.secondaryPhone}
                  onChange={handleChange}
                  autoComplete="tel"
                  className="w-full border border-[#D9D1C7] px-3 py-2.5 text-[#1A1A1A] focus:border-[#03382E] focus:outline-none"
                />
              </label>
            </div>

            <fieldset className="space-y-3">
              <legend className="font-bold text-[#1A1A1A]">{t("Payment method")}</legend>
              {Object.entries(paymentLabels).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={formData.paymentMethod === value}
                    onChange={handleChange}
                    className="accent-[#03382E]"
                  />
                  {t(label)}
                </label>
              ))}
            </fieldset>

            <div className="border-t border-[#EFE6DD] pt-4">
              <div className="flex justify-between text-lg font-bold text-[#03382E]">
                <span>{t("Total")}</span>
                <span>{subtotal.toFixed(2)} EGP</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
              </p>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !isAuthenticated ||
                hasUnavailableItems
              }
              className="w-full bg-[#03382E] px-5 py-3.5 font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("Submitting order...") : t("Place order")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}