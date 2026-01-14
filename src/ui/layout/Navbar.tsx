
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, ChevronRight, Headphones, Bell } from 'lucide-react';
import { useLanguage } from '../../core/contexts/LanguageContext';
import { useAuth } from '../../modules/auth/AuthContext';
import { useClientData } from '../../modules/clients/context';
import { useTicket } from '../../modules/tickets/context';
import { motion as m, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';

const motion = m as any;

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { isAuthenticated, isAdmin, isClient, user } = useAuth();
  const { clients } = useClientData(); 
  const { notifications } = useTicket();
  
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get Live Balance for Client
  const liveClient = useMemo(() => {
      if (!isClient || !user) return null;
      return clients.find(c => c.id === user.id);
  }, [clients, user, isClient]);

  const balance = liveClient?.remainingTickets || 0;

  // Notification Count for Client
  const unreadCount = useMemo(() => {
      if (!isClient || !user) return 0;
      return notifications.filter(n => (n.client_id === user.id || n.clientId === user.id)).length;
  }, [notifications, user, isClient]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleRemoteSupportClick = () => {
      navigate('/client?action=remote_support');
  };

  const navLinks = [
    { name: t.nav.home, path: '/' },
    { name: t.nav.services, path: '/services' },
    { name: t.nav.pricing, path: '/pricing' },
    { name: t.nav.about, path: '/about' },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || isOpen
            ? 'bg-[#F5F5F7]/90 backdrop-blur-xl border-b border-gray-200/50 py-2 shadow-sm' 
            : 'bg-transparent border-transparent py-4 md:py-6'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
            
            <Link to="/" className="flex items-center gap-3 group z-50 relative shrink-0">
                <div className="h-12 md:h-16 w-auto transition-transform duration-300 hover:scale-105 translate-x-2">
                    <Logo className="h-full w-auto" />
                </div>
            </Link>

            <nav className="hidden md:flex items-center bg-white/60 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/50 shadow-sm mx-4">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        onMouseEnter={() => setHoveredPath(link.path)}
                        onMouseLeave={() => setHoveredPath(null)}
                        className={`relative px-5 py-2 text-[14px] font-bold transition-colors duration-200 ${
                            location.pathname === link.path ? 'text-brand-dark' : 'text-gray-500 hover:text-brand-dark'
                        }`}
                    >
                        {hoveredPath === link.path && (
                            <motion.div
                                layoutId="navbar-hover"
                                className="absolute inset-0 bg-white rounded-full shadow-sm z-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />
                        )}
                        <span className="relative z-10">{link.name}</span>
                    </Link>
                ))}
            </nav>

            <div className="hidden md:flex items-center gap-3 shrink-0">
                <button 
                    onClick={toggleLang}
                    className="text-xs font-bold text-gray-500 hover:text-brand-dark transition-colors px-3 py-1 rounded-md hover:bg-gray-200/50"
                >
                    {t.nav.switchLang}
                </button>

                {isAuthenticated ? (
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-300">
                         {/* Client Specific Actions */}
                         {isClient && (
                             <>
                                <button 
                                    onClick={() => navigate('/client', { state: { tab: 'notifications' } })}
                                    className="relative p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm border border-gray-100"
                                >
                                    <Bell size={18} className="text-gray-600"/>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <button 
                                    onClick={handleRemoteSupportClick}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95 ${balance > 0 ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20' : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-300'}`}
                                >
                                    <Headphones size={16} />
                                    <span>فتح تذكرة</span>
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{balance}</span>
                                </button>
                             </>
                         )}

                         <Link
                            to={isAdmin ? '/admin' : '/client'}
                            className="flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#0a1f3b] transition-all shadow-lg shadow-gray-400/20"
                         >
                            <User size={14} />
                            <span>{isAdmin ? 'Admin' : 'Client'}</span>
                        </Link>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="bg-brand-blue text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#0062c9] transition-all hover:scale-105 shadow-md shadow-blue-500/20"
                    >
                        {t.nav.login}
                    </Link>
                )}
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-full bg-gray-200/50 text-brand-dark z-50 hover:bg-gray-300/50 transition"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "100vh" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-40 bg-[#F5F5F7] pt-28 px-6 md:hidden overflow-hidden flex flex-col"
            >
                <div className="flex flex-col space-y-2">
                    {navLinks.map((link, i) => (
                        <motion.div
                          key={link.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between text-3xl font-bold text-brand-dark py-5 border-b border-gray-200 group"
                            >
                                {link.name}
                                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                            </Link>
                        </motion.div>
                    ))}
                    
                    {isClient && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <button
                                onClick={() => { setIsOpen(false); handleRemoteSupportClick(); }}
                                className="w-full flex items-center justify-between text-3xl font-bold text-red-600 py-5 border-b border-gray-200 group"
                            >
                                <span className="flex items-center gap-3">
                                    فتح تذكرة دعم
                                    <span className="bg-red-100 text-red-600 text-sm px-3 py-1 rounded-full">رصيد: {balance}</span>
                                </span>
                                <Headphones className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </motion.div>
                    )}

                    <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                    >
                        <Link
                            to="/contact"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center justify-between text-3xl font-bold text-brand-dark py-5 border-b border-gray-200 group"
                        >
                            {t.nav.contact}
                            <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                        </Link>
                    </motion.div>
                </div>

                <div className="mt-auto mb-10 space-y-4">
                     {!isAuthenticated && (
                        <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center bg-brand-blue text-white py-4 rounded-2xl text-lg font-bold shadow-xl">
                            {t.nav.login}
                        </Link>
                     )}
                     <button onClick={() => { toggleLang(); setIsOpen(false); }} className="block w-full text-center bg-white text-brand-dark py-4 rounded-2xl text-lg font-bold shadow-sm border border-gray-200">
                         {t.nav.switchLang}
                     </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
