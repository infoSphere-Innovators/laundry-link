// dashboard.js
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRCf1vmmQqMg_8O9tCKefWs3P_9Z__T-M",
  authDomain: "caps-laundry-services.firebaseapp.com",
  databaseURL: "https://caps-laundry-services-default-rtdb.firebaseio.com",
  projectId: "caps-laundry-services",
  storageBucket: "caps-laundry-services.appspot.com",
  messagingSenderId: "795365295115",
  appId: "1:795365295115:web:4a269fd2c38cf2d38eb30e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const userType = localStorage.getItem("userType");
const userID = localStorage.getItem("userID");

if (userType !== "staff" || !userID) {
  Swal.fire({
    icon: 'warning',
    title: 'You are not logged in',
    text: 'Please login as staff first.',
    confirmButtonText: 'OK'
  }).then(() => {
    window.location.href = "/login-page/index.html";
  });
}

// Load Staff Profile
const profileBtn = document.querySelector(".side-menu li a[href='#']:has(i.bxs-cog)");
if (profileBtn) {
  profileBtn.addEventListener("click", async () => {
    const staffID = localStorage.getItem("userID");
    if (!staffID) return;

    try {
      const snapshot = await get(child(ref(db), `staffs/${staffID}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("profileID").value = staffID;
        document.getElementById("profileName").value = data.fullName || "";
        document.getElementById("profileContact").value = data.contact || "";
        document.getElementById("profileStatus").value = data.status || "";
        document.getElementById("profileDate").value = data.dateRegistered || "";
        document.getElementById("profileModal").style.display = "flex";
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Not Found',
          text: 'Staff profile not found.'
        });
      }
    } catch (error) {
      console.error("Failed to fetch staff profile:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not retrieve staff profile.'
      });
    }
  });
}

// Close Profile Modal
window.closeProfileModal = function () {
  document.getElementById("profileModal").style.display = "none";
};

// Sidebar Navigation
const navDashboard = document.getElementById("nav-dashboard");
const navOrders = document.getElementById("nav-orders");
const dashboardSection = document.getElementById("dashboard-section");
const ordersSection = document.getElementById("orders-section");

function hideAllSections() {
  dashboardSection.style.display = "none";
  ordersSection.style.display = "none";
}

function setActive(activeLink) {
  const sidebarLinks = document.querySelectorAll(".side-menu.top li");
  sidebarLinks.forEach(li => li.classList.remove("active"));
  activeLink.parentElement.classList.add("active");
}

navDashboard.addEventListener("click", function(e) {
  e.preventDefault();
  hideAllSections();
  dashboardSection.style.display = "block";
  setActive(this);
});

navOrders.addEventListener("click", function(e) {
  e.preventDefault();
  hideAllSections();
  ordersSection.style.display = "block";
  setActive(this);
});
