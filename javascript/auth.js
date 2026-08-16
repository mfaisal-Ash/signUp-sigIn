/* ============================================================
   auth.js
   Simulasi sistem Sign Up & Sign In (tanpa backend, pakai
   localStorage sebagai "database" sementara di browser),
   dengan sejumlah pengaman di sisi client:
     - Rate limiting (anti brute-force / anti spam submit)
     - Honeypot field (anti bot sederhana)
     - Batas jumlah user & panjang input (anti storage-filling)
     - Fallback alert jika SweetAlert2 gagal dimuat
   ============================================================ */

const STORAGE_KEY = "ss_users";
const SESSION_KEY = "ss_current_user";
const MAX_USERS = 200; // batas jumlah akun tersimpan per browser

const RATE_LIMIT = {
  signup: { max: 5, windowMs: 60_000, key: "ss_rl_signup" },   // 5x / menit
  signin: { max: 5, windowMs: 60_000, key: "ss_rl_signin" },   // 5x / menit
};

/* ---------------------- Helper: Storage ---------------------- */

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const users = raw ? JSON.parse(raw) : [];
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Encoding sederhana untuk password (BUKAN enkripsi aman,
// hanya simulasi supaya password tidak tersimpan polos di localStorage).
function encodePassword(password) {
  return btoa(unescape(encodeURIComponent(password)));
}

/* ---------------------- Helper: Rate Limiting ---------------------- */
// Membatasi jumlah percobaan submit dalam suatu window waktu, disimpan di
// sessionStorage. Ini mencegah script/bot mengirim ratusan request
// sign up/sign in secara beruntun (brute force / spam) dari satu tab.

function checkRateLimit(name) {
  const cfg = RATE_LIMIT[name];
  const now = Date.now();
  let record;
  try {
    record = JSON.parse(sessionStorage.getItem(cfg.key)) || { count: 0, start: now };
  } catch {
    record = { count: 0, start: now };
  }

  if (now - record.start > cfg.windowMs) {
    record = { count: 0, start: now };
  }

  record.count += 1;
  sessionStorage.setItem(cfg.key, JSON.stringify(record));

  const remainingMs = cfg.windowMs - (now - record.start);
  return {
    allowed: record.count <= cfg.max,
    retryAfterSec: Math.max(1, Math.ceil(remainingMs / 1000)),
  };
}

/* ---------------------- Helper: Alert ---------------------- */
// Fallback bila SweetAlert2 gagal dimuat (mis. koneksi ke asset lambat/gagal),
// form tetap bisa memberi feedback ke pengguna lewat alert bawaan browser.

const hasSwal = typeof window.Swal !== "undefined";

function alertSuccess(title, text) {
  if (hasSwal) {
    return Swal.fire({
      icon: "success",
      title,
      text,
      toast: true,
      position: "top-end",
      timer: 2500,
      showConfirmButton: false,
    });
  }
  window.alert(`${title}\n${text || ""}`);
  return Promise.resolve();
}

function alertError(title, text) {
  if (hasSwal) {
    return Swal.fire({
      icon: "error",
      title,
      text,
      toast: true,
      position: "top-end",
      timer: 3000,
      showConfirmButton: false,
    });
  }
  window.alert(`${title}\n${text || ""}`);
  return Promise.resolve();
}

function alertModal(icon, title, text) {
  if (hasSwal) {
    return Swal.fire({ icon, title, text, confirmButtonColor: "#6A64F1" });
  }
  window.alert(`${title}\n${text || ""}`);
  return Promise.resolve();
}

/* ---------------------- Helper: Validasi ---------------------- */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Minimal 8 karakter, minimal 1 huruf besar, 1 huruf kecil, 1 angka
function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function showFieldError(inputEl, message) {
  clearFieldError(inputEl);
  inputEl.classList.add("border-red-500", "focus:border-red-500");
  const err = document.createElement("p");
  err.className = "field-error mt-1 text-sm text-red-500";
  err.textContent = message; // textContent -> aman dari XSS, tidak pernah pakai innerHTML untuk data pengguna
  inputEl.insertAdjacentElement("afterend", err);
}

function clearFieldError(inputEl) {
  inputEl.classList.remove("border-red-500", "focus:border-red-500");
  const next = inputEl.nextElementSibling;
  if (next && next.classList.contains("field-error")) {
    next.remove();
  }
}

function clearAllErrors(form) {
  form.querySelectorAll(".field-error").forEach((el) => el.remove());
  form
    .querySelectorAll("input")
    .forEach((el) => el.classList.remove("border-red-500", "focus:border-red-500"));
}

/* ---------------------- Show / Hide Password ---------------------- */

function initTogglePassword() {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
    });
  });
}

/* ---------------------- Sign Up ---------------------- */

