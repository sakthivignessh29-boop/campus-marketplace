import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Product, Category } from '../types';
import { Search, Plus, SlidersHorizontal, Heart, Award, Leaf, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MarketplacePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Search Filters
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [useAiSearch, setUseAiSearch] = useState(false);

  const [wishlistedIds, setWishlistedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial content
  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const catResponse = await api.get('/api/products/categories');
      setCategories(catResponse.data);

      let data;
      if (useAiSearch && query.trim()) {
        const prodResponse = await api.get(`/api/products/ai-smart-search?query=${encodeURIComponent(query)}`);
        data = prodResponse.data;
      } else {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
        if (selectedType && selectedType !== 'All') params.append('type', selectedType);
        if (selectedCondition && selectedCondition !== 'All') params.append('condition', selectedCondition);

        const prodResponse = await api.get(`/api/products/search?${params.toString()}`);
        data = prodResponse.data;
      }
      setProducts(data);

      // Load wishlists to mark stars
      const wishResponse = await api.get('/api/users/wishlist');
      if (wishResponse.data) {
        const ids = wishResponse.data.map((item: any) => item.product.id);
        setWishlistedIds(ids);
      }
    } catch (e) {
      console.error('Error fetching marketplace details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, [selectedCategory, selectedType, selectedCondition, useAiSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMarketplace();
  };

  const handleWishlistToggle = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post(`/api/users/wishlist/toggle/${productId}`);
      setWishlistedIds((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SELL': return 'bg-emerald-100 text-emerald-800';
      case 'DONATE': return 'bg-rose-100 text-rose-800';
      case 'EXCHANGE': return 'bg-blue-100 text-blue-800';
      case 'RENT': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative">
      
      {/* Header and Floating button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-poppins text-3xl font-extrabold text-gray-900 tracking-tight">Campus Circulate Hub</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Recycle materials, save expenses, and protect campus environment</p>
        </div>
        <Link
          to="/create-listing"
          className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl font-semibold shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> List New Resource
        </Link>
      </div>

      {/* AI Smart Search Toggle */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-2xl p-3.5 px-5 max-w-md shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <span className="text-xs font-bold text-primary-dark block">EcoGuide AI Smart Search</span>
            <p className="text-[10px] text-gray-500 mt-0.5">Search using natural queries (e.g., "calculator under ₹500")</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setUseAiSearch(!useAiSearch);
          }}
          className={`relative inline-flex h-5.5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useAiSearch ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <span
            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useAiSearch ? 'translate-x-4.5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Search Bar & Filters Form */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="relative lg:col-span-6">
          {useAiSearch ? (
            <Sparkles className="absolute left-4 top-3.5 w-4 h-4 text-primary animate-pulse" />
          ) : (
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={useAiSearch ? "Ask Gemini: e.g. Need a second-hand scientific calculator under ₹500..." : "Search textbooks, drawing boards, lab kits, speakers..."}
            className={`w-full pl-11 pr-4 py-3 bg-white/70 border rounded-2xl text-xs focus:outline-none transition-all glass ${useAiSearch ? 'border-primary/30 focus:border-primary-dark ring-1 ring-primary/10' : 'border-primary/10 hover:border-primary/20 focus:border-primary'}`}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:col-span-5">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={useAiSearch}
            className="px-3 py-3 bg-white/70 border border-primary/10 rounded-2xl text-xs focus:outline-none glass text-gray-600 font-medium disabled:opacity-50"
          >
            <option value="All">All Types</option>
            <option value="SELL">Sell</option>
            <option value="EXCHANGE">Exchange</option>
            <option value="DONATE">Donate</option>
            <option value="RENT">Rent</option>
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            disabled={useAiSearch}
            className="px-3 py-3 bg-white/70 border border-primary/10 rounded-2xl text-xs focus:outline-none glass text-gray-600 font-medium disabled:opacity-50"
          >
            <option value="All">All Conditions</option>
            <option value="NEW">New</option>
            <option value="LIKE_NEW">Like New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={useAiSearch}
            className="px-3 py-3 bg-white/70 border border-primary/10 rounded-2xl text-xs focus:outline-none glass text-gray-600 font-medium disabled:opacity-50"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className={`font-bold py-3.5 px-4 rounded-2xl text-xs transition-all lg:col-span-1 border flex items-center justify-center gap-1.5 ${useAiSearch ? 'bg-primary text-white border-primary hover:bg-primary-dark shadow-md shadow-primary/10' : 'bg-primary/10 hover:bg-primary/25 text-primary-dark border-primary/10'}`}
        >
          {useAiSearch ? <Sparkles className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
          {useAiSearch ? 'AI Search' : 'Search'}
        </button>
      </form>

      {/* Category Pills shortcut */}
      <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${useAiSearch ? 'opacity-50 pointer-events-none' : ''}`}>
        <button
          onClick={() => setSelectedCategory('All')}
          disabled={useAiSearch}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === 'All' ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-primary/10 hover:text-primary-dark border border-primary/5'}`}
        >
          All Resources
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.name)}
            disabled={useAiSearch}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === c.name ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-primary/10 hover:text-primary-dark border border-primary/5'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Marketplace Listings grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400 font-medium">Circulating listings feed...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-primary/10 rounded-3xl bg-primary/5 space-y-2">
          <Leaf className="w-10 h-10 text-primary/30 mx-auto animate-float" />
          <h3 className="font-bold text-gray-700">No active listings found</h3>
          <p className="text-xs text-gray-400">Be the first to list or donate an item in this category!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Link
              to={`/product/${p.id}`}
              key={p.id}
              className="bg-white hover:bg-eco-bg/50 border border-primary/5 rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all overflow-hidden flex flex-col group"
            >
              {/* Product Image */}
              <div className="h-48 bg-primary/5 relative overflow-hidden flex items-center justify-center">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  />
                ) : (
                  <div className="text-primary/20 text-4xl">🌱</div>
                )}
                {/* Product Type Badge */}
                <span className={`absolute top-4 left-4 px-3 py-1 rounded-xl text-[10px] font-bold tracking-wide ${getTypeColor(p.type)}`}>
                  {p.type}
                </span>

                {/* Sustainability Score Badge */}
                <span className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-xl flex items-center gap-0.5 shadow-sm">
                  <Leaf className="w-3 h-3" /> {p.sustainabilityScore.toFixed(0)}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{p.category.name}</span>
                  <h3 className="font-poppins font-bold text-gray-900 leading-tight group-hover:text-primary transition-all text-sm line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-primary/5">
                  <div>
                    {p.type === 'DONATE' ? (
                      <span className="text-emerald-600 font-extrabold text-sm uppercase">FREE</span>
                    ) : (
                      <span className="text-gray-900 font-extrabold text-sm">₹{p.price.toFixed(0)}</span>
                    )}
                    <span className="text-[10px] text-gray-400 block font-medium">Cond: {p.itemCondition}</span>
                  </div>
                  <button
                    onClick={(e) => handleWishlistToggle(p.id, e)}
                    className="p-2.5 rounded-xl border border-primary/10 hover:bg-rose-50 hover:text-rose-500 text-gray-400 transition-all"
                  >
                    <Heart className={`w-4 h-4 ${wishlistedIds.includes(p.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
