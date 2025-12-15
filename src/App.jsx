import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Check, Camera, X, Sparkles, ExternalLink, 
  Menu, Shuffle, MessageCircleHeart, Timer, 
  Calendar, Plus, Lock, Unlock, Play, Pause,
  Ticket, LayoutGrid, List, Trash2, ChevronDown, ChevronUp, User, Star, Gift, HelpCircle,
  Bell, Shirt, Droplet, AlertTriangle, Upload, Send // <--- Tambahkan Send di sini
} from 'lucide-react';

// Import Firebase
import { db } from './firebase'; 
import { 
  collection, addDoc, onSnapshot, updateDoc, doc, 
  query, orderBy, writeBatch, setDoc
} from 'firebase/firestore';

// --- CSS INJECTION ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Quicksand:wght@300;400;500;600;700&display=swap');

  body { font-family: 'Quicksand', sans-serif; }
  h1, h2, h3, h4 { font-family: 'Playfair Display', serif; }

  .liquid-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: #fff0f3; overflow: hidden; }
  .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6; animation: float 10s infinite ease-in-out; }
  .blob-1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #ffc2d1; animation-delay: 0s; }
  .blob-2 { bottom: -10%; right: -10%; width: 600px; height: 600px; background: #ffe5ec; animation-delay: 2s; }
  .blob-3 { top: 40%; left: 40%; width: 400px; height: 400px; background: #fb6f92; opacity: 0.3; animation-delay: 4s; }

  @keyframes float { 0% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0, 0) scale(1); } }
  @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 10% { transform: translate(-1px, -2px) rotate(-1deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
  .animate-shake { animation: shake 0.5s; animation-iteration-count: infinite; }
  @keyframes intense-shake { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(-5px, 5px) rotate(5deg); } 50% { transform: translate(5px, -5px) rotate(-5deg); } 75% { transform: translate(-5px, -5px) rotate(5deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
  .animate-intense { animation: intense-shake 0.2s infinite; }
  @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
  .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 15s linear infinite; }
  
  /* Custom Color Picker Style */
  input[type="color"] { -webkit-appearance: none; border: none; width: 40px; height: 40px; border-radius: 50%; overflow: hidden; cursor: pointer; padding: 0; background: none; }
  input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  input[type="color"]::-webkit-color-swatch { border: none; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #ddd; }
  
  .firework { position: absolute; width: 4px; height: 4px; border-radius: 50%; box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8); animation: explode 2s infinite ease-out; opacity: 0; }
  @keyframes explode { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(30); opacity: 0; } }
`;

// --- DATA AWAL (SEED) ---


const initialQuestions = [
  "Apa memori masa kecil yang paling membentukmu jadi seperti sekarang?",
  "Apa satu hal yang ingin kamu ubah dari hubungan kita?",
  "Kalau kita menua bersama, hal apa yang paling kamu takutkan?",
  "Kapan terakhir kali kamu merasa sangat dicintai olehku?",
  "Apa impian terbesarmu yang belum pernah kamu ceritakan ke siapapun?",
  "Apa lagu yang kalau kamu denger, langsung inget aku?"
];

const initialVouchers = [
  { title: "Pijat Pundak 15 Menit", used: false },
  { title: "Menang Debat (No Protes)", used: false },
  { title: "Request Makanan Bebas", used: false },
];

const features = [
  { id: 'journey', icon: Calendar, label: 'Jurnal Petualangan' },
  { id: 'timer', icon: Timer, label: 'Relationship Timer' },
  { id: 'deeptalk', icon: MessageCircleHeart, label: 'Deep Talk Deck' },
  { id: 'capsule', icon: Lock, label: 'Time Capsule' },
  { id: 'tickets', icon: Ticket, label: 'Love Redeem' },
  { id: 'outfit', icon: Shirt, label: 'Outfit Matcher' }, 
  { id: 'pms', icon: Droplet, label: 'PMS Warning System' }, 
];

// --- COMPONENTS ---

// 1. Navigation Drawer (FIX: Sticky Note kembali ke Local Storage)
const NavDrawer = ({ isOpen, onClose, activeTab, setActiveTab, stickyNote, setStickyNote, progress, triggerAnnoyance }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false); 
  
  // Audio Ref
  const audioRef = useRef(new Audio('music-jazz.MP3')); 

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) { 
      audioRef.current.pause(); 
    } else { 
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => { audioRef.current.loop = true; }).catch(e => console.log(e));
      }
    }
    setIsPlaying(!isPlaying);
  };

  const currentFeatureLabel = features.find(f => f.id === activeTab)?.label || "Menu Fitur";

  return (
    <>
      <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed inset-y-0 left-0 w-80 bg-white/90 backdrop-blur-2xl shadow-2xl z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-r border-white/50 overflow-hidden flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <div className="p-6 flex flex-col h-full overflow-y-auto hide-scrollbar">
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200"><Heart fill="currentColor" size={20} /></div>
                  <div><h2 className="font-serif font-bold text-rose-950 text-xl leading-none">M & T</h2><span className="text-[10px] text-rose-500 uppercase tracking-[0.2em]">Journey</span></div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-rose-50 rounded-full text-gray-400 transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-6 flex-1 relative">
               <button onClick={triggerAnnoyance} className="w-full bg-red-100 text-red-600 font-bold py-3 rounded-2xl border border-red-200 flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"><Bell size={18} className="animate-wiggle" /> I MISS YOU NOW! 🚨</button>
               <div>
                  <div className="flex justify-between text-xs font-bold text-rose-900 mb-2 uppercase tracking-widest"><span>Love Meter</span><span>{progress}%</span></div>
                  <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden shadow-inner"><div className="bg-gradient-to-r from-rose-300 to-pink-500 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}><div className="absolute inset-0 bg-white/30 animate-pulse"></div></div></div>
               </div>
               <div className="bg-gradient-to-br from-rose-900 to-rose-800 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden group">
                  <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-12 h-12 rounded-full bg-black border-4 border-gray-800 flex items-center justify-center shadow-lg ${isPlaying ? 'animate-spin-slow' : ''}`}><div className="w-4 h-4 bg-rose-500 rounded-full border-2 border-white"></div></div>
                      <div className="flex-1 overflow-hidden"><p className="text-sm font-bold truncate">Jaz - Bersamamu</p><p className="text-xs text-rose-300 truncate font-light">{isPlaying ? 'Playing...' : 'Paused'}</p></div>
                      <button onClick={toggleMusic} className="w-10 h-10 bg-white text-rose-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md">{isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor" className="ml-0.5"/>}</button>
                  </div>
               </div>
               
               {/* STICKY NOTE LAMA (LOCAL STORAGE MODE) */}
               <div className="bg-[#fff9c4] p-5 rounded-2xl shadow-sm relative transform rotate-1 hover:rotate-0 transition-transform duration-300 border border-[#fff59d]">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold text-yellow-800 uppercase flex items-center gap-2"><Sparkles size={12}/> Catatanmu!</h4>
                  </div>
                  <textarea 
                    value={stickyNote} 
                    onChange={setStickyNote} // Langsung panggil setter dari App()
                    className="w-full bg-transparent text-sm text-gray-700 font-medium resize-none focus:outline-none leading-relaxed" 
                    rows="3" 
                    placeholder="Tulis pesan manis..." 
                    style={{ fontFamily: 'cursive' }} 
                  />
                  <p className="text-[10px] text-yellow-700/60 text-right mt-1">*Disimpan di HP ini saja</p>
               </div>
            </div>
            <div className="mt-6 border-t border-rose-100 pt-4 relative">
               <div className={`absolute bottom-full left-0 w-full mb-2 z-20 transition-all duration-300 ease-cubic ${isNavOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
                  <nav className="space-y-1 bg-white/95 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-rose-100 max-h-60 overflow-y-auto">
                     {features.map((item) => (
                       <button key={item.id} onClick={() => { setActiveTab(item.id); setIsNavOpen(false); onClose(); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-sm ${activeTab === item.id ? 'bg-rose-50 text-rose-600 font-bold shadow-sm' : 'text-gray-600 hover:bg-rose-50'}`}>
                         <item.icon size={18} /><span>{item.label}</span>
                       </button>
                     ))}
                  </nav>
               </div>
               <button onClick={() => setIsNavOpen(!isNavOpen)} className="w-full flex items-center justify-between p-4 bg-rose-600 text-white rounded-2xl shadow-lg hover:shadow-rose-200 transition-all font-bold relative z-30">
                 <span className="flex items-center gap-2"><Menu size={18}/> {currentFeatureLabel}</span>{isNavOpen ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}
               </button>
            </div>
         </div>
      </div>
    </>
  );
};