function initSignUp() {
  const form = document.getElementById("form-signup");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors(form);

    // Honeypot: field ini hanya bisa terisi oleh bot yang mengisi semua field
    // secara otomatis (manusia tidak melihatnya karena disembunyikan via CSS).
    if (form.website && form.website.value.trim() !== "") {
      // Diam-diam tolak tanpa memberi tahu bot kenapa (jangan beri sinyal balik).
      form.reset();
      return;
    }

    const rl = checkRateLimit("signup");
    if (!rl.allowed) {
      alertError(
        "Terlalu banyak percobaan",
        `Coba lagi dalam ${rl.retryAfterSec} detik.`
      );
      return;
    }

    const firstName = form.first_name.value.trim();
    const lastName = form.last_name.value.trim();
    const nickname = form.nickname.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;

    let valid = true;

    if (!firstName) {
      showFieldError(form.first_name, "Nama depan wajib diisi.");
      valid = false;
    }
    if (!lastName) {
      showFieldError(form.last_name, "Nama belakang wajib diisi.");
      valid = false;
    }
    if (!nickname) {
      showFieldError(form.nickname, "Nickname wajib diisi.");
      valid = false;
    } else if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(nickname)) {
      showFieldError(form.nickname, "3-30 karakter: huruf, angka, _ . - saja.");
      valid = false;
    }
    if (!email) {
      showFieldError(form.email, "Email wajib diisi.");
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(form.email, "Format email tidak valid.");
      valid = false;
    }
    if (!password) {
      showFieldError(form.password, "Password wajib diisi.");
      valid = false;
    } else if (!isStrongPassword(password)) {
      showFieldError(
        form.password,
        "Min. 8 karakter, kombinasi huruf besar, huruf kecil, dan angka."
      );
      valid = false;
    }
    if (confirmPassword !== password || !confirmPassword) {
      showFieldError(form.confirm_password, "Konfirmasi password tidak cocok.");
      valid = false;
    }

    if (!valid) {
      alertError("Data belum lengkap", "Periksa kembali form Anda.");
      return;
    }

    const users = getUsers();

    if (users.length >= MAX_USERS) {
      alertError(
        "Penyimpanan penuh",
        "Batas maksimum akun tersimpan di browser ini sudah tercapai."
      );
      return;
    }

    if (users.some((u) => u.nickname.toLowerCase() === nickname.toLowerCase())) {
      showFieldError(form.nickname, "Nickname sudah digunakan.");
      alertError("Nickname dipakai", "Silakan gunakan nickname lain.");
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      showFieldError(form.email, "Email sudah terdaftar.");
      alertError("Email sudah terdaftar", "Gunakan email lain atau langsung Sign In.");
      return;
    }

    users.push({
      firstName,
      lastName,
      nickname,
      email,
      password: encodePassword(password),
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);

    form.reset();
    alertModal(
      "success",
      "Registrasi berhasil!",
      `Selamat datang, ${firstName}. Silakan Sign In untuk melanjutkan.`
    ).then(() => {
      // pindah otomatis ke tab Login setelah sign up sukses
      document.querySelector('#tabs a[href="#third"]').click();
      const loginNickname = document.getElementById("login_nickname");
      if (loginNickname) loginNickname.value = nickname;
    });
  });
}

/* ---------------------- Sign In ---------------------- */

function initSignIn() {
  const form = document.getElementById("form-signin");
  const lockoutMsg = document.getElementById("signin-lockout-msg");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors(form);
    if (lockoutMsg) lockoutMsg.classList.add("hidden");

    // Honeypot anti-bot
    if (form.website && form.website.value.trim() !== "") {
      form.reset();
      return;
    }

    const rl = checkRateLimit("signin");
    if (!rl.allowed) {
      const msg = `Terlalu banyak percobaan login. Coba lagi dalam ${rl.retryAfterSec} detik.`;
      if (lockoutMsg) {
        lockoutMsg.textContent = msg;
        lockoutMsg.classList.remove("hidden");
      }
      alertError("Terlalu banyak percobaan", msg);
      return;
    }

    const nickname = form.nickname.value.trim();
    const password = form.password.value;

    let valid = true;
    if (!nickname) {
      showFieldError(form.nickname, "Nickname wajib diisi.");
      valid = false;
    }
    if (!password) {
      showFieldError(form.password, "Password wajib diisi.");
      valid = false;
    }
    if (!valid) {
      alertError("Data belum lengkap", "Nickname dan password wajib diisi.");
      return;
    }

    const users = getUsers();
    const user = users.find(
      (u) => u.nickname.toLowerCase() === nickname.toLowerCase()
    );

    if (!user || user.password !== encodePassword(password)) {
      // Pesan generik (tidak bilang "nickname tidak ditemukan" vs "password salah")
      // supaya penyerang tidak bisa memetakan nickname mana yang valid.
      alertError("Login gagal", "Nickname atau password salah.");
      return;
    }

    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ nickname: user.nickname, firstName: user.firstName, email: user.email })
    );

    alertSuccess("Login berhasil!", `Selamat datang kembali, ${user.firstName}.`).then(() => {
      window.location.href = "dashboard.html";
    });
  });
}

/* ---------------------- Init ---------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initTogglePassword();
  initSignUp();
  initSignIn();
});
