import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Leaf, Bell, MessageSquare, LogOut, ShieldAlert, Award, MapPin } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationsAsRead } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadBellCount = notifications.filter(n => n.type !== 'NEW_MESSAGE' && !n.isRead).length;
  const unreadMessagesCount = notifications.filter(n => n.type === 'NEW_MESSAGE' && !n.isRead).length;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 w-full border-b border-primary/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 animate-float">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="font-poppins font-bold text-xl tracking-tight bg-gradient-to-r from-primary-dark via-primary to-secondary bg-clip-text text-transparent">
              CirculateHub
            </span>
          </Link>

          {/* Links */}
          {user ? (
            <div className="hidden md:flex space-x-1 items-center">
              <Link to="/marketplace" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/marketplace') ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}`}>
                Marketplace
              </Link>
              <Link to="/donations" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/donations') ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}`}>
                Donations
              </Link>
              <Link to="/map" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/map') ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}`}>
                Campus Map
              </Link>
              <Link to="/profile" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive('/profile') ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-600 hover:bg-primary/5 hover:text-primary'}`}>
                My Impact
              </Link>
              {user.role === 'ADMIN' && (
                <Link to="/admin" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${isActive('/admin') ? 'bg-amber-100 text-amber-800 font-semibold' : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'}`}>
                  <ShieldAlert className="w-4 h-4" /> Admin
                </Link>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-primary text-sm font-medium">
                Log In
              </Link>
              <Link to="/register" className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all">
                Get Started
              </Link>
            </div>
          )}

          {/* User Controls */}
          {user && (
            <div className="flex items-center gap-4">
              {/* Chat Button */}
              <Link to="/chat" className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all relative">
                <MessageSquare className="w-5 h-5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    const nextShow = !showNotifications;
                    setShowNotifications(nextShow);
                    if (nextShow) {
                      markNotificationsAsRead('ALL_NON_MESSAGES');
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadBellCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {unreadBellCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 glass rounded-2xl shadow-xl border border-primary/10 overflow-hidden z-50 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-primary/5 flex justify-between items-center bg-primary/5">
                      <span className="font-poppins font-bold text-sm text-primary-dark">Notifications</span>
                      {unreadBellCount > 0 && <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">{unreadBellCount} new</span>}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.filter(n => n.type !== 'NEW_MESSAGE').length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-gray-400">No notifications yet</div>
                      ) : (
                        notifications.filter(n => n.type !== 'NEW_MESSAGE').map((n, i) => (
                          <div key={i} className={`px-4 py-3 border-b border-primary/5 last:border-b-0 hover:bg-primary/5 transition-all text-xs ${!n.isRead ? 'bg-primary/5 font-medium' : ''}`}>
                            <p className="text-gray-700">{n.content}</p>
                            <span className="text-[9px] text-gray-400 block mt-1">
                              {new Date(n.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar Card */}
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-semibold text-gray-700">{user.name}</p>
                  <div className="flex items-center gap-1 justify-end text-[10px] text-primary font-bold">
                    <Award className="w-3 h-3" />
                    <span>{user.ecoPoints} EP</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
