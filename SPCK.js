// =========================
// SkillSwap - Firebase Version
// =========================

// Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBV1A0CyWn-_Rfr14tRnBDdSOWjW2e64Fg",
  authDomain: "bibilabu.firebaseapp.com",
  projectId: "bibilabu",
  storageBucket: "bibilabu.firebasestorage.app",
  messagingSenderId: "50186983635",
  appId: "1:50186983635:web:96bbe6ad497822a6591c26",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export để các trang dùng
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
window.fbFns = {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc, setDoc, getDoc, getDocs,
  collection, query, where, orderBy,
  updateDoc, deleteDoc, addDoc,
  serverTimestamp,
  ref, uploadBytes, getDownloadURL
};

// =========================
// AUTH STATE
// =========================
window.Auth = {
  currentUser: null,
  listeners: [],
  onReady(callback) {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Lấy thêm info từ Firestore
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          window.Auth.currentUser = snap.exists()
            ? { uid: firebaseUser.uid, ...snap.data() }
            : { uid: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email, xp: 0, level: 1 };
        } catch {
          window.Auth.currentUser = { uid: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email, xp: 0, level: 1 };
        }
      } else {
        window.Auth.currentUser = null;
      }
      callback(window.Auth.currentUser);
    });
  }
};

// =========================
// UTILITY
// =========================
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
window.debounce = debounce;

// Toast
window.showToast = (msg, type = 'info') => {
  // Remove existing toasts
  document.querySelectorAll('.ss-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'ss-toast';
  const colors = { success: '#10d9a0', error: '#f87171', warn: '#fbbf24', info: '#0d6efd' };
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;padding:14px 24px;border-radius:14px;color:white;z-index:99999;font-weight:600;font-size:15px;box-shadow:0 8px 32px rgba(0,0,0,0.25);background:${colors[type]||colors.info};animation:toastIn 0.3s ease;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; setTimeout(() => toast.remove(), 400); }, 3000);
};

const toastStyle = document.createElement('style');
toastStyle.textContent = `@keyframes toastIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`;
document.head.appendChild(toastStyle);

// =========================
// PAGE INIT
// =========================
window.addEventListener("load", () => {
  // Ẩn loader
  function hideLoader() {
    const loader = document.querySelector(".loader");
    if (loader) {
      loader.style.transition = "opacity 0.8s ease-in-out";
      loader.style.opacity = "0";
      setTimeout(() => { loader.style.display = "none"; }, 800);
    }
  }

  // Chạy ngay khi load xong
  hideLoader();

  // Init UI sau khi biết auth state
  Auth.onReady((user) => {
    updateUserUI(user);
    if (typeof window.onAuthReady === 'function') window.onAuthReady(user);
  });

  initCounters();
  revealScroll();
  initTyping();
  initQuotes();
  initCursorGlow();
  initTopBtn();
  initDarkMode();
  initSearch();

  console.log("🔥 SkillSwap Firebase Loaded!");
});

// Fallback loader
setTimeout(() => {
  const loader = document.querySelector(".loader");
  if (loader && loader.style.display !== "none") loader.style.display = "none";
}, 3000);

// =========================
// USER UI
// =========================
function updateUserUI(user) {
  const loginBtn = document.getElementById('login-button');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  if (user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) { userInfo.style.display = 'flex'; }
    if (userName) userName.textContent = user.name || user.email || 'User';
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
  }
}

window.logout = async () => {
  if (confirm('Đăng xuất?')) {
    await signOut(auth);
    window.Auth.currentUser = null;
    window.location.href = 'index.html';
  }
};

// =========================
// DARK MODES
// =========================
function initDarkMode() {
  if (localStorage.getItem('darkMode') === '1') document.body.classList.add('dark-mode');
  const btn = document.getElementById("darkModeBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem('darkMode', isDark ? '1' : '0');
      btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
  }
}

// =========================
// COUNTERS
// =========================
function initCounters() {
  const counters = document.querySelectorAll(".counter");
  if (!counters.length) return;

  // Đếm động từ Firestore nếu có stats-row
  const statsRow = document.getElementById('stats-row');
  if (statsRow) {
    loadDynamicStats(statsRow);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); }
    });
  });
  counters.forEach(c => observer.observe(c));
}

