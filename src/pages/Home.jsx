import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageState";

// 1. مكون كارت المنتج المستقل (لإدارة حركة الصور المنفصلة لكل منتج)
const ProductCard = ({ product, variant = "grid" }) => {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const details = Array.isArray(product.details) ? product.details : [];
  const allImages = [
    ...new Set(details.flatMap((detail) => detail.imagesList || [])),
  ];
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const colorNames = [...new Set(details.map((detail) => detail.color?.name).filter(Boolean))];
  const [selectedColor, setSelectedColor] = useState(colorNames[0] || "");
  const [addedSize, setAddedSize] = useState("");
  const [liveMessage, setLiveMessage] = useState("");
  const selectedDetails = details.filter((detail) => !selectedColor || detail.color?.name === selectedColor);
  const selectedDetail = selectedDetails[0] || null;
  const displayDetail = selectedDetail;
  const displayPrice = displayDetail || product;
  const effectivePrice =
    displayPrice.salesPrice > 0 && displayPrice.salesPrice < displayPrice.price
      ? displayPrice.salesPrice
      : displayPrice.price;

  // الرابط المؤدي لصفحة تفاصيل المنتج (باستخدام الـ slug أو الـ _id)
  const productUrl = `/product/${product.slug || product._id}`;

  // تصميم كارت السلايدر (المنتجات المميزة)
  if (variant === "slider") {
    return (
      <Link
        to={productUrl}
        onMouseEnter={() => {
          if (allImages.length > 1) {
            setCurrentImgIndex(1 % allImages.length);
          }
        }}
        onMouseLeave={() => {
          setCurrentImgIndex(0);
        }}
        className="min-w-[280px] sm:min-w-[320px] h-[220px] snap-center relative rounded-sm overflow-hidden shadow-sm flex-shrink-0 group cursor-pointer block"
      >
        <img
          src={allImages[currentImgIndex]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

        <span className="absolute top-4 left-4 bg-[#F5EBE6] text-[#1A1A1A] text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-sm z-10">
          ⭐ {t("Featured")}
        </span>

        <div className="absolute bottom-0 left-0 p-5 w-full pointer-events-none">
          <h3 className="text-xl font-bold text-white mb-1 truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-3">
            {product.salesPrice > 0 && product.salesPrice < product.price ? (
              <>
                <span className="text-lg font-bold text-[#E63946]">
                  {product.salesPrice} EGP
                </span>
                <span className="text-sm text-gray-300 line-through">
                  {product.price} EGP
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-white">
                {product.price} EGP
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // تصميم الكارت العادي (شبكة المنتجات)
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => navigate(productUrl)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) {
          navigate(productUrl);
        }
      }}
      onMouseEnter={() => {
        if (allImages.length > 1) {
          setCurrentImgIndex(1 % allImages.length);
        }
      }}
      onMouseLeave={() => {
        setCurrentImgIndex(0);
      }}
      className="group bg-white rounded-sm shadow-sm border border-[#EFE6DD] overflow-hidden hover:shadow-md transition duration-300 flex flex-col relative"
    >
      {product.isFeatured && (
        <span className="absolute top-3 left-3 z-10 bg-[#F5EBE6] text-[#1A1A1A] text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm pointer-events-none">
          ⭐ {t("Featured")}
        </span>
      )}

      {product.salesPrice > 0 && product.salesPrice < product.price && (
        <span className="absolute top-3 right-3 z-10 bg-[#E63946] text-white text-xs font-semibold px-2 py-1 rounded-sm pointer-events-none">
          {t("Sale")}
        </span>
      )}

      {/* الضغط على الصورة ينقل لصفحة تفاصيل المنتج */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#FAF8F6]">
        <div className="absolute inset-0">
          <img
            src={displayDetail?.imagesList?.[0] || allImages[currentImgIndex]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-2 transition-all duration-300 hover:scale-105 sm:p-3"
          />
        </div>

        <div
          onClick={(event) => event.stopPropagation()}
          className="absolute inset-x-2 bottom-2 z-20 rounded-sm border border-white/70 bg-white/85 px-2 py-2 shadow-sm backdrop-blur-md max-md:translate-y-0 max-md:opacity-100 md:translate-y-[calc(100%+0.75rem)] md:opacity-0 md:transition-all md:duration-200 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 motion-reduce:transition-none"
        >
          <p className="mb-1 text-[10px] font-semibold text-gray-500">
            {t("Quick add · choose size")}
          </p>
          <div className="grid grid-cols-6 gap-1" dir="ltr">
            {["S", "M", "L", "XL", "XXL", "XXXL"].map((size, sizeIndex) => {
              const detail = selectedDetails.find((item) =>
                String(item.size).toUpperCase() === size
              );
              const displaySize = ["S", "M", "L", "XL", "2XL", "3XL"][sizeIndex];
              const isOut = !detail || detail.quantityOnHand <= 0;
              const isAdded = addedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={isOut}
                  aria-label={`${t("Add size")} ${displaySize} ${t("to bag")}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!detail || detail.quantityOnHand <= 0) return;
                    addToCart(product, 1, detail);
                    setAddedSize(size);
                    setLiveMessage(`${displaySize} ${t("added to bag")}`);
                    window.setTimeout(() => setAddedSize(""), 1500);
                  }}
                  className={`h-8 min-w-0 rounded-sm border text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03382E] ${
                    isOut
                      ? "cursor-not-allowed border-[#E8E2DC] text-gray-400 line-through opacity-70"
                      : isAdded
                        ? "border-[#03382E] bg-[#03382E] text-white"
                        : "border-[#D9D1C7] bg-white text-[#1A1A1A] hover:border-[#03382E] hover:bg-[#03382E] hover:text-white"
                  }`}
                >
                  {isAdded ? (
                    <span aria-hidden="true">✓ {t("Added")}</span>
                  ) : displaySize}
                </button>
              );
            })}
          </div>
          <p className="sr-only" aria-live="polite">{liveMessage}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <span className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
          {product.category?.name}
        </span>

        <h3 className="text-md font-bold text-[#1A1A1A] mb-2 line-clamp-2">
          {product.name}
        </h3>

        <p className="mb-2 text-xs text-gray-500">
          {selectedColor ? `${selectedColor} · ` : ""}{effectivePrice} EGP
        </p>

        {colorNames.length > 0 && (
          <div
            role="group"
            aria-label={t("Choose colour")}
            className="mb-3 flex items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {colorNames.map((colorName) => {
              const detail = details.find((item) => item.color?.name === colorName);
              const isSelected = selectedColor === colorName;
              return (
                <button
                  key={colorName}
                  type="button"
                  aria-label={`${t("Choose colour")} ${colorName}`}
                  aria-pressed={isSelected}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedColor(colorName);
                    setAddedSize("");
                    setCurrentImgIndex(0);
                  }}
                  className={`h-5 w-5 rounded-full border-2 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#03382E] ${isSelected ? "border-[#03382E] ring-2 ring-[#03382E]/20" : "border-white ring-1 ring-gray-300"}`}
                  style={{ backgroundColor: detail?.color?.hex || "#D9D1C7" }}
                />
              );
            })}
          </div>
        )}

        <div className="mt-auto border-t border-[#EFE6DD] pt-3">
          {displayPrice.salesPrice > 0 && displayPrice.salesPrice < displayPrice.price ? (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#E63946]">{displayPrice.salesPrice} EGP</span>
              <span className="text-xs text-gray-400 line-through">{displayPrice.price} EGP</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-[#1A1A1A]">{effectivePrice} EGP</span>
          )}
        </div>
      </div>
    </article>
  );
};

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          axiosInstance.get("/products"),
          axiosInstance.get("/categories"),
        ]);

        setProducts(productsRes.data.data);
        setCategories(categoriesRes.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        const response = await axiosInstance.get("/instagram-posts");
        setInstagramPosts(response.data.data || []);
      } catch (error) {
        console.error("Error fetching Instagram posts:", error);
      }
    };

    fetchInstagramPosts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category?._id === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query.trim() === "" ||
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const featuredProducts = products.filter(
    (product) => product.isFeatured === true,
  );

  return (
    <div className="mx-auto max-w-[1400px] px-1 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5 flex-shrink-0">
          <div className="sticky top-6 space-y-6">
            <div className="bg-white p-4 rounded-sm shadow-sm border border-[#EFE6DD]">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">{t("Search")}</h3>
              <input
                type="text"
                placeholder={t("Search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-[#E5E7EB] placeholder:text-gray-500 focus:outline-none focus:border-[#03382E] focus:ring-2 focus:ring-[#C5A368] text-sm text-[#1A1A1A] bg-white"
                dir="auto"
              />
            </div>

            <div className="bg-white p-4 rounded-sm shadow-sm border border-[#EFE6DD] hidden md:block">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4 border-b border-[#EFE6DD] pb-2">
                {t("Categories")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className={`w-full text-start px-4 py-2.5 rounded-sm transition font-medium text-sm ${
                      selectedCategory === "All"
                        ? "bg-[#03382E] text-white"
                        : "text-gray-500 hover:bg-[#F5EBE6]"
                    }`}
                  >
                    {t("All Products")}
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <button
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`w-full text-start px-4 py-2.5 rounded-sm transition font-medium text-sm ${
                        selectedCategory === cat._id
                          ? "bg-[#03382E] text-white"
                          : "text-gray-500 hover:bg-[#F5EBE6]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                  selectedCategory === "All"
                    ? "bg-[#03382E] text-white"
                    : "bg-white border border-[#EFE6DD] text-gray-500"
                }`}
              >
                {t("All")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                    selectedCategory === cat._id
                      ? "bg-[#03382E] text-white"
                      : "bg-white border border-[#EFE6DD] text-gray-500"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="w-full md:w-3/4 lg:w-4/5">
          {featuredProducts.length > 0 &&
            searchQuery === "" &&
            selectedCategory === "All" && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
                  <span>🔥</span> {t("Top Featured")}
                </h2>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-4 scrollbar-hide">
                  {featuredProducts.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      variant="slider"
                    />
                  ))}
                </div>
              </div>
            )}

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
              {selectedCategory === "All"
                ? t("All Products")
                : categories.find(
                    (category) => category._id === selectedCategory,
                  )?.name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredProducts.length} {t("items")})
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="animate-spin h-10 w-10 border-4 border-[#03382E] border-t-transparent rounded-full"></span>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  variant="grid"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-[#EFE6DD] rounded-sm">
              <p className="text-xl text-gray-500">
                {t("No products match your search.")}
              </p>
            </div>
          )}
        </main>
      </div>
      {instagramPosts.length > 0 && (
        <section
          aria-labelledby="instagram-posts-heading"
          className="mt-12"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C5A368]">
                Instagram
              </p>
              <h2
                id="instagram-posts-heading"
                className="mt-1 text-2xl font-bold text-[#1A1A1A]"
              >
                {t("Follow us on Instagram")}
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              {t("Swipe to explore our posts.")}
            </p>
          </div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {instagramPosts.map((post) => (
              <article
                key={post._id}
                className="w-[min(82vw,340px)] shrink-0 snap-start overflow-hidden rounded-sm border border-[#EFE6DD] bg-white shadow-sm sm:w-[340px]"
              >
                <iframe
                  src={`https://www.instagram.com/${post.postType}/${post.shortcode}/embed`}
                  title={t("Instagram post")}
                  loading="lazy"
                  allow="encrypted-media"
                  className="h-[440px] w-full border-0"
                />
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block border-t border-[#EFE6DD] px-4 py-3 text-center text-sm font-semibold text-[#03382E] hover:text-[#C5A368]"
                >
                  {t("View on Instagram")}
                </a>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
