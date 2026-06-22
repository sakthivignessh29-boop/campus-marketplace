import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User, Badge, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { Leaf, Award, Shield, DollarSign, Archive, Heart } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState<{
    user: User | null;
    badges: Badge[];
    listings: Product[];
    transactions: any[];
    impact: {
      itemsReused: number;
      co2SavedKg: number;
      financialSavings: number;
    };
  }>({
    user: null,
    badges: [],
    listings: [],
    transactions: [],
    impact: { itemsReused: 0, co2SavedKg: 0, financialSavings: 0 },
  });

  const [activeTab, setActiveTab] = useState<'listings' | 'transactions'>('listings');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const loadProfile = async () => {
      try {
        const response = await api.get('/api/users/me');
        setProfileData(response.data);
      } catch (e) {
        console.error('Error fetching profile data', e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  if (loading || !user) {
    return <div className="py-20 text-center text-xs text-gray-400 font-medium">Syncing profile details...</div>;
  }

  // Badge mapping description helper
  const getBadgeDetails = (type: string) => {
    switch (type) {
      case 'ECO_STARTER': return { label: 'Eco Starter', emoji: '🌱', desc: 'Listed first item on marketplace.' };
      case 'RECYCLER': return { label: 'Recycler', emoji: '♻', desc: 'Contributed 50+ EcoPoints.' };
      case 'SUSTAINABILITY_HERO': return { label: 'Sustainability Hero', emoji: '🌍', desc: 'Contributed 150+ EcoPoints.' };
      case 'GREEN_CHAMPION': return { label: 'Green Champion', emoji: '🏆', desc: 'NIT top circular economy leader.' };
      default: return { label: 'Contributor', emoji: '🎖', desc: 'Eco participant.' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 -z-10"></div>

      {/* Hero Header */}
      <div className="glass rounded-3xl border border-primary/10 p-8 flex flex-col md:flex-row gap-6 justify-between items-center shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-xl shadow-md">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-poppins text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-xs text-gray-400">{user.department} • Year {user.year}</p>
            <p className="text-[10px] text-primary font-semibold uppercase mt-0.5">{user.college}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 text-center min-w-[100px]">
            <span className="text-[10px] text-gray-400 font-medium">EcoPoints</span>
            <p className="text-xl font-black text-primary-dark mt-0.5">{user.ecoPoints} EP</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center min-w-[100px]">
            <span className="text-[10px] text-gray-400 font-medium">Eco Rank</span>
            <div className="flex items-center gap-0.5 mt-0.5 justify-center text-amber-700 font-bold">
              <Award className="w-4 h-4" />
              <span>🎖 Level {Math.floor(user.ecoPoints / 50) + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Card Grid */}
      <div className="space-y-4">
        <h2 className="font-poppins font-extrabold text-lg text-gray-900">Your Campus Contribution</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 border border-primary/10 shadow-sm text-center space-y-2">
            <Leaf className="w-8 h-8 text-emerald-600 mx-auto animate-float" />
            <h3 className="text-2xl font-black text-primary-dark">{profileData.impact.co2SavedKg.toFixed(1)} kg</h3>
            <p className="text-[11px] text-gray-400 font-medium uppercase">CO₂ Emissions Saved</p>
            <p className="text-[11px] text-gray-500">Prevented from recycled textbook and device cycles</p>
          </div>

          <div className="glass rounded-2xl p-6 border border-primary/10 shadow-sm text-center space-y-2">
            <DollarSign className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="text-2xl font-black text-amber-700">₹{profileData.impact.financialSavings.toLocaleString()}</h3>
            <p className="text-[11px] text-gray-400 font-medium uppercase">Financial Savings</p>
            <p className="text-[11px] text-gray-500">Saved by acquiring shared peer resources</p>
          </div>

          <div className="glass rounded-2xl p-6 border border-primary/10 shadow-sm text-center space-y-2">
            <Archive className="w-8 h-8 text-secondary mx-auto" />
            <h3 className="text-2xl font-black text-secondary">{profileData.listings.length} Listings</h3>
            <p className="text-[11px] text-gray-400 font-medium uppercase">Active Posts</p>
            <p className="text-[11px] text-gray-500">Currently listed available textbooks or items</p>
          </div>
        </div>
      </div>

      {/* Badges Cabinet */}
      <div className="space-y-4">
        <h2 className="font-poppins font-extrabold text-lg text-gray-900">Achievement Badges Cabinet</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {['ECO_STARTER', 'RECYCLER', 'SUSTAINABILITY_HERO', 'GREEN_CHAMPION'].map((type) => {
            const hasBadge = profileData.badges.some((b) => b.type === type);
            const badge = getBadgeDetails(type);

            return (
              <div
                key={type}
                className={`glass rounded-2xl p-6 border text-center space-y-2 transition-all duration-300 ${hasBadge ? 'border-primary/20 shadow-md scale-100 opacity-100' : 'border-gray-200 shadow-none scale-95 opacity-40'}`}
              >
                <div className="text-3xl animate-float">{badge.emoji}</div>
                <h3 className="font-bold text-xs text-gray-800">{badge.label}</h3>
                <p className="text-[10px] text-gray-500 leading-snug">{badge.desc}</p>
                {hasBadge && (
                  <span className="text-[9px] bg-primary/10 text-primary-dark font-bold px-2 py-0.5 rounded-full inline-block">Unlocked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-primary/10 gap-6 text-sm font-bold font-poppins pb-1">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'listings' ? 'border-primary text-primary-dark font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
        >
          Your Active Listings ({profileData.listings.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 border-b-2 transition-all ${activeTab === 'transactions' ? 'border-primary text-primary-dark font-extrabold' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
        >
          Circular Transactions History ({profileData.transactions.length})
        </button>
      </div>

      {/* Tab Content rendering */}
      {activeTab === 'listings' ? (
        <div className="space-y-4">
          {profileData.listings.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">You do not have any active posts.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {profileData.listings.map((p) => (
                <div key={p.id} className="bg-white border border-primary/5 rounded-3xl overflow-hidden shadow-sm flex flex-col p-4 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                    <span>{p.category.name}</span>
                    <span className="bg-primary/10 text-primary-dark px-2 py-0.5 rounded">{p.type}</span>
                  </div>
                  <h3 className="font-poppins font-bold text-xs text-gray-800 truncate">{p.name}</h3>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-primary/5">
                    <span className="font-bold">{p.type === 'DONATE' ? 'FREE' : `₹${p.price}`}</span>
                    <span className="text-gray-400 text-[10px]">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {profileData.transactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">No transactions recorded yet. Secure listings or buy books to log entries!</div>
          ) : (
            <div className="divide-y divide-primary/5 border border-primary/10 rounded-3xl bg-white shadow-sm overflow-hidden">
              {profileData.transactions.map((t) => {
                const isBuyer = t.buyer.id === user.id;
                return (
                  <div key={t.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-primary/5">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/5 border border-primary/10 flex-shrink-0 flex items-center justify-center font-bold text-lg text-primary">
                        {t.product.imageUrl ? (
                          <img src={t.product.imageUrl} alt={t.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>🌱</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{t.product.name}</h4>
                        <p className="text-[10px] text-gray-450 mt-0.5">
                          {isBuyer ? `Bought from ${t.seller.name}` : `Sold to ${t.buyer.name}`} • {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex flex-col items-end">
                        <span className="font-extrabold text-sm text-gray-800">
                          {t.type === 'DONATE' ? 'FREE' : `₹${t.product.price}`}
                        </span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{t.type}</span>
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isBuyer ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-primary/10 text-primary-dark border-primary/15'}`}>
                        {isBuyer ? 'PURCHASE' : 'SALE'}
                      </span>
                      
                      <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 border border-emerald-100/30 px-2 py-0.5 rounded-lg">
                        +{isBuyer ? 15 : 10} EP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
