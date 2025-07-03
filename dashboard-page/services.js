import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRCf1vmmQqMg_8O9tCKefWs3P_9Z__T-M",
  authDomain: "caps-laundry-services.firebaseapp.com",
  databaseURL: "https://caps-laundry-services-default-rtdb.firebaseio.com",
  projectId: "caps-laundry-services",
  storageBucket: "caps-laundry-services.appspot.com",
  messagingSenderId: "795365295115",
  appId: "1:795365295115:web:4a269fd2c38cf2d38eb30e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const addServiceBtn = document.getElementById("add-service-btn");
const cancelBtn = document.getElementById("cancel-service-modal");
const modal = document.getElementById("add-service-modal");
const serviceForm = document.getElementById("service-form");
const serviceTableBody = document.getElementById("services-table-body");
const totalServicesEl = document.getElementById("total-services");
const highestRateEl = document.getElementById("highest-rate");
const lowestRateEl = document.getElementById("lowest-rate");
const editServiceBtn = document.getElementById("edit-service-btn");

// Show modal
addServiceBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Hide modal
cancelBtn.addEventListener("click", () => {
  modal.style.display = "none";
  serviceForm.reset();
  document.getElementById("service-id").value = "";
});

// Show toast
function showToast(icon, message) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  });
}

// Add or Update Service
serviceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("service-id").value;
  const name = document.getElementById("service-name").value.trim();
  const price = parseFloat(document.getElementById("service-price").value);
  const unit = document.getElementById("service-unit").value;
  const date = new Date().toISOString().split("T")[0];

  if (!name || isNaN(price)) return;

  try {
    if (id) {
      // Update existing
      await set(ref(db, `services/${id}`), {
        id: Number(id),
        name,
        price,
        unit,
        dateAdded: `${date} (updated)`
      });
      showToast("success", "Service updated successfully");
    } else {
      // Add new
      const servicesRef = ref(db, "services");
      const snapshot = await get(servicesRef);
      const services = snapshot.exists() ? snapshot.val() : {};
      const nextId = Object.keys(services).length + 1;

      await set(ref(db, `services/${nextId}`), {
        id: nextId,
        name,
        price,
        unit,
        dateAdded: date
      });
      showToast("success", "Service added successfully");
    }

    modal.style.display = "none";
    serviceForm.reset();
    document.getElementById("service-id").value = "";
  } catch (error) {
    console.error("Error saving service:", error);
    showToast("error", "Error saving service");
  }
});

// Render service table
function renderServices() {
  const servicesRef = ref(db, "services");
  onValue(servicesRef, (snapshot) => {
    serviceTableBody.innerHTML = "";

    let highest = { price: -Infinity, name: "" };
    let lowest = { price: Infinity, name: "" };
    let count = 0;

    if (snapshot.exists()) {
      const data = snapshot.val();

      Object.values(data).forEach(service => {
        count++;

        if (service.price > highest.price) highest = { price: service.price, name: service.name };
        if (service.price < lowest.price) lowest = { price: service.price, name: service.name };

        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="checkbox" /></td>
          <td>${service.id}</td>
          <td>${service.name}</td>
          <td>₱${service.price}</td>
          <td>${service.unit}</td>
          <td>${service.dateAdded}</td>
        `;
        serviceTableBody.appendChild(row);
      });
    }

    totalServicesEl.textContent = count;
    highestRateEl.textContent = `₱${highest.price} (${highest.name})`;
    lowestRateEl.textContent = `₱${lowest.price} (${lowest.name})`;
  });
}

// Edit service
editServiceBtn.addEventListener("click", () => {
  const checked = serviceTableBody.querySelector("input[type=checkbox]:checked");
  if (!checked) {
    return showToast("warning", "Please select a service to edit.");
  }

  const row = checked.closest("tr");

  document.getElementById("service-id").value = row.children[1].textContent;
  document.getElementById("service-name").value = row.children[2].textContent;
  document.getElementById("service-price").value = row.children[3].textContent.replace("₱", "");
  document.getElementById("service-unit").value = row.children[4].textContent;

  modal.style.display = "flex";
});

// Initial load
renderServices();