const HelpModal = ({ isOpen, onClose, activeTab }) => {
  if (!isOpen) return null;
  const content = {
    journey: { title: "Jurnal Petualangan Kita", text: "Welcome to our gallery date yaw, ahahha. Di sini gudangnya rencana date kita. Kalau udah terlaksana, jangan lupa klik tombol kamera buat simpan bukti kenangan. Kalau bingung mau ke mana, klik tombol acak aja biar takdir yang milihin. Cek hitung mundur kalau udah janjian!. Ada grid mode instragram juga sama ada mode timelien buat liat date yg udh kita capaii" },
    timer: { title: "Waktu Bersama", text: "Ini bukti seberapa lama kamu betah sama aku, asekk. Hitungan ini jalan terus sejak 17 Oktober 2025. Semoga angkanya nambah terus sampai kita jadi kakek nenek ya!" },
    deeptalk: { title: "Bicara Dari Hati", text: "Kocok kartunya, jawab jujur, dan jangan ada dusta diantara kita. Awas jangan baper duluan!" },
    capsule: { title: "Pesan Masa Depan", text: "Tulis surat di sini, terus kunci. Kita buka bareng-bareng nanti pas tanggalnya tiba. Inget, gak boleh diintip kuncinya!" },
    tickets: { title: "Hadiah Cintaku", text: "Tiap 3 date selesai, kamu dapet 1 Tiket Qpon, ehh engga deh tapi tiket ini bisa ditukerin sama voucher yg ga kalah menarikk" },
    outfit: { title: "Cocoklogi Baju", text: "Bingung mau pake baju warna apa? Pilih warna di sini pakai color picker yang bulet itu biar kita match! Tulis juga jenisnya (kemeja/gamis) biar makin jelas. Kalau udah sepakat, klik kunci ya." },
    pms: { title: "Sistem Peringatan Dini", text: "Fitur penyelamat nyawa! Set tanggal mulai dan akhir haid kamu di sini. Nanti kalender bakal merah dan ada running text di atas kalau masuk zona bahaya, biar aku siap mentall." }
  };
  const currentHelp = content[activeTab] || content['journey'];
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-rose-100 relative animate-zoom-in">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-rose-50 rounded-full text-rose-300 hover:bg-rose-100 transition-colors"><X size={20} /></button>
          <div className="text-center">
             <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 animate-bounce-slow"><HelpCircle size={32} /></div>
             <h3 className="text-xl font-serif font-bold text-rose-900 mb-2">Yuk Coba Baca Ini ❤️</h3>
             <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4">{currentHelp.title}</h4>
             <p className="text-sm text-gray-600 leading-relaxed font-medium italic">"{currentHelp.text}"</p>
             <button onClick={onClose} className="mt-8 px-8 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg hover:bg-rose-600 transition-transform hover:scale-105">Okayy</button>
          </div>
       </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  useEffect(() => { const styleSheet = document.createElement("style"); styleSheet.innerText = styles; document.head.appendChild(styleSheet); return () => document.head.removeChild(styleSheet); }, []);

  const [activeTab, setActiveTab] = useState('journey');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [annoyanceActive, setAnnoyanceActive] = useState(false);
  
  // Data States
  const [dates, setDates] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [appState, setAppState] = useState({}); 
  
  // Local States with Safe Defaults
  const [outfit, setOutfit] = useState(() => { 
      const s = localStorage.getItem('mt-outfit-v5'); 
      const parsed = s ? JSON.parse(s) : {};
      return { 
          miftah: { top: '#FFFFFF', bot: '#000000', topText: '', botText: '', ...parsed.miftah }, 
          tanzil: { top: '#FFFFFF', bot: '#000000', topText: '', botText: '', ...parsed.tanzil }, 
          locked: parsed.locked || false 
      }; 
  });
  const [pmsData, setPmsData] = useState(() => { const s = localStorage.getItem('mt-pms-v3'); return s ? JSON.parse(s) : { startDate: '', endDate: '' }; });
  const [stickyNote, setStickyNoteState] = useState(() => { const s = localStorage.getItem('mt-sticky'); return s || "Semangat sayang!"; });

  // UI States
  const [viewMode, setViewMode] = useState('grid');
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [gachaMode, setGachaMode] = useState(null);
  const [gachaResult, setGachaResult] = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [targetDateInput, setTargetDateInput] = useState('');
  const [targetTimeInput, setTargetTimeInput] = useState('');
  const [activeLinkModal, setActiveLinkModal] = useState(null);
  const [linkInput, setLinkInput] = useState('');
  const [voucherModal, setVoucherModal] = useState({ show: false, voucherTitle: '' });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [timerText, setTimerText] = useState({years:0, months:0, days:0, hours:0, minutes:0, seconds:0});
  const [activeDatePlan, setActiveDatePlan] = useState(() => { const s = localStorage.getItem('mt-plan-v6'); return s ? JSON.parse(s) : null; });
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  // Capsule State (Sekarang dikontrol Firebase)
  const [capsuleEmip, setCapsuleEmip] = useState({ id: 'emip', msg: '', date: '', isLocked: false });
  const [capsuleAzil, setCapsuleAzil] = useState({ id: 'azil', msg: '', date: '', isLocked: false });
  // const [capsuleEmip, setCapsuleEmip] = useState(() => { const s = localStorage.getItem('capsule-emip'); return s ? JSON.parse(s) : { msg: '', date: '', isLocked: false }; });
  // const [capsuleAzil, setCapsuleAzil] = useState(() => { const s = localStorage.getItem('capsule-azil'); return s ? JSON.parse(s) : { msg: '', date: '', isLocked: false }; });

  
  // SYNC LOCALSTORAGE
  useEffect(() => {
     localStorage.setItem('mt-outfit-v5', JSON.stringify(outfit));
     localStorage.setItem('mt-pms-v3', JSON.stringify(pmsData));
     localStorage.setItem('mt-sticky', stickyNote);
     localStorage.setItem('mt-plan-v6', JSON.stringify(activeDatePlan));
     //localStorage.setItem('capsule-emip', JSON.stringify(capsuleEmip));
     //localStorage.setItem('capsule-azil', JSON.stringify(capsuleAzil));
  }, [outfit, pmsData, stickyNote, activeDatePlan, capsuleEmip, capsuleAzil]);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    // 1. Sync Dates
    const qDates = query(collection(db, "dates"), orderBy("title")); 
    const unsubDates = onSnapshot(qDates, (snapshot) => {
        if(snapshot.empty) {
            const batch = writeBatch(db);
            initialDateIdeas.forEach(d => batch.set(doc(collection(db, "dates")), d));
            batch.commit();
        } else {
            setDates(snapshot.docs.map(d => ({...d.data(), id: d.id})));
        }
    });

      // 2. Sync Questions
    const unsubQuestions = onSnapshot(collection(db, "questions"), (snapshot) => {
        if(snapshot.empty) {
            const batch = writeBatch(db);
            initialQuestions.forEach(q => batch.set(doc(collection(db, "questions")), { text: q }));
            batch.commit();
        } else {
            setQuestions(snapshot.docs.map(d => d.data().text));
        }
    });

    // 3. Sync Vouchers
    const unsubVouchers = onSnapshot(collection(db, "vouchers"), (snapshot) => {
        if(snapshot.empty) {
            const batch = writeBatch(db);
            initialVouchers.forEach(v => batch.set(doc(collection(db, "vouchers")), v));
            batch.commit();
        } else {
            setVouchers(snapshot.docs.map(d => ({...d.data(), id: d.id})));
        }
    });

    // 4. Sync Global App State
    // 4. Sync Global App State
    // 4. Sync Global App State
    // 4. Sync Global App State (PMS FIX INCLUDED)
    const unsubAppState = onSnapshot(doc(db, "global", "state"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setAppState(data);
            
            // FIX OUTFIT: Langsung set state lokal OUTFIT
            if (data.outfit) setOutfit(data.outfit);

            // <<< PERBAIKAN UNTUK PMS SYSTEM >>>
            // Saat data global di Firebase berubah, set state pmsData lokal 
            // di kedua HP secara real-time.
            if (data.pms) setPmsData(data.pms); 
            // ------------------------------------
            
            if (data.annoyanceTriggered) {
                setAnnoyanceActive(true);
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([500, 200, 500]);
                setTimeout(() => {
                    setAnnoyanceActive(false);
                    updateDoc(doc(db, "global", "state"), { annoyanceTriggered: false }); 
                }, 1500); 
            }
        } else {
             // Inisialisasi dokumen jika belum ada di Firebase
             setDoc(doc(db, "global", "state"), { 
                 annoyanceTriggered: false,
                 outfit: outfit, 
                 pms: pmsData // Menggunakan state PMS lokal sebagai default saat inisialisasi
             }, { merge: true }); 
        }
    });

    // 5. Sync Time Capsule (NEW: Menggunakan Firebase)
    const unsubCapsuleEmip = onSnapshot(doc(db, "capsules", "emip"), (docSnap) => {
        if (docSnap.exists()) setCapsuleEmip({ id: docSnap.id, ...docSnap.data() });
    });
    const unsubCapsuleAzil = onSnapshot(doc(db, "capsules", "azil"), (docSnap) => {
        if (docSnap.exists()) setCapsuleAzil({ id: docSnap.id, ...docSnap.data() });
    });

    // Inisialisasi data (Jika belum ada di Firebase)
    setDoc(doc(db, "capsules", "emip"), { msg: '', date: '', isLocked: false }, { merge: true });
    setDoc(doc(db, "capsules", "azil"), { msg: '', date: '', isLocked: false }, { merge: true });

    return () => { 
        unsubDates(); unsubQuestions(); unsubVouchers(); unsubAppState(); 
        unsubCapsuleEmip(); unsubCapsuleAzil(); // Tambahkan cleanup ini
    };

    return () => { unsubDates(); unsubQuestions(); unsubVouchers(); unsubAppState(); };
  }, []);

  // --- LOGIC FUNCTIONS (FIXED) ---

  const updateFirebaseState = async (field, value) => {
      try { await updateDoc(doc(db, "global", "state"), { [field]: value }); } catch (e) { console.log(e); }
  };

  const handleOutfitChange = (newOutfit) => {
      // 1. Update state lokal untuk responsivitas (pilihan warna/teks)
      setOutfit(newOutfit);
      
      // 2. Update Firebase
      updateFirebaseState('outfit', newOutfit);
  };

  const handlePmsChange = (newPms) => {
      setPmsData(newPms);
      updateFirebaseState('pms', newPms);
  };

  const handleStickyChange = (e) => {
      // Langsung simpan di state lokal (tidak perlu tombol kirim)
      setStickyNoteState(e.target.value); 
      localStorage.setItem('mt-sticky', e.target.value); // Simpan ke LocalStorage
  };

  const updateCapsule = async (target, data) => {
      // Data target harus 'emip' atau 'azil'
      await setDoc(doc(db, "capsules", target), data, { merge: true });
  };

  const triggerAnnoyance = async () => { await updateFirebaseState('annoyanceTriggered', true); };

  // Timer Logic
  useEffect(() => {
      const startDate = new Date('2025-10-17T00:00:00');
      const interval = setInterval(() => {
          const now = new Date(); const diff = Math.abs(now - startDate);
          setTimerText({
              years: Math.floor(diff / (1000 * 60 * 60 * 24 * 365)),
              months: Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)),
              days: Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
              hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((diff % (1000 * 60)) / 1000)
          });
      }, 1000);
      return () => clearInterval(interval);
  }, []);

  // PMS LOGIC (SAFETY CHECK ADDED)
  const getPMSStatus = () => {
    if (!pmsData.startDate || !pmsData.endDate) return { status: 'safe', text: 'Jadwal belum diset.' };
    
    const start = new Date(pmsData.startDate);
    const end = new Date(pmsData.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return { status: 'safe', text: 'Tanggal tidak valid.' };

    const today = new Date();
    today.setHours(0,0,0,0); start.setHours(0,0,0,0); end.setHours(0,0,0,0);

    if (today >= start && today <= end) return { status: 'danger', text: 'Danger Zone! 🚨 Kencangkan sabuk pengaman!' };
    
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 0 && diffDays <= 3) return { status: 'warning', text: `Siaga 1: ${diffDays} hari lagi menuju Danger Zone!` };
    
    return { status: 'safe', text: 'Zona Aman. Silakan bernafas lega.' };
  };
  const pmsStatus = getPMSStatus();

  const renderCalendar = () => {
      const today = new Date();
      const year = today.getFullYear(); const month = today.getMonth();
      const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

      const start = pmsData.startDate ? new Date(pmsData.startDate) : null; 
      const end = pmsData.endDate ? new Date(pmsData.endDate) : null;
      if(start && !isNaN(start.getTime())) start.setHours(0,0,0,0); 
      if(end && !isNaN(end.getTime())) end.setHours(0,0,0,0);

      return (
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
              {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => <div key={d} className="font-bold text-gray-400 text-xs">{d}</div>)}
              {days.map((d, i) => {
                  if (!d) return <div key={i}></div>;
                  let isHighlight = false; 
                  if (start && end && !isNaN(start) && !isNaN(end) && d >= start && d <= end) isHighlight = true;
                  return <div key={i} className={`p-2 rounded-full ${isHighlight ? 'bg-red-500 text-white font-bold shadow-md' : 'text-gray-700'}`}>{d.getDate()}</div>
              })}
          </div>
      )
  };

  // Date Logic
  const handleStartGacha = () => {
    setGachaMode('spin');
    const available = dates.filter(d => !d.isDone);
    if (available.length === 0) return alert("Semua date sudah selesai!");
    let count = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * available.length);
      setGachaResult(available[randomIdx]);
      count++;
      if (count > 20) { clearInterval(interval); setTimeout(() => setShowCongrats(true), 500); }
    }, 100);
  };
  const handleManualPickClick = () => { setShowManualSelection(true); };
  const confirmManualPick = (d) => { setGachaResult(d); setGachaMode('manual'); setShowManualSelection(false); setShowCongrats(true); };
  
  const confirmDatePlan = async () => {
    if (!targetDateInput || !targetTimeInput) return alert("Isi waktu dulu ya!");
    const plan = { dateId: gachaResult.id, targetTime: new Date(`${targetDateInput}T${targetTimeInput}`).toISOString(), title: gachaResult.title, image: gachaResult.image };
    setActiveDatePlan(plan);
    updateFirebaseState('activePlan', plan);
    setShowCongrats(false); setShowGachaModal(false); setGachaResult(null);
  };

  const handleMarkDone = async (link) => {
      const dateRef = doc(db, "dates", activeLinkModal.id);
      if (activeLinkModal.type === 'repeatable') {
          const newLinks = [...(activeLinkModal.links || []), link];
          await updateDoc(dateRef, { isDone: true, count: (activeLinkModal.count||0)+1, links: newLinks });
      } else {
          await updateDoc(dateRef, { isDone: true, link: link, submittedAt: new Date().toISOString() });
      }
      setActiveLinkModal(null); setLinkInput('');
  };

  const handleAddNewDate = async () => {
      const title = prompt("Judul Kencan:"); if(!title) return;
      const desc = prompt("Deskripsi:"); const img = prompt("URL Gambar:", "https://source.unsplash.com/random/600x600/?love");
      await addDoc(collection(db, "dates"), { title, description: desc, image: img, isDone: false, type: 'standard' });
  };

  const getSortedDates = () => viewMode === 'grid' ? dates : [...dates].sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? -1 : 1));

  // DEEP TALK LOGIC
  const handleNextQuestion = () => {
     setIsFlipped(false); 
     setTimeout(() => { setIsShuffling(true); }, 300);
     setTimeout(() => { setCurrentQIndex((prev) => (prev + 1) % questions.length); setIsShuffling(false); setIsFlipped(true); }, 1500);
  };
  const handleAddQuestion = async () => { const q = prompt("Pertanyaan baru:"); if(q) await addDoc(collection(db, "questions"), { text: q }); };
  const handleDeleteQuestion = async () => { /* Logic delete simplified */ };

  const completedCount = dates.reduce((acc, curr) => (curr.type === 'repeatable' ? acc + (curr.count || 0) : acc + (curr.isDone ? 1 : 0)), 0);
  const ticketsEarned = Math.floor(completedCount / 3);
  const progress = Math.round((completedCount / (dates.length || 1)) * 100);
  const handleRedeem = (title) => setVoucherModal({ show: true, voucherTitle: title });

  // Countdown
  const CountdownHeader = ({ plan }) => {
     const calculateTimeLeft = () => {
        const now = new Date(); const target = new Date(plan.targetTime); const diff = target - now;
        if (diff <= 0) return "WAKTUNYA TIBA! ❤️";
        const d = Math.floor(diff / (1000 * 60 * 60 * 24)); const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${d} Hari ${h} Jam ${m} Menit`;
     };
     const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
     useEffect(() => { const interval = setInterval(() => { setTimeLeft(calculateTimeLeft()); }, 1000); return () => clearInterval(interval); }, [plan]);
     return (
        <div className="mb-8 p-8 bg-gradient-to-r from-rose-400 to-pink-400 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden animate-in slide-in-from-top duration-700">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6"><img src={plan.image} className="w-20 h-20 rounded-2xl border-4 border-white/30 object-cover shadow-lg" /><div className="text-center md:text-left"><span className="text-[10px] bg-white/20 px-3 py-1 rounded-full text-white font-bold uppercase tracking-widest mb-2 inline-block">Next Adventure</span><h2 className="text-3xl font-serif font-bold text-white drop-shadow-md">{plan.title}</h2><p className="text-sm opacity-90 font-light mt-1">{new Date(plan.targetTime).toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long'})}</p></div></div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl text-center min-w-[200px] border border-white/10 flex flex-col justify-center items-center"><span className="block text-xl font-mono font-bold">{timeLeft}</span><span className="text-[10px] opacity-75 uppercase tracking-widest mt-1">Menuju Hari H</span></div>
            </div>
        </div>
     );
  };

  return (
    <div className={`min-h-screen text-gray-700 selection:bg-rose-200 overflow-x-hidden relative flex flex-col ${annoyanceActive ? 'animate-intense' : ''}`}>
      
      {annoyanceActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
           <div className="bg-red-500 text-white p-8 rounded-full shadow-2xl animate-bounce text-4xl font-black border-8 border-white transform rotate-12">KANGEN WOY!! 😭</div>
           <div className="absolute top-10 left-10 text-6xl animate-pulse">😿</div><div className="absolute bottom-20 right-10 text-6xl animate-pulse">😿</div>
        </div>
      )}

      {activeTab === 'pms' && pmsStatus.status !== 'safe' && (
        <div className={`w-full py-3 overflow-hidden ${pmsStatus.status === 'danger' ? 'bg-red-500' : 'bg-orange-400'}`}>
           <div className="animate-marquee whitespace-nowrap text-white font-bold flex items-center gap-4">
              <AlertTriangle size={18} fill="white"/> {pmsStatus.text} <AlertTriangle size={18} fill="white"/> {pmsStatus.text} <AlertTriangle size={18} fill="white"/> {pmsStatus.text}
           </div>
        </div>
      )}

      <div className="liquid-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div></div>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-[60px] z-[-1]"></div>

      <div className="fixed top-0 left-0 right-0 z-30 p-4 md:p-6 flex justify-between items-center pointer-events-none">
          <button onClick={() => setIsMenuOpen(true)} className="pointer-events-auto bg-white/70 backdrop-blur-md p-3 rounded-full shadow-lg text-rose-600 hover:scale-110 transition-transform duration-300 border border-white"><Menu size={24} /></button>
          <button onClick={() => setShowHelpModal(true)} className="pointer-events-auto bg-white/70 backdrop-blur-md p-3 rounded-full shadow-lg text-rose-500 hover:scale-110 transition-transform duration-300 border border-white"><HelpCircle size={24} /></button>
      </div>

      <NavDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab} stickyNote={stickyNote} setStickyNote={handleStickyChange} progress={progress} triggerAnnoyance={triggerAnnoyance} />
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} activeTab={activeTab} />
      
      <div className="max-w-[1400px] mx-auto p-6 pt-24 pb-32 flex-1 w-full">
        {activeTab === 'journey' && (
           <div className="animate-fade-in">
              <header className="mb-12 text-center">
                 <h3 className="text-sm font-sans tracking-[0.2em] uppercase text-rose-800/70 mb-2">Our Gallery Bucket List</h3>
                 <h1 className="text-4xl md:text-6xl font-serif font-bold text-rose-950 mb-3 drop-shadow-sm">Wishlist Checklist</h1>
                 <h2 className="text-lg md:text-xl font-serif italic text-rose-700">Miftah & Tanzil Journey</h2>
                 <div className="mt-6 flex justify-center gap-2">
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-gray-400 hover:bg-rose-50'}`}><LayoutGrid size={20}/></button>
                    <button onClick={() => setViewMode('timeline')} className={`p-2.5 rounded-2xl transition-all ${viewMode === 'timeline' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-gray-400 hover:bg-rose-50'}`}><List size={20}/></button>
                 </div>
              </header>
              {appState.activePlan && <CountdownHeader plan={appState.activePlan} />}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                 <button onClick={() => setShowGachaModal(true)} className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-8 py-4 rounded-[2rem] font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"><Shuffle size={18}/> Pilihkan Untuk Kita</button>
                 <button onClick={handleAddNewDate} className="flex items-center justify-center gap-2 bg-white text-rose-600 border border-white px-8 py-4 rounded-[2rem] font-bold shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"><Plus size={18}/> Ide Baru</button>
              </div>
              {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                     {dates.map(date => (
                        <div key={date.id} className="group bg-white/40 backdrop-blur-md rounded-[2rem] p-3 shadow-sm hover:shadow-2xl transition-all border border-white/50 flex flex-col aspect-square relative overflow-hidden">
                           <div className="absolute inset-0 z-0"><img src={date.image} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${date.isDone ? 'grayscale-[50%]' : ''}`} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div></div>
                           {date.isDone && <div className="absolute top-3 right-3 z-10 bg-white/20 backdrop-blur-md border border-white/50 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">Selesai</div>}
                           <div className="relative z-10 mt-auto p-3 text-white">
                               <h3 className="text-sm md:text-base font-serif font-bold leading-tight mb-1 text-shadow-sm">{date.title}</h3>
                               <p className="text-[10px] md:text-xs font-light opacity-90 line-clamp-2 mb-3">{date.description}</p>
                               <div className="grid grid-cols-2 gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                   <button onClick={() => setActiveLinkModal(date)} className="bg-white text-rose-900 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-md hover:bg-rose-50">{date.isDone ? <Check size={12}/> : <Camera size={12}/>} {date.isDone ? 'Update' : 'Tandai'}</button>
                                   {date.isDone && (
                                       <div className="relative group/link">
                                         {date.type === 'repeatable' ? (
                                             <button className="w-full h-full bg-rose-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-md"><List size={12}/> {date.count} Links</button>
                                         ) : (<a href={date.link} target="_blank" className="w-full h-full bg-rose-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-md hover:bg-rose-600"><ExternalLink size={12}/> Lihat</a>)}
                                       </div>
                                   )}
                               </div>
                               {date.isDone && date.type === 'repeatable' && (
                                   <div className="absolute bottom-12 right-0 left-0 bg-white/90 backdrop-blur-md p-2 rounded-xl text-gray-800 max-h-24 overflow-y-auto hidden group-hover:block animate-in fade-in slide-in-from-bottom-2">
                                      <p className="text-[10px] font-bold mb-1 text-rose-500 text-center">Kenangan Tersimpan:</p>
                                      <div className="flex flex-wrap gap-1 justify-center">{date.links && date.links.map((lnk, i) => (<a key={i} href={lnk} target="_blank" className="bg-rose-100 text-rose-600 px-2 py-1 rounded text-[10px] hover:bg-rose-200">#{i+1}</a>))}</div>
                                   </div>
                               )}
                           </div>
                        </div>
                     ))}
                  </div>
              ) : (
                  <div className="max-w-2xl mx-auto space-y-12 relative pl-8 border-l-2 border-rose-200 py-4">
                     {getSortedDates().map((date) => (
                        <div key={date.id} className="relative group">
                           <div className={`absolute -left-[43px] top-0 w-8 h-8 rounded-full border-[4px] border-[#fff0f3] shadow-sm transition-colors duration-500 z-10 ${date.isDone ? 'bg-rose-500' : 'bg-gray-300'}`}></div>
                           <div className="bg-white/60 backdrop-blur-lg p-5 rounded-[2rem] shadow-sm group-hover:shadow-lg transition-all flex flex-col sm:flex-row gap-5 items-start border border-white">
                              <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0"><img src={date.image} className="w-full h-full object-cover" /></div>
                              <div className="flex-1">
                                 <h3 className="font-bold font-serif text-xl text-rose-950 mb-1">{date.title}</h3>
                                 <p className="text-sm text-gray-600 font-light mb-3">{date.description}</p>
                                 <div className="flex flex-wrap gap-2">
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide ${date.isDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{date.isDone ? 'Selesai' : 'Belum'}</span>
                                    {date.isDone && ( date.type === 'repeatable' ? (date.links && date.links.map((lnk, i) => (<a key={i} href={lnk} target="_blank" className="text-[10px] bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1 hover:bg-rose-100"><ExternalLink size={8}/> #{i+1}</a>))) : (<a href={date.link} target="_blank" className="text-[10px] bg-rose-100 text-rose-600 px-3 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1 hover:bg-rose-200"><ExternalLink size={8}/> Drive</a>))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
              )}
           </div>
        )}
        
        {/* OTHER TABS (OUTFIT, PMS, ETC) MAPPED SAME AS PREVIOUS CODE */}

        
        {activeTab === 'outfit' && (
                  <div className="max-w-3xl mx-auto py-10 animate-fade-in text-center">
                     <h2 className="text-4xl font-serif font-bold text-rose-950 mb-10">Outfit Matcher</h2>
                     <div className="flex flex-col md:flex-row gap-6 justify-center items-start mb-10">
                        <div className="bg-white/80 p-8 rounded-[2rem] shadow-xl w-full max-w-xs">
                           <h3 className="font-bold text-blue-900 text-xl mb-6">Miftah</h3>
                           <div className="space-y-4">
                              <div className="flex items-center gap-4"><span className="text-xs font-bold w-16">Atasan</span><div className="h-10 flex-1 rounded-xl shadow-inner border border-gray-200" style={{backgroundColor: outfit.miftah?.top || '#FFF'}}></div>{!outfit.locked && <input type="color" value={outfit.miftah?.top || '#FFFFFF'} onChange={(e) => handleOutfitChange({...outfit, miftah: {...outfit.miftah, top: e.target.value}})} />}</div>
                              <input type="text" placeholder="(contoh: kemeja)" value={outfit.miftah?.topText || ''} onChange={(e) => handleOutfitChange({...outfit, miftah: {...outfit.miftah, topText: e.target.value}})} className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"/>
                              <div className="flex items-center gap-4"><span className="text-xs font-bold w-16">Bawahan</span><div className="h-10 flex-1 rounded-xl shadow-inner border border-gray-200" style={{backgroundColor: outfit.miftah?.bot || '#000'}}></div>{!outfit.locked && <input type="color" value={outfit.miftah?.bot || '#000000'} onChange={(e) => handleOutfitChange({...outfit, miftah: {...outfit.miftah, bot: e.target.value}})} />}</div>
                              <input type="text" placeholder="(contoh: celana)" value={outfit.miftah?.botText || ''} onChange={(e) => handleOutfitChange({...outfit, miftah: {...outfit.miftah, botText: e.target.value}})} className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-300"/>
                           </div>
                        </div>
                        <div className="self-center bg-rose-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10 font-bold text-xl my-4 md:my-0"><Plus size={24}/></div>
                        <div className="bg-white/80 p-8 rounded-[2rem] shadow-xl w-full max-w-xs">
                           <h3 className="font-bold text-pink-900 text-xl mb-6">Tanzil</h3>
                           <div className="space-y-4">
                              <div className="flex items-center gap-4"><span className="text-xs font-bold w-16">Atasan</span><div className="h-10 flex-1 rounded-xl shadow-inner border border-gray-200" style={{backgroundColor: outfit.tanzil?.top || '#FFF'}}></div>{!outfit.locked && <input type="color" value={outfit.tanzil?.top || '#FFFFFF'} onChange={(e) => handleOutfitChange({...outfit, tanzil: {...outfit.tanzil, top: e.target.value}})} />}</div>
                              <input type="text" placeholder="(contoh: dress)" value={outfit.tanzil?.topText || ''} onChange={(e) => handleOutfitChange({...outfit, tanzil: {...outfit.tanzil, topText: e.target.value}})} className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300"/>
                              <div className="flex items-center gap-4"><span className="text-xs font-bold w-16">Bawahan</span><div className="h-10 flex-1 rounded-xl shadow-inner border border-gray-200" style={{backgroundColor: outfit.tanzil?.bot || '#000'}}></div>{!outfit.locked && <input type="color" value={outfit.tanzil?.bot || '#000000'} onChange={(e) => handleOutfitChange({...outfit, tanzil: {...outfit.tanzil, bot: e.target.value}})} />}</div>
                              <input type="text" placeholder="(contoh: rok)" value={outfit.tanzil?.botText || ''} onChange={(e) => handleOutfitChange({...outfit, tanzil: {...outfit.tanzil, botText: e.target.value}})} className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-300"/>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => handleOutfitChange({...outfit, locked: !outfit.locked})} className={`px-8 py-4 rounded-full font-bold shadow-lg transition-transform active:scale-95 ${outfit.locked ? 'bg-gray-800 text-white' : 'bg-rose-500 text-white'}`}>{outfit.locked ? <span className="flex items-center gap-2"><Lock size={18}/> Sudah Disepakati</span> : <span className="flex items-center gap-2"><Unlock size={18}/> Kunci Pilihan</span>}</button>
                  </div>
                )}

        {activeTab === 'pms' && (
          <div className="max-w-xl mx-auto py-10 animate-fade-in text-center">
             <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] shadow-xl border border-rose-100">
                <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 animate-bounce-slow"><Droplet size={40} fill="currentColor" /></div></div>
                <h2 className="text-3xl font-serif font-bold text-rose-950 mb-2">PMS Warning System</h2>
                <p className="text-gray-500 text-sm mb-8">Pantau tanggal merah agar dunia tetap damai.</p>
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-inner mb-8">
                   <h4 className="text-center font-bold text-gray-800 mb-4">{new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</h4>
                   {renderCalendar()}
                </div>
                
                <div className="space-y-4 text-left bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                   <div>
                      <label className="block text-xs font-bold text-rose-400 uppercase mb-2 ml-1">Mulai Periode</label>
                      <input 
                        type="date" 
                        value={pmsData.startDate || ''} 
                        onChange={e => handlePmsChange({...pmsData, startDate: e.target.value})} 
                        className="w-full p-3 bg-white rounded-xl border border-rose-100 focus:ring-2 focus:ring-rose-300 outline-none" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-rose-400 uppercase mb-2 ml-1">Selesai Periode</label>
                      <input 
                        type="date" 
                        value={pmsData.endDate || ''} 
                        onChange={e => handlePmsChange({...pmsData, endDate: e.target.value})} 
                        className="w-full p-3 bg-white rounded-xl border border-rose-100 focus:ring-2 focus:ring-rose-300 outline-none" 
                      />
                   </div>
                   {/* TOMBOL BARU: SET JADWAL */}
                   <div className="pt-4 text-center">
                      <button 
                         onClick={() => handlePmsChange(pmsData)} 
                         disabled={!pmsData.startDate || !pmsData.endDate}
                         className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-md hover:bg-rose-700 transition-colors disabled:bg-gray-400"
                      >
                          Set Jadwal Realtime
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* --- CAPSULE & TICKETS & TIMER TABS OMITTED FOR BREVITY, BUT INCLUDED IN RENDER LOGIC AS PREVIOUS --- */}
        {activeTab === 'capsule' && (
           <div className="max-w-3xl mx-auto py-10 animate-fade-in">
              <div className="text-center mb-12">
                 <h2 className="text-4xl font-serif font-bold text-rose-950 mb-3">Rahasia Masa Depan</h2>
                 <p className="text-rose-800/60 tracking-wide uppercase text-xs">Simpan pesan romantis, buka di waktu yang tepat.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className={`p-8 rounded-[2rem] relative overflow-hidden transition-all ${capsuleEmip.isLocked ? 'bg-[#f0f4f8] border-2 border-dashed border-blue-200' : 'bg-white shadow-xl border border-white'}`}>
                    <div className="absolute top-0 left-0 w-full h-2 bg-blue-200"></div><div className="flex items-center gap-4 mb-6"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500"><User size={20}/></div><h3 className="text-xl font-bold text-blue-900 font-serif">Untuk Emip</h3></div>
                    {!capsuleEmip.isLocked ? (<div className="space-y-4"><textarea value={capsuleEmip.msg} onChange={e => setCapsuleEmip({...capsuleEmip, msg: e.target.value})} placeholder="Tulis surat rahasia..." className="w-full p-4 bg-gray-50 rounded-2xl border-0 h-40 resize-none focus:ring-2 focus:ring-blue-200 font-serif italic text-gray-600 leading-loose" /><input type="date" value={capsuleEmip.date} onChange={e => setCapsuleEmip({...capsuleEmip, date: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-0 text-sm" /><button onClick={() => {if(capsuleEmip.msg && capsuleEmip.date) updateCapsule('emip', {...capsuleEmip, isLocked: true})}} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 shadow-md">Segel Surat 💌</button></div>) : (<div className="text-center py-12 bg-white/50 rounded-2xl border border-blue-100"><Lock size={48} className="mx-auto text-blue-300 mb-4 animate-bounce"/><p className="font-bold text-blue-800 text-lg">Surat Tersegel</p><p className="text-xs text-blue-600 mt-2 font-mono">Dapat dibuka: {capsuleEmip.date ? new Date(capsuleEmip.date).toLocaleDateString() : 'Tanggal Belum Ditetapkan'}</p></div>)}
                 </div>
                 <div className={`p-8 rounded-[2rem] relative overflow-hidden transition-all ${capsuleAzil.isLocked ? 'bg-[#fff8e1] border-2 border-dashed border-amber-200' : 'bg-white shadow-xl border border-white'}`}>
                    <div className="absolute top-0 left-0 w-full h-2 bg-amber-200"></div><div className="flex items-center gap-4 mb-6"><div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500"><User size={20}/></div><h3 className="text-xl font-bold text-amber-900 font-serif">Untuk Azil</h3></div>
                    {!capsuleAzil.isLocked ? (<div className="space-y-4"><textarea value={capsuleAzil.msg} onChange={e => setCapsuleAzil({...capsuleAzil, msg: e.target.value})} placeholder="Tulis surat rahasia..." className="w-full p-4 bg-gray-50 rounded-2xl border-0 h-40 resize-none focus:ring-2 focus:ring-amber-200 font-serif italic text-gray-600 leading-loose" /><input type="date" value={capsuleAzil.date} onChange={e => setCapsuleAzil({...capsuleAzil, date: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border-0 text-sm" /><button onClick={() => {if(capsuleAzil.msg && capsuleAzil.date) updateCapsule('azil', {...capsuleAzil, isLocked: true})}} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 shadow-md">Segel Surat 💌</button></div>) : (<div className="text-center py-12 bg-white/50 rounded-2xl border border-amber-100"><Lock size={48} className="mx-auto text-amber-300 mb-4 animate-bounce"/><p className="font-bold text-amber-800 text-lg">Surat Tersegel</p><p className="text-xs text-amber-600 mt-2 font-mono">Dapat dibuka: {capsuleAzil.date ? new Date(capsuleAzil.date).toLocaleDateString() : 'Tanggal Belum Ditetapkan'}</p></div>)}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'tickets' && (
           <div className="max-w-4xl mx-auto py-10 animate-fade-in">
              <div className="bg-gradient-to-r from-amber-300 to-yellow-500 p-10 rounded-[3rem] shadow-xl mb-12 text-amber-900 flex justify-between items-center relative overflow-hidden">
                 <div className="relative z-10"><h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">Love Redeem Tickets</h2><p className="text-sm opacity-80 font-medium tracking-wide">Tukar poin kenangan dengan hadiah spesial.</p></div>
                 <div className="bg-white/30 backdrop-blur-xl px-8 py-5 rounded-3xl text-center min-w-[120px] shadow-sm border border-white/20"><span className="block text-5xl font-bold mb-1">{ticketsEarned}</span><span className="text-[10px] font-bold uppercase tracking-[0.2em]">Tiket Aktif</span></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {vouchers.map(v => (
                    <div key={v.id} className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white flex justify-between items-center group hover:scale-[1.02] transition-all">
                       <div className="flex items-center gap-4"><div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600"><Ticket size={20}/></div><div><h3 className="font-bold text-gray-800 text-lg">{v.title}</h3><p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Biaya: 1 Tiket</p></div></div>
                       <button disabled={ticketsEarned < 1} className="px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:bg-gray-300 hover:bg-amber-600 transition-colors shadow-md" onClick={() => handleRedeem(v.title)}>Tukar</button>
                    </div>
                 ))}
                 <button onClick={() => {const t = prompt("Nama Voucher Baru:"); if(t) setVouchers(prev => [...prev, {id: Date.now(), title: t, used:false}])}} className="border-2 border-dashed border-gray-300 rounded-[2rem] flex items-center justify-center p-8 text-gray-400 hover:bg-white hover:border-rose-300 hover:text-rose-400 transition-all gap-2 bg-white/30"><Plus size={20}/> Buat Voucher Sendiri</button>
              </div>
           </div>
        )}
        {activeTab === 'timer' && (
            <div className="min-h-[80vh] flex flex-col items-center justify-center relative animate-fade-in overflow-hidden">
                <div className="firework" style={{top: '20%', left: '20%', animationDelay: '0.2s'}}></div><div className="firework" style={{top: '30%', left: '80%', animationDelay: '0.5s'}}></div><div className="firework" style={{top: '70%', left: '40%', animationDelay: '1.2s'}}></div><div className="firework" style={{top: '50%', left: '90%', animationDelay: '0.8s'}}></div>
                <div className="text-center z-10 p-8 bg-white/20 backdrop-blur-lg rounded-[3rem] border border-white/30 shadow-2xl max-w-4xl mx-auto">
                    <Heart size={64} className="text-rose-500 fill-rose-500 mx-auto mb-6 animate-pulse" />
                    <h2 className="text-2xl md:text-3xl font-serif text-rose-900 mb-8 font-light italic">We have been together for:</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10">
                        {[{ val: timerText.years, label: 'Years' }, { val: timerText.months, label: 'Months' }, { val: timerText.days, label: 'Days' }, { val: timerText.hours, label: 'Hours' }, { val: timerText.minutes, label: 'Menit' }, { val: timerText.seconds, label: 'Second' }].map((t, i) => (<div key={i} className="flex flex-col items-center"><span className="text-4xl md:text-7xl font-bold text-rose-600 drop-shadow-sm font-serif">{t.val}</span><span className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-rose-800/60 mt-2">{t.label}</span></div>))}
                    </div>
                    <p className="mt-10 text-rose-900/50 text-sm font-medium">Started from 17 Oktober 2025</p>
                </div>
            </div>
        )}

        {activeTab === 'deeptalk' && (
           <div className="max-w-md mx-auto min-h-[70vh] flex flex-col items-center justify-center animate-fade-in">
              {questions.length > 0 ? (
                <>
                  <div className={`w-full h-96 relative cursor-default perspective-1000 group ${isShuffling ? 'animate-shake' : ''}`}>
                     <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                        <div className="absolute w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 rounded-[2.5rem] shadow-2xl shadow-rose-200/50 flex flex-col items-center justify-center p-8 text-white backface-hidden border-[8px] border-white">
                           <MessageCircleHeart size={80} className="mb-6 opacity-90" />
                           <h3 className="text-4xl font-serif font-bold tracking-wide">Deep Talk</h3>
                           <p className="mt-4 uppercase tracking-[0.2em] text-xs font-bold bg-white/20 px-6 py-2 rounded-full">Kocok Untuk Membuka</p>
                        </div>
                        <div className="absolute w-full h-full bg-white rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-10 text-center rotate-y-180 backface-hidden border border-rose-50 relative">
                           <Star size={32} className="text-yellow-400 mb-6 fill-yellow-400"/>
                           <p className="text-2xl font-serif text-rose-950 leading-relaxed font-medium">"{questions[currentQIndex]}"</p>
                           <div className="absolute bottom-8 flex gap-4 text-gray-300">
                              <button onClick={(e) => {e.stopPropagation(); handleDeleteQuestion()}} className="hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50"><Trash2 size={20}/></button>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="mt-12 flex gap-4 w-full">
                     <button onClick={handleNextQuestion} className="flex-1 flex items-center justify-center gap-2 bg-white text-rose-600 border border-white px-6 py-4 rounded-[2rem] font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"><Shuffle size={18} /> Kocok Kartu</button>
                     <button onClick={handleAddQuestion} className="w-16 h-14 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"><Plus size={24}/></button>
                  </div>
                </>
              ) : (
                <div className="text-center p-10">
                   <div className="animate-spin mb-4 text-rose-500"><Sparkles size={32}/></div>
                   <p className="text-rose-800 font-medium">Menyiapkan kartu pertanyaan...</p>
                </div>
              )}
           </div>
        )}

      </div>

      <footer className="text-center py-8 pb-12 opacity-60"><p className="font-serif italic text-rose-900 text-sm">this is how emip & azil enjoy life together.....&lt;3</p></footer>

      {/* --- MODALS --- */}
      {voucherModal.show && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"><div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-bounce-in relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div><Gift size={48} className="text-amber-500 mx-auto mb-4 animate-bounce" /><h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Horee! Berhasil! 🎉</h3><p className="text-gray-600 mb-6 text-sm leading-relaxed">Voucher <strong>"{voucherModal.voucherTitle}"</strong> sudah ditukar. <br/>Coba minta hal ini ke Emip atau ke Azil sekarang ya!</p><button onClick={() => setVoucherModal({ show: false, voucherTitle: '' })} className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg hover:bg-amber-600">Siap, Laksanakan!</button></div></div>)}
      {showGachaModal && !showCongrats && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">{showManualSelection ? (<div className="bg-white rounded-[2.5rem] p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-zoom-in"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold font-serif text-gray-800">Pilih Date Card</h3><button onClick={() => setShowManualSelection(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button></div><div className="space-y-2">{dates.filter(d => !d.isDone).map(d => (<button key={d.id} onClick={() => confirmManualPick(d)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 border border-gray-100 transition-all text-left"><img src={d.image} className="w-10 h-10 rounded-lg object-cover" /><span className="font-bold text-sm text-gray-700">{d.title}</span></button>))}</div></div>) : (<div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-zoom-in border border-white/50">{gachaMode === 'spin' ? (<div className="py-10"><div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden mb-6 shadow-2xl border-[6px] border-rose-100">{gachaResult && <img src={gachaResult.image} className="w-full h-full object-cover" />}</div><h3 className="text-xl font-bold text-rose-500 animate-pulse font-serif">Sedang memilihkan takdir...</h3></div>) : (<><h3 className="text-3xl font-serif font-bold text-gray-800 mb-2">Pilih Takdir</h3><div className="space-y-4 mt-8"><button onClick={handleStartGacha} className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform">🎲 Gacha Acak</button><button onClick={handleManualPickClick} className="w-full bg-white border-2 border-rose-100 text-rose-500 py-4 rounded-2xl font-bold hover:bg-rose-50">👆 Pilih Sendiri</button></div><button onClick={() => setShowGachaModal(false)} className="mt-6 text-gray-400 text-sm">Kembali</button></>)}</div>)}</div>)}
      {showCongrats && gachaResult && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"><div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl animate-bounce-in text-left border border-white/50"><h2 className="text-4xl font-serif font-bold text-rose-600 mb-2 text-center drop-shadow-sm">Terpilih!</h2><div className="bg-rose-50 p-4 rounded-3xl flex items-center gap-4 mb-8 mt-6 border border-rose-100 shadow-inner"><img src={gachaResult.image} className="w-20 h-20 rounded-2xl object-cover shadow-sm" /><div><h3 className="font-bold text-gray-800 text-lg leading-tight">{gachaResult.title}</h3></div></div><div className="space-y-4"><div><label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Tanggal</label><input type="date" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-medium text-gray-600 focus:ring-2 focus:ring-rose-200" onChange={(e) => setTargetDateInput(e.target.value)} /></div><div><label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Jam</label><input type="time" className="w-full p-4 bg-gray-50 border-0 rounded-2xl font-medium text-gray-600 focus:ring-2 focus:ring-rose-200" onChange={(e) => setTargetTimeInput(e.target.value)} /></div></div><button onClick={confirmDatePlan} className="w-full mt-10 bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 shadow-xl shadow-rose-200 hover:-translate-y-1 transition-all">Gas, Berangkat! 🚀</button></div></div>)}
      {activeLinkModal && (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"><div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-white/50"><h3 className="text-2xl font-bold mb-2 text-gray-800 font-serif">Simpan Kenangan</h3><p className="text-sm text-gray-500 mb-8 font-light">Masukkan link Google Drive agar kenangan ini abadi.</p><input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://drive.google.com/..." className="w-full bg-gray-50 border-0 rounded-2xl p-5 mb-8 focus:ring-2 focus:ring-rose-200 text-gray-700" /><div className="flex justify-end gap-3"><button onClick={() => setActiveLinkModal(null)} className="px-6 py-3 rounded-xl text-gray-400 hover:bg-gray-100 font-bold transition-colors">Batal</button><button onClick={() => handleMarkDone(linkInput)} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-rose-200 hover:-translate-y-0.5 transition-all">Simpan</button></div></div></div>)}
    </div>
  );
}