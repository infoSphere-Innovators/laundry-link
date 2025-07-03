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

window.staffLogin = async function () {
  const staffID = document.getElementById("staffID").value.trim();
  const password = document.getElementById("staffPass").value;

  if (!staffID || !password) {
    showToast('warning', 'Please fill in both fields.');
    return;
  }

  try {
    const snapshot = await get(child(ref(db), `staffs/${staffID}`));
    if (!snapshot.exists()) {
      showToast('error', 'Staff account not found.');
      return;
    }

    const encoder = new TextEncoder();
    const encodedPassword = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedPassword);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (snapshot.val().password !== hashedPassword) {
      showToast('error', 'Incorrect password.');
      return;
    }

    localStorage.setItem("userType", "staff");
    localStorage.setItem("userID", staffID);

    showToast('success', 'Login successful! Redirecting...');
    setTimeout(() => {
      window.location.href = "/staffboard-page/index.html";
    }, 2000);
  } catch (error) {
    console.error(error);
    showToast('error', 'An error occurred. Please try again.');
  }
};
