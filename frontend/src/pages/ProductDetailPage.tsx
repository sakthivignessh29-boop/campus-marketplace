import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Product, Donation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Leaf, MessageSquare, MapPin, Award, User, ShoppingBag, CreditCard, QrCode, Coins, Lock, AlertCircle, CheckCircle2, X, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Setup standard marker icon from CDN to avoid relative-path assets breakage
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [donationRecord, setDonationRecord] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Scam Detection
  const [scamAnalysis, setScamAnalysis] = useState<{
    fraudulent: boolean;
    score: number;
    reason: string;
  } | null>(null);
  const [scamLoading, setScamLoading] = useState(false);

  // Razorpay Checkout Simulation for Dev Mode
  const [mockOrderInfo, setMockOrderInfo] = useState<any>(null);
  const [showMockSandbox, setShowMockSandbox] = useState(false);

  // Payment Board Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'UPI' | 'ECO_POINTS' | 'CASH'>('CARD');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setPaymentLoading(true);
    setPaymentError(null);

    // If card or upi, use Razorpay flow
    if (paymentMethod === 'CARD' || paymentMethod === 'UPI') {
      try {
        const orderRes = await api.post(`/api/transactions/razorpay/create-order/${product.id}`);
        const orderDetails = orderRes.data;

        // Try to load Razorpay SDK
        const rzpLoaded = await loadRazorpayScript();

        // If mock order, dummy key, or Razorpay script failed to load, use sandbox fallback
        if (
          !rzpLoaded ||
          !orderDetails.orderId ||
          orderDetails.orderId.startsWith('order_mock_') ||
          orderDetails.keyId === 'rzp_test_dummy_id' ||
          !(window as any).Razorpay
        ) {
          console.log("Mock Order or missing credentials detected. Using Sandbox fallback simulation.");
          setMockOrderInfo(orderDetails);
          setShowMockSandbox(true);
          setPaymentLoading(false);
          return;
        }

        // Real Razorpay integration flow
        const options = {
          key: orderDetails.keyId,
          amount: orderDetails.amount,
          currency: orderDetails.currency,
          name: 'CirculateHub',
          description: `Purchase ${product.name}`,
          order_id: orderDetails.orderId,
          handler: async function (response: any) {
            setPaymentLoading(true);
            try {
              await api.post('/api/transactions/razorpay/verify-payment', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                productId: product.id.toString(),
                paymentMethod: paymentMethod
              });
              setPaymentSuccess(true);
              await refreshUser();
              setProduct({
                ...product,
                status: 'REUSED'
              });
              setTimeout(() => {
                setShowPaymentModal(false);
                setPaymentSuccess(false);
              }, 2000);
            } catch (err: any) {
              setPaymentError(err.response?.data || 'Razorpay payment verification failed.');
            } finally {
              setPaymentLoading(false);
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#10b981',
          },
          modal: {
            ondismiss: function () {
              setPaymentLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

      } catch (err: any) {
        console.error(err);
        setPaymentError(err.response?.data || 'Failed to initialize Razorpay checkout.');
        setPaymentLoading(false);
      }
      return;
    }

    // Default peer-to-peer / ecoPoints fallback
    try {
      await api.post(`/api/transactions/purchase/${product.id}`, {
        paymentMethod
      });
      setPaymentSuccess(true);
      await refreshUser();
      
      // Update local product status to mark it as sold (REUSED)
      setProduct({
        ...product,
        status: 'REUSED'
      });
      
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.response?.data || 'Transaction failed. Please check balance or details.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!product || !mockOrderInfo) return;
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 9);
      const mockSignature = 'signature_mock_' + Math.random().toString(36).substring(2, 9);

      await api.post('/api/transactions/razorpay/verify-payment', {
        razorpayOrderId: mockOrderInfo.orderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: mockSignature,
        productId: product.id.toString(),
        paymentMethod: paymentMethod
      });

      setPaymentSuccess(true);
      await refreshUser();
      setProduct({
        ...product,
        status: 'REUSED'
      });
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        setShowMockSandbox(false);
        setMockOrderInfo(null);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.response?.data || 'Mock signature verification failed.');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    const loadProductDetails = async () => {
      try {
        const response = await api.get(`/api/products/${id}`);
        setProduct(response.data);

        // If it is a donation listing, check if there's an active tracking record
        if (response.data.type === 'DONATE') {
          const activeDonations = await api.get('/api/donations/active');
          const matched = activeDonations.data.find((d: Donation) => d.product.id === response.data.id);
          if (matched) {
            setDonationRecord(matched);
          }
        }
      } catch (err) {
        console.error('Failed to load listing details', err);
        setError('Listing not found or connection error');
      } finally {
        setLoading(false);
      }
    };

    const loadScamAnalysis = async () => {
      setScamLoading(true);
      try {
        const response = await api.get(`/api/products/ai-scam-detect/${id}`);
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        setScamAnalysis(data);
      } catch (err) {
        console.warn('AI Scam analysis failed:', err);
      } finally {
        setScamLoading(false);
      }
    };

    loadProductDetails();
    loadScamAnalysis();
  }, [id]);

  const handleContactSeller = async () => {
    if (!product || !user) return;
    setSubmitting(true);
    try {
      // Create initial contextual message
      await api.post('/api/chat/send', {
        receiverId: product.seller.id,
        content: `Hi ${product.seller.name}, I am interested in your listing: "${product.name}". Is it still available?`,
        productId: product.id
      });
      navigate('/chat');
    } catch (err) {
      console.error('Failed to initiate chat', err);
      setError('Could not connect with seller. Please try again!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDonation = async () => {
    if (!product || !user) return;
    setSubmitting(true);
    try {
      if (donationRecord) {
        // Match beneficiary
        const response = await api.post(`/api/donations/match/${donationRecord.id}`);
        setDonationRecord(response.data);
      } else {
        // If not matched, initiate donation record
        const initResponse = await api.post(`/api/donations/initiate/${product.id}`);
        const matchResponse = await api.post(`/api/donations/match/${initResponse.data.id}`);
        setDonationRecord(matchResponse.data);
      }
      setError(null);
    } catch (err: any) {
      console.error('Donation request failed', err);
      setError(err.response?.data || 'Failed to claim donation item.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-gray-400 font-medium">Loading details feed...</div>;
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h3 className="text-lg font-bold text-gray-700">{error || 'Listing not found'}</h3>
        <button onClick={() => navigate('/marketplace')} className="text-primary font-semibold hover:underline text-xs">
          Return to Marketplace
        </button>
      </div>
    );
  }

  // Set default coordinates SRM Easwari Engineering College center if item has none
  const lat = product.latitude || 13.0229;
  const lng = product.longitude || 80.1793;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Image Section */}
        <div className="lg:col-span-5 glass rounded-3xl border border-primary/10 overflow-hidden shadow-lg h-96 flex items-center justify-center bg-primary/5">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary/20 text-8xl">🌱</span>
          )}
        </div>

        {/* Right Info Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <span className="bg-primary/10 text-primary-dark font-bold text-xs uppercase px-3 py-1 rounded-xl">
                {product.category.name}
              </span>
              <span className="bg-gray-100 text-gray-800 font-bold text-xs uppercase px-3 py-1 rounded-xl">
                {product.type}
              </span>
            </div>
            <h1 className="font-poppins text-3xl font-extrabold text-gray-950 tracking-tight">{product.name}</h1>
            <p className="text-xs text-gray-400">Listed on {new Date(product.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="flex justify-between items-center bg-primary/5 border border-primary/10 p-5 rounded-3xl">
            <div>
              <span className="text-xs text-gray-400 font-medium">Exchange Cost</span>
              <p className="text-2xl font-black text-primary-dark mt-0.5">
                {product.type === 'DONATE' ? 'FREE' : `₹${product.price}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-medium">Sustainability Impact</span>
              <div className="flex items-center gap-1 mt-0.5 justify-end text-emerald-600 font-extrabold text-lg">
                <Leaf className="w-5 h-5 animate-float" />
                <span>+{product.sustainabilityScore.toFixed(0)} Points</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-poppins font-bold text-sm text-gray-900">Description</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Seller Metadata Card */}
          <div className="border border-primary/10 rounded-3xl p-5 flex justify-between items-center bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{product.seller.name}</p>
                <p className="text-[10px] text-gray-400">{product.seller.department} • Year {product.seller.year}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-xl text-[10px] font-bold border border-amber-100">
              <Award className="w-3.5 h-3.5" />
              <span>Score: {product.seller.sustainabilityScore.toFixed(1)}</span>
            </div>
          </div>

          {/* AI Safety and Trust Badge */}
          {scamLoading ? (
            <div className="p-4 bg-gray-50 border border-gray-150 rounded-3xl animate-pulse text-[11px] text-gray-400 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-primary" /> Running AI scam & safety assessment...
            </div>
          ) : scamAnalysis ? (
            <div className={`border p-4 rounded-3xl space-y-2 relative overflow-hidden transition-all ${
              scamAnalysis.fraudulent
                ? 'bg-rose-50/50 border-rose-200 text-rose-800'
                : 'bg-emerald-50/50 border-emerald-250 text-emerald-800'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent -z-10 rounded-bl-full"></div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-poppins font-bold text-xs uppercase tracking-wider">AI Trust & Safety Score</span>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  scamAnalysis.fraudulent ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {scamAnalysis.fraudulent ? 'Suspicious Listing' : 'Verified Secure'}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-bold font-mono text-base ${
                  scamAnalysis.fraudulent ? 'bg-rose-100 border-rose-200 text-rose-850' : 'bg-emerald-100 border-emerald-200 text-emerald-850'
                }`}>
                  {((1 - scamAnalysis.score) * 100).toFixed(0)}%
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-snug">
                    Trust Rating: {scamAnalysis.score > 0.6 ? 'Low Trust' : scamAnalysis.score > 0.3 ? 'Medium Trust' : 'High Trust'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 italic">"{scamAnalysis.reason}"</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Call to Actions */}
          {product.status === 'REUSED' ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-3xl text-center text-xs font-bold w-full">
              🎉 This item has been successfully re-routed and reused in the campus circular economy!
            </div>
          ) : user && user.id === product.seller.id ? (
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-3xl text-center text-xs text-gray-500 font-medium">
              You own this listing.
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleContactSeller}
                disabled={submitting}
                className="flex-1 bg-white hover:bg-gray-50 border border-primary/20 text-gray-700 py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4 text-primary" /> Contact Seller
              </button>

              {product.type === 'DONATE' ? (
                <button
                  onClick={handleRequestDonation}
                  disabled={submitting || !!(donationRecord && donationRecord.trackingStatus !== 'SUBMITTED')}
                  className="bg-secondary hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {donationRecord ? (donationRecord.beneficiary?.id === user?.id ? 'Claimed!' : 'Already Claimed') : 'Claim Item'}
                </button>
              ) : (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" /> Secure & Pay
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="font-poppins font-extrabold text-lg text-gray-900">Suggested Pickup Location</h2>
        </div>
        <p className="text-xs text-gray-400">Pickup coordinates: {product.pickupLocationName || 'Campus Center'}</p>
        
        <div className="h-80 w-full rounded-3xl overflow-hidden border border-primary/10 shadow-inner z-10 relative">
          <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={customIcon}>
              <Popup>
                <div className="text-xs font-semibold">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-gray-500 mt-1">{product.pickupLocationName || 'Campus Coordinate'}</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {/* Payment Board Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white/95 border border-primary/20 backdrop-blur-md rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden space-y-5">
            {/* Close button */}
            <button
              onClick={() => { if(!paymentLoading && !paymentSuccess) setShowPaymentModal(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={paymentLoading || paymentSuccess}
            >
              <X className="w-5 h-5" />
            </button>

            {showMockSandbox ? (
              <div className="text-center py-6 space-y-4 animate-fade-in">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-250 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-poppins font-black text-lg text-gray-900">Razorpay Dev Sandbox</h3>
                <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                  CirculateHub is in developer sandbox testing mode (no live Razorpay API key set).
                </p>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-800 text-left space-y-1">
                  <p><strong>Order ID:</strong> {mockOrderInfo?.orderId}</p>
                  <p><strong>Amount:</strong> ₹{(mockOrderInfo?.amount / 100).toFixed(2)}</p>
                  <p><strong>Key ID:</strong> {mockOrderInfo?.keyId}</p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSimulatePaymentSuccess}
                    disabled={paymentLoading}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {paymentLoading ? 'Simulating...' : 'Simulate Success Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowMockSandbox(false); setMockOrderInfo(null); }}
                    disabled={paymentLoading}
                    className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-[11px] transition-all"
                  >
                    Cancel Checkout
                  </button>
                </div>
              </div>
            ) : paymentSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-250 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-poppins font-black text-xl text-gray-900">Payment Secured!</h3>
                <p className="text-xs text-gray-500">
                  Successfully purchased <strong>{product.name}</strong>.
                </p>
                <p className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 inline-block px-3 py-1 rounded-full">
                  +15 EcoPoints Added to Wallet!
                </p>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-base text-gray-900">Campus Payment Board</h3>
                    <p className="text-[10px] text-gray-400">Secure Peer-to-Peer Campus Settlement</p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-primary/5 rounded-2xl p-3 flex justify-between items-center text-xs border border-primary/10">
                  <div>
                    <p className="font-bold text-gray-800 truncate max-w-[200px]">{product.name}</p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                      <Leaf className="w-3.5 h-3.5 animate-float" /> +{product.sustainabilityScore.toFixed(0)} EP Impact
                    </p>
                  </div>
                  <p className="font-black text-primary-dark text-base">₹{product.price}</p>
                </div>

                {paymentError && (
                  <div className="bg-red-50 text-red-700 border border-red-100 p-2.5 rounded-xl text-[10px] text-center flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Payment Methods Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-gray-150 p-1 rounded-xl text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 rounded-lg transition-all ${paymentMethod === 'CARD' ? 'bg-white text-primary-dark shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`py-2 rounded-lg transition-all ${paymentMethod === 'UPI' ? 'bg-white text-primary-dark shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ECO_POINTS')}
                    className={`py-2 rounded-lg transition-all ${paymentMethod === 'ECO_POINTS' ? 'bg-white text-primary-dark shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    EcoPoints
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 rounded-lg transition-all ${paymentMethod === 'CASH' ? 'bg-white text-primary-dark shadow-sm border border-gray-150' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Cash
                  </button>
                </div>

                {/* Dynamic Form fields */}
                {(paymentMethod === 'CARD' || paymentMethod === 'UPI') && (
                  <div className="space-y-4 pt-2 text-center animate-fade-in">
                    <div className="border border-primary/10 rounded-2xl p-4 bg-primary/5 space-y-2 flex flex-col items-center">
                      <CreditCard className="w-10 h-10 text-primary animate-pulse" />
                      <p className="text-xs font-bold text-gray-800">Razorpay Secure Checkout</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                        Pay securely using Credit/Debit Cards, UPI, Netbanking, or Wallets via Razorpay payment gateway.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'ECO_POINTS' && (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                      <Coins className="w-7 h-7 text-emerald-600 mx-auto animate-float" />
                      <p className="text-xs font-bold text-emerald-800 mt-1">Campus Eco Wallet</p>
                      <div className="flex justify-between items-center text-xs mt-3 bg-white px-3 py-2 rounded-xl border border-emerald-100/30">
                        <span className="text-gray-400">Your Wallet:</span>
                        <span className="font-bold text-emerald-700">{user?.ecoPoints || 0} EP</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1 bg-white px-3 py-2 rounded-xl border border-emerald-100/30">
                        <span className="text-gray-400">Required:</span>
                        <span className="font-bold text-primary-dark">{product.price} EP</span>
                      </div>
                    </div>
                    
                    {(user?.ecoPoints || 0) < product.price ? (
                      <p className="text-[10px] text-red-600 text-center font-bold">
                        ⚠️ Insufficient EcoPoints. You need {(product.price - (user?.ecoPoints || 0))} more EP. List/Donate resources to earn points!
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-600 text-center font-semibold">
                        ✅ You have enough points to complete this checkout!
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'CASH' && (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    <div className="border border-amber-100 bg-amber-50/30 rounded-2xl p-4 space-y-2 text-center">
                      <p className="text-xs font-bold text-amber-800">Meetup Cash Settlement</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        Pay the seller <strong>₹{product.price}</strong> in cash/UPI when you meet to exchange the item at <strong>{product.pickupLocationName || 'the campus center'}</strong>.
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium bg-white py-1.5 px-2 rounded-xl border border-amber-100/20">
                        Points will be credited to both accounts once meetup is successfully logged.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={paymentLoading || (paymentMethod === 'ECO_POINTS' && (user?.ecoPoints || 0) < product.price)}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white py-3 rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Securing transaction...
                    </span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Complete Secured Payment
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
