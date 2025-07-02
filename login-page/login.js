// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBRCf1vmmQqMg_8O9tCKefWs3P_9Z__T-M",
  authDomain: "caps-laundry-services.firebaseapp.com",
  databaseURL: "https://caps-laundry-services-default-rtdb.firebaseio.com",
  projectId: "caps-laundry-services",
  storageBucket: "caps-laundry-services.firebasestorage.app",
  messagingSenderId: "795365295115",
  appId: "1:795365295115:web:4a269fd2c38cf2d38eb30e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Toast function using SweetAlert2
function showToast(icon, message) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: icon,
    title: message,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true
  });
}

// Admin login function
window.adminLogin = async function () {
  const username = document.getElementById("adminusername").value.trim();
  const password = document.getElementById("adminPass").value;

  if (!username || !password) {
    showToast('warning', 'Please fill in both fields.');
    return;
  }

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `admins/${username}`));

    if (!snapshot.exists()) {
      showToast('error', 'Admin account not found.');
      return;
    }

    const adminData = snapshot.val();

    if (adminData.password !== password) {
      showToast('error', 'Incorrect password.');
      return;
    }

    showToast('success', 'Login successful! Redirecting...');
    setTimeout(() => {
      window.location.href = "/dashboard-page/index.html";
    }, 2000);

  } catch (error) {
    console.error(error);
    showToast('error', 'An error occurred. Please try again.');
  }
};
