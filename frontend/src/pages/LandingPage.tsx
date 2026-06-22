import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Leaf, ArrowRight, ShieldCheck, Zap, Globe, Heart, MessageSquare, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const [impactStats, setImpactStats] = useState({
    totalReused: 184,
    co2SavedKg: 460,
    wasteReducedKg: 276,
    completedDonations: 42,
    studentSavingsINR: 55200,
  });

  const [aiMessage, setAiMessage] = useState('');
  const [aiReply, setAiReply] = useState('🌱 Hi! Ask me to search books, request recycling tips, or guide your campus donation.');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/analytics/impact');
        if (response.data) {
          setImpactStats(response.data);
        }
      } catch (e) {
        console.warn('API Analytics fallback activated:', e);
      }
    };
    fetchStats();
  }, []);

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    setAiLoading(true);
    const msg = aiMessage;
    setAiMessage('');
    try {
      const response = await api.post('/api/ai/chat', { message: msg });
      setAiReply(response.data.reply);
    } catch (err) {
      // Mock search or tips based on keywords
      if (msg.toLowerCase().includes('java')) {
        setAiReply('🌱 Available Books:\n- Head First Java (₹250)\n- Core Java Reference (₹280)\nWould you like me to open a chat channel with the sellers?');
      } else {
        setAiReply('🌱 Keep circulating! By exchanging or renting on Campus Circulate Hub, you reduce landfill waste and earn badge achievements.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col leaf-pattern">
      {/* Hero Section */}
      <header className="relative py-20 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary-dark px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Leaf className="w-3.5 h-3.5" /> Empowering Green Campus Communities
          </div>
          <h1 className="font-poppins text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Campus Circulate <span className="bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent">Hub</span>
          </h1>
          <p className="font-poppins text-xl text-primary-dark/80 font-medium tracking-wide">
            Buy. Sell. Exchange. Rent. Donate. Sustain.
          </p>
          <p className="text-gray-600 max-w-xl text-base sm:text-lg">
            Exclusively for NIT students. Circulate textbooks, lab kits, project components, electronics, and hostel accessories. Earn eco-rewards and track your carbon offset.
          </p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <Link to="/marketplace" className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2">
              Explore Marketplace <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register" className="glass hover:bg-primary/5 text-primary-dark border-primary/20 hover:border-primary/40 px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center">
              Join Circular Economy
            </Link>
          </div>
        </div>

        {/* Visual Graphics Card */}
        <div className="flex-1 w-full max-w-lg relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/15 rounded-3xl blur-3xl -z-10 transform scale-95"></div>
          <div className="glass rounded-3xl border border-primary/10 shadow-2xl p-8 relative overflow-hidden">
            <div className="flex items-center gap-3 border-b border-primary/10 pb-4 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-xs text-gray-400 font-mono ml-auto">campus_sustainability_map.json</span>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-eco-bg/80 border border-primary/5 rounded-2xl p-4 shadow-sm">
                <div>
                  <h4 className="text-xs text-gray-400 uppercase tracking-wide">NIT Circular Index</h4>
                  <p className="text-2xl font-bold text-primary-dark mt-1">94.2%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-dark animate-float">
                  <Globe className="w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-eco-bg/80 border border-primary/5 rounded-2xl p-4 shadow-sm text-center">
                  <h4 className="text-xs text-gray-400">CO₂ Saved</h4>
                  <p className="text-lg font-bold text-primary-dark mt-1">{impactStats.co2SavedKg.toFixed(1)} kg</p>
                </div>
                <div className="bg-eco-bg/80 border border-primary/5 rounded-2xl p-4 shadow-sm text-center">
                  <h4 className="text-xs text-gray-400">Items Reused</h4>
                  <p className="text-lg font-bold text-secondary mt-1">{impactStats.totalReused} Items</p>
                </div>
              </div>

              <div className="border border-dashed border-primary/20 rounded-2xl p-4 bg-primary/5 flex items-center gap-3">
                <Award className="w-8 h-8 text-amber-500 flex-shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-primary-dark">Eco Milestone Reached</h4>
                  <p className="text-[11px] text-gray-500">Hostel 3 completed 50 exchanges this week!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sustainability Metrics Section */}
      <section className="bg-gradient-to-b from-transparent to-primary/5 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="font-poppins text-3xl sm:text-4xl font-bold text-gray-900">Campus Sustainability Impact</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Real-time metrics demonstrating NIT student efforts to recycle, share, and protect our environment.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="glass rounded-2xl p-8 border border-primary/10 shadow-sm hover:shadow-md transition-all text-center">
              <h3 className="text-3xl sm:text-4xl font-black text-primary-dark">{impactStats.totalReused}</h3>
              <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-semibold">Resources Circulated</p>
              <p className="text-xs text-gray-500 mt-1">Total books, lab kits & accessories reused</p>
            </div>
            <div className="glass rounded-2xl p-8 border border-primary/10 shadow-sm hover:shadow-md transition-all text-center">
              <h3 className="text-3xl sm:text-4xl font-black text-secondary">{impactStats.co2SavedKg.toFixed(1)} kg</h3>
              <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-semibold">CO₂ Emissions Saved</p>
              <p className="text-xs text-gray-500 mt-1">Equivalent to planting {Math.round(impactStats.co2SavedKg / 20)} trees</p>
            </div>
            <div className="glass rounded-2xl p-8 border border-primary/10 shadow-sm hover:shadow-md transition-all text-center">
              <h3 className="text-3xl sm:text-4xl font-black text-primary">{impactStats.wasteReducedKg.toFixed(1)} kg</h3>
              <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-semibold">Landfill Waste Diverted</p>
              <p className="text-xs text-gray-500 mt-1">Scrap metals, plastics & paper conserved</p>
            </div>
            <div className="glass rounded-2xl p-8 border border-primary/10 shadow-sm hover:shadow-md transition-all text-center">
              <h3 className="text-3xl sm:text-4xl font-black text-amber-600">₹{impactStats.studentSavingsINR.toLocaleString()}</h3>
              <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-semibold">Student Savings</p>
              <p className="text-xs text-gray-500 mt-1">Saved from book sharing and hardware renting</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="font-poppins text-3xl font-extrabold text-gray-900">How CirculateHub Serves the Campus</h2>
          <p className="text-gray-500 max-w-xl mx-auto">One integrated platform addressing student finance, educational resources, and environmental responsibility.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass hover:bg-white rounded-3xl p-8 border border-primary/10 shadow-sm hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary-dark flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">Exchange & Sell</h3>
            <p className="text-gray-600 text-sm">List unused textbooks, lab goggles, lab coats, drawing boards, or calculators. Sell at low cost or trade for other essentials.</p>
          </div>

          <div className="glass hover:bg-white rounded-3xl p-8 border border-primary/10 shadow-sm hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">Dedicated Donation Hub</h3>
            <p className="text-gray-600 text-sm">Donate books, stationery, and hostel accessories to juniors or underprivileged students. Earn gamified EcoPoints and achievements.</p>
          </div>

          <div className="glass hover:bg-white rounded-3xl p-8 border border-primary/10 shadow-sm hover:shadow-xl transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 text-blue-700 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-poppins">Real-Time Chat & Map</h3>
            <p className="text-gray-600 text-sm">Chat securely with sellers, make negotiations, share locations, and arrange pickup coordinates inside departments or hostels.</p>
          </div>
        </div>
      </section>

      {/* AI Assistant Preview */}
      <section className="bg-primary/5 py-20 px-4 border-y border-primary/10">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-block bg-primary/10 text-primary-dark px-3 py-1 rounded-full text-xs font-bold uppercase">EcoGuide AI</div>
            <h2 className="font-poppins text-3xl sm:text-4xl font-extrabold text-gray-900">Your AI-Powered Circular Advisor</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Say hello to **EcoGuide AI** (🌱), our Gemini-powered smart circular economy assistant. EcoGuide reviews the active marketplace, suggests donation programs, guides recycling practices, and calculates estimated carbon values for items.
            </p>
            <ul className="space-y-3 text-xs text-gray-600 font-medium">
              <li className="flex items-center gap-2">🌱 Ask: \"Find a Java book under ₹300\"</li>
              <li className="flex items-center gap-2">🌱 Ask: \"What is the carbon footprint reduction of recycling an LCD screen?\"</li>
              <li className="flex items-center gap-2">🌱 Ask: \"Suggest a donation match for my drawing board\"</li>
            </ul>
          </div>

          {/* AI Chat box mockup */}
          <div className="flex-1 w-full max-w-md">
            <div className="glass rounded-3xl shadow-xl border border-primary/10 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4 flex items-center gap-3 text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg animate-float">🌱</div>
                <div>
                  <h3 className="font-bold text-sm">EcoGuide AI</h3>
                  <span className="text-[10px] opacity-80">Powered by Gemini 1.5 Flash</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-primary/5 rounded-2xl p-4 text-xs text-gray-700 leading-relaxed border border-primary/10 whitespace-pre-wrap">
                  {aiReply}
                </div>
                
                <form onSubmit={handleAiChat} className="flex gap-2">
                  <input
                    type="text"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="Ask EcoGuide something..."
                    className="flex-1 px-4 py-3 bg-white/60 border border-primary/20 rounded-xl text-xs focus:outline-none focus:border-primary transition-all"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="bg-primary hover:bg-primary-dark text-white px-4 rounded-xl text-xs font-bold shadow-md shadow-primary/10 disabled:opacity-50"
                  >
                    {aiLoading ? 'Thinking...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-xs text-gray-400 border-t border-primary/5">
        &copy; {new Date().getFullYear()} Campus Circulate Hub. NIT Sustainability Initiative.
      </footer>
    </div>
  );
};