async function loadDynamicStats(container) {
  try {
    const skillsSnap = await getDocs(collection(db, 'skills'));
    const usersSnap = await getDocs(collection(db, 'users'));
    const approvedCount = skillsSnap.docs.filter(d => d.data().status === 'approved').length;
    const stats = [
      { icon: '🎓', value: usersSnap.size, label: 'Học sinh' },
      { icon: '💡', value: approvedCount, label: 'Kỹ năng' },
      { icon: '🔄', value: Math.floor(approvedCount * 1.5), label: 'Trao đổi' },
      { icon: '⭐', value: 5, label: 'Đánh giá TB' }
    ];
    container.innerHTML = stats.map(s => `
      <div class="col-6 col-md-3">
        <div class="stat-card text-center p-4">
          <div style="font-size:40px">${s.icon}</div>
          <h2 class="counter fw-bold" style="color:#4f46e5" data-target="${s.value}">${s.value}</h2>
          <p class="mb-0 text-muted">${s.label}</p>
        </div>
      </div>`).join('');
  } catch (e) {
    container.innerHTML = '';
  }
}

function animateCounter(counter) {
  let current = 0;
  const target = +counter.getAttribute("data-target");
  if (!target) return;
  const increment = Math.ceil(target / 60);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { counter.textContent = target; clearInterval(timer); }
    else counter.textContent = current;
  }, 30);
}

// =========================
// REVEAL SCROLL
// =========================
function revealScroll() {
  const reveals = document.querySelectorAll(".reveal");
  const check = () => {
    const windowHeight = window.innerHeight;
    reveals.forEach(r => {
      if (r.getBoundingClientRect().top < windowHeight - 100) r.classList.add("active");
    });
  };
  check();
  window.addEventListener("scroll", check, { passive: true });
}

// =========================
// TYPING EFFECT
// =========================
function initTyping() {
  const typing = document.getElementById("typing");
  if (!typing) return;
  const texts = ["Trao kỹ năng - Kết nối đam mê", "Học hỏi không ngừng", "Cùng nhau phát triển", "SkillSwap - Nơi đam mê gặp gỡ"];
  let ti = 0, ci = 0, del = false;
  function type() {
    const cur = texts[ti];
    typing.textContent = del ? cur.substring(0, ci - 1) : cur.substring(0, ci + 1);
    del ? ci-- : ci++;
    if (!del && ci === cur.length) setTimeout(() => del = true, 2000);
    else if (del && ci === 0) { del = false; ti = (ti + 1) % texts.length; }
    setTimeout(type, del ? 50 : 100);
  }
  type();
}

// =========================
// QUOTES
// =========================
function initQuotes() {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl) return;
  const quotes = ["Học để phát triển 🚀", "Mỗi kỹ năng là một cơ hội 💡", "Không ngừng học hỏi 🌱", "Chia sẻ để cùng tiến bộ 🤝", "Kiến thức nhân đôi khi chia sẻ 📚"];
  const rotate = () => {
    quoteEl.style.opacity = "0";
    setTimeout(() => { quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)]; quoteEl.style.opacity = "0.9"; quoteEl.style.transition = "opacity 0.4s"; }, 300);
  };
  rotate();
  setInterval(rotate, 5000);
}

// =========================
// CURSOR GLOW
// =========================
function initCursorGlow() {
  const glow = document.querySelector(".cursor-glow");
  if (!glow) return;
  document.addEventListener("mousemove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  }, { passive: true });
}

// =========================
// TOP BUTTON
// =========================
function initTopBtn() {
  const btn = document.getElementById("topBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => { btn.style.display = window.scrollY > 300 ? "block" : "none"; }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// =========================
// SEARCH
// =========================
function initSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;
  searchInput.addEventListener("keyup", debounce(() => {
    const val = searchInput.value.toLowerCase().trim();
    document.querySelectorAll(".card").forEach(card => {
      const wrap = card.closest('.col-md-4, .col-md-3, .col-lg-3, [class*="col-"]');
      if (wrap) wrap.style.display = card.textContent.toLowerCase().includes(val) ? "" : "none";
    });
  }, 300));
}

// =========================
// SOUND
// =========================
window.playSound = () => {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain).connect(audio.destination);
    osc.frequency.setValueAtTime(800, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audio.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.2);
    osc.type = 'sine'; osc.start(); osc.stop(audio.currentTime + 0.2);
  } catch (e) {}
};

window.showMessage = () => showToast("🔥 Khám phá cộng đồng SkillSwap ngay!", 'info');