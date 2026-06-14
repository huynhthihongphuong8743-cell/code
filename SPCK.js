// =========================
// SkillSwap - Main Script (Clean & Full Functions)
// =========================

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// =========================
// DB & AUTH CORE
// =========================
const DB = {
  get(key) { return JSON.parse(localStorage.getItem(key) || 'null'); },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  getAll(prefix) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) items.push(DB.get(k));
    }
    return items;
  },
  remove(key) { localStorage.removeItem(key); }
};

const Auth = {
  currentUser: null,
  login(user) {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  },
  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    location.reload();
  },
  init() {
    const saved = localStorage.getItem('currentUser');
    if (saved) this.currentUser = JSON.parse(saved);
  }
};

window.DB = DB;
window.Auth = Auth;

// Toast
window.showToast = (msg, type = 'info') => {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:12px;color:white;z-index:99999;`;
  toast.style.background = type === 'success' ? '#10d9a0' : type === 'error' ? '#f87171' : '#0d6efd';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// =========================
// INIT & LOADER (Fixed)
// =========================
window.addEventListener("load", () => {
  console.log("✅ SkillSwap Page Loaded");

  // Ẩn Loader
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.style.transition = "opacity 0.8s ease";
    loader.style.opacity = "0";
    setTimeout(() => { loader.style.display = "none"; }, 800);
  }

  Auth.init();
  updateUserUI();

  // Khởi tạo các chức năng cũ
  initCounters();
  revealScroll();
  typeWriter();
  randomQuote();

  console.log("🔥 SkillSwap Fully Loaded!");
});

// Fallback loader
setTimeout(() => {
  const loader = document.querySelector(".loader");
  if (loader && loader.style.display !== "none") loader.style.display = "none";
}, 2500);

// Update User UI
function updateUserUI() {
  const loginBtn = document.getElementById('login-button');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');

  if (Auth.currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userInfo) {
      userInfo.style.display = 'flex';
      userName.textContent = Auth.currentUser.name || 'User';
    }
  } else {
    if (loginBtn) loginBtn.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
  }
}

function logout() {
  if (confirm('Đăng xuất?')) Auth.logout();
}

// =========================
// NOTIFICATION SYSTEM
// =========================
function showNotification(message) {
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;margin-left:15px;">×</button>
  `;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 100);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 500);
  }, 4000);
}

// =========================
// BUTTON ACTIONS
// =========================
function showMessage() {
  showNotification("🔥 Khám phá cộng đồng SkillSwap ngay!");
  playSound();
}

function fakeLogin() {
  const username = prompt("👋 Nhập tên của bạn:");
  if (username && username.trim()) {
    localStorage.setItem("user", username.trim());
    showNotification(`🎉 Xin chào ${username.trim()}! Đăng nhập thành công!`);
    playSound();
  }
}

// Mobile menu toggle
function toggleMenu() {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('active');
}

// =========================
// DARK MODE
// =========================
const darkBtn = document.getElementById("darkModeBtn");
if (darkBtn) {
  darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    showNotification(isDark ? "🌙 Dark Mode đã bật" : "☀️ Light Mode đã bật");
    playSound();
  });
}

// =========================
// STICKY HEADER
// =========================
window.addEventListener("scroll", () => {
  const header = document.querySelector("header");
  const spacer = document.getElementById("header-spacer");
  if (header) {
    if (window.scrollY > 50) {
      header.classList.add("sticky");
      if (spacer) spacer.style.height = header.offsetHeight + "px";
    } else {
      header.classList.remove("sticky");
      if (spacer) spacer.style.height = "0px";
    }
  }

  const topBtn = document.getElementById("topBtn");
  if (topBtn) topBtn.style.display = window.scrollY > 300 ? "block" : "none";
});

// =========================
// SEARCH
// =========================
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("keyup", debounce(() => {
    const value = searchInput.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(value) ? "block" : "none";
    });
  }, 300));
}

// =========================
// ANIMATED COUNTERS
// =========================
function initCounters() {
  const counters = document.querySelectorAll(".counter");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  });
  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(counter) {
  let current = 0;
  const target = +counter.getAttribute("data-target");
  const increment = Math.ceil(target / 100);
  const duration = 2000;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      counter.innerText = target;
      clearInterval(timer);
    } else {
      counter.innerText = current;
    }
  }, duration / (target / increment));
}

// =========================
// REVEAL ON SCROLL
// =========================
function revealScroll() {
  const reveals = document.querySelectorAll(".reveal");
  const windowHeight = window.innerHeight;
  reveals.forEach(reveal => {
    const revealTop = reveal.getBoundingClientRect().top;
    if (revealTop < windowHeight - 150) {
      reveal.classList.add("active");
    }
  });
}
window.addEventListener("scroll", revealScroll);

// =========================
// TYPING EFFECT
// =========================
const typingTexts = ["Trao kỹ năng - Kết nối đam mê", "Học hỏi không ngừng", "Cùng nhau phát triển", "SkillSwap - Nơi đam mê gặp gỡ"];
let textIndex = 0, charIndex = 0, isDeleting = false;
const typing = document.getElementById("typing");

function typeWriter() {
  const currentText = typingTexts[textIndex];
  if (isDeleting) {
    typing.textContent = currentText.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typing.textContent = currentText.substring(0, charIndex + 1);
    charIndex++;
  }

  const typeSpeed = isDeleting ? 50 : 100;
  if (!isDeleting && charIndex === currentText.length) {
    setTimeout(() => isDeleting = true, 2000);
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    textIndex = (textIndex + 1) % typingTexts.length;
  }
  setTimeout(typeWriter, typeSpeed);
}

// =========================
// TOP BUTTON, QUOTES, CURSOR, SOUND
// =========================
document.getElementById("topBtn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  playSound();
});

const quotes = ["Học để phát triển 🚀","Mỗi kỹ năng là một cơ hội 💡","Không ngừng học hỏi 🌱","Chia sẻ để cùng tiến bộ 🤝","Kiến thức nhân đôi khi chia sẻ 📚"];
function randomQuote() {
  const quoteEl = document.getElementById("quote");
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  quoteEl.style.opacity = "0.5";
  setTimeout(() => {
    quoteEl.textContent = random;
    quoteEl.style.opacity = "0.9";
  }, 300);
}
setInterval(randomQuote, 5000);
randomQuote();

document.addEventListener("mousemove", (e) => {
  const glow = document.querySelector(".cursor-glow");
  if (glow) {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  }
});

function playSound() {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain).connect(audio.destination);
    osc.frequency.setValueAtTime(800, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audio.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.2);
    osc.type = 'sine';
    osc.start();
    osc.stop(audio.currentTime + 0.2);
  } catch(e) {}
}

// Add sound to buttons
document.querySelectorAll('.btn').forEach(btn => {
  if (!btn.id.includes('Toggle')) btn.addEventListener('click', playSound);
});

console.log("🔥 SkillSwap - Clean Version Loaded! 🚀");