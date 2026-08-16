/* ============================================================
   dashboard.js — halaman setelah login berhasil
   ============================================================ */

const SESSION_KEY = "ss_current_user";
const hasSwal = typeof window.Swal !== "undefined";

function notify(icon, title, opts = {}) {
  if (hasSwal) {
    return Swal.fire({ icon, title, confirmButtonColor: "#6A64F1", ...opts });
  }
  window.alert(title);
  return Promise.resolve();
}

document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem(SESSION_KEY);
  const welcomeText = document.getElementById("welcome-text");

  if (!raw) {
    notify("warning", "Belum login", {
      text: "Silakan Sign In terlebih dahulu.",
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  let user;
  try {
    user = JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = "index.html";
    return;
  }

  // textContent -> aman dari XSS meski data berasal dari storage
  welcomeText.textContent = `Halo, ${user.firstName} (@${user.nickname})`;
});

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  notify("success", "Logout berhasil", {
    toast: true,
    position: "top-end",
    timer: 1500,
    showConfirmButton: false,
  }).then(() => {
    window.location.href = "index.html";
  });
});
