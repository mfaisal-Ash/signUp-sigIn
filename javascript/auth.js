/* ============================================================
   auth.js
   Simulasi sistem Sign Up & Sign In (tanpa backend, pakai
   localStorage sebagai "database" sementara di browser).
   ============================================================ */

const STORAGE_KEY = "ss_users";
const SESSION_KEY = "ss_current_user";

/* ---------------------- Helper: Storage ---------------------- */

function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Encoding sederhana untuk password (BUKAN enkripsi aman,
// hanya simulasi supaya password tidak tersimpan polos di localStorage).
function encodePassword(password) {
  return btoa(unescape(encodeURIComponent(password)));
}

/* ---------------------- Helper: Alert (SweetAlert2) ---------------------- */

function alertSuccess(title, text) {
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

function alertError(title, text) {
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

function alertModal(icon, title, text) {
  return Swal.fire({ icon, title, text, confirmButtonColor: "#6A64F1" });
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
  err.textContent = message;
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
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors(form);

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
