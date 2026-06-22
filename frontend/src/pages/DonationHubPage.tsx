import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Donation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Heart, Leaf, HelpCircle, Truck, CheckCircle, Gift } from 'lucide-react';

export const DonationHubPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/donations/active');
      setDonations(response.data);
    } catch (e) {
      console.error('Error fetching donations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleClaim = async (donationId: number) => {
    setSubmitting(true);
    try {
      await api.post(`/api/donations/match/${donationId}`);
      loadDonations();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to match donation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteDelivery = async (donationId: number) => {
    setSubmitting(true);
    try {
      await api.put(`/api/donations/status/${donationId}?status=DELIVERED`);
      loadDonations();
    } catch (err: any) {
      setError(err.response?.data || 'Failed to update delivery');
    } finally {
      setSubmitting(false);
    }
  };

  // Get status text helper
  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'Available for Claim';
      case 'MATCHED': return 'Matched (Pending Pickup)';
      case 'PICKED_UP': return 'In Transit';
      case 'DELIVERED': return 'Delivered (Reused)';
      default: return 'Pending';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 to-primary/5 -z-10"></div>

      {/* Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-poppins text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Gift className="w-8 h-8 text-rose-500 animate-float" /> Donation Hub
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm">Give away educational or personal resources, save landfill space, and assist juniors.</p>
        </div>
        <button
          onClick={() => navigate('/create-listing')}
          className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-2xl font-bold shadow-md shadow-rose-500/10 hover:shadow-lg transition-all"
        >
          Donate an Item
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-3.5 rounded-xl text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Active items list */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="font-poppins font-bold text-sm text-gray-900">Unclaimed Free Listings</h2>
          
          {loading ? (
            <div className="py-20 text-center text-xs text-gray-400 font-medium">Syncing donation posts...</div>
          ) : donations.filter(d => d.trackingStatus === 'SUBMITTED').length === 0 ? (
            <div className="py-20 text-center border border-dashed border-primary/10 bg-primary/5 rounded-3xl space-y-2">
              <Heart className="w-8 h-8 text-rose-400/40 mx-auto animate-float" />
              <h3 className="font-bold text-gray-700">No active donation posts</h3>
              <p className="text-xs text-gray-400">All posted resources have been claimed or delivered. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donations.filter(d => d.trackingStatus === 'SUBMITTED').map((d) => (
                <div key={d.id} className="bg-white border border-primary/5 rounded-3xl shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-xl font-extrabold uppercase">FREE</span>
                    <div className="flex items-center gap-0.5 text-xs text-primary font-bold">
                      <Leaf className="w-4.5 h-4.5" />
                      <span>+{d.impactCo2}kg CO₂</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-poppins font-bold text-sm text-gray-900 group-hover:text-primary transition-all line-clamp-1">{d.product.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{d.product.description}</p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 bg-eco-bg/50 p-2.5 rounded-xl">
                    <span>Donor: {d.donor.name}</span>
                    <span>Loc: {d.product.pickupLocationName || 'NIT Campus'}</span>
                  </div>

                  {user?.id !== d.donor.id && (
                    <button
                      onClick={() => handleClaim(d.id)}
                      disabled={submitting}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-500/10 hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5" /> Claim Free Resource
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - User tracking donation status */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="font-poppins font-bold text-sm text-gray-900">Your Donation Circular Cycles</h2>
          
          <div className="glass rounded-3xl p-6 border border-primary/10 shadow-lg space-y-4">
            <h3 className="font-poppins font-bold text-xs text-primary-dark border-b border-primary/5 pb-2">Tracking (Items Given/Received)</h3>
            
            {donations.filter(d => d.donor.id === user?.id || d.beneficiary?.id === user?.id).length === 0 ? (
              <div className="py-10 text-center text-[11px] text-gray-400">You are not participating in active donation tracking cycles.</div>
            ) : (
              <div className="space-y-4 divide-y divide-primary/5">
                {donations.filter(d => d.donor.id === user?.id || d.beneficiary?.id === user?.id).map((d) => {
                  const isDonor = d.donor.id === user?.id;
                  return (
                    <div key={d.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-800 truncate max-w-[150px]">{d.product.name}</span>
                        <span className="text-[10px] text-rose-500">{isDonor ? 'Donor' : 'Claimed'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-primary" /> {getStatusText(d.trackingStatus)}
                        </span>
                        <span>CO₂ Saved: {d.impactCo2}kg</span>
                      </div>

                      {isDonor && d.trackingStatus === 'MATCHED' && (
                        <button
                          onClick={() => handleCompleteDelivery(d.id)}
                          disabled={submitting}
                          className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-xl text-[10px] font-bold shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Mark Package Delivered
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
