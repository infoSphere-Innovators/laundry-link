// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  child
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase Configuration
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

// Helper: Show SweetAlert2 Toast
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

// Helper: Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Register staff account
document.getElementById("registerBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  // Get input values
  const staffID = document.getElementById("staffID").value.trim();
  const fullName = document.getElementById("fullName").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const password = document.getElementById("staffPass").value;

  // Basic field validation
  if (!staffID || !fullName || !contact || !password) {
    showToast("warning", "Please fill in all fields.");
    return;
  }

  try {
    const dbRef = ref(db);
    const existing = await get(child(dbRef, `staff/${staffID}`));

    if (existing.exists()) {
      showToast("error", "Staff ID already exists. Choose another.");
      return;
    }

    const hashedPassword = await hashPassword(password);

    // Save to Realtime Database
    await set(ref(db, `staff/${staffID}`), {
      fullName: fullName,
      contact: contact,
      password: hashedPassword
    });

    // Show success message
    showToast("success", "Staff registered successfully!");

    // Clear form fields
    document.getElementById("staffID").value = "";
    document.getElementById("fullName").value = "";
    document.getElementById("contact").value = "";
    document.getElementById("staffPass").value = "";

    // Redirect to login after short delay
    setTimeout(() => {
      window.location.href = "/login-page/index.html";
    }, 2500);

  } catch (error) {
    console.error("Registration error:", error);
    showToast("error", "Error occurred. Try again.");
  }
});
