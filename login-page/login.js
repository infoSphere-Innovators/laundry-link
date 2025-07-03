import { ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { db } from './firebaseConfig.js';

function showToast(icon, message) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

window.adminLogin = async function () {
  const username = document.getElementById("adminusername").value.trim();
  const password = document.getElementById("adminPass").value;

  if (!username || !password) {
    showToast('warning', 'Please fill in both fields.');
    return;
  }

  try {
    const snapshot = await get(child(ref(db), `admins/${username}`));
    if (!snapshot.exists()) {
      showToast('error', 'Admin account not found.');
      return;
    }

    if (snapshot.val().password !== password) {
      showToast('error', 'Incorrect password.');
      return;
    }

    // SET the admin logged-in flag:
    localStorage.setItem("adminLoggedIn", "true");
    localStorage.setItem("userType", "admin");
    localStorage.setItem("userID", username);

    showToast('success', 'Login successful! Redirecting...');
    setTimeout(() => {
      window.location.href = "/dashboard-page/index.html";
    }, 2000);
  } catch (error) {
    console.error(error);
    showToast('error', 'An error occurred. Please try again.');
  }
};
