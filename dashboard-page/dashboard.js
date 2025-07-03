import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
	getDatabase,
	ref,
	onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
	apiKey: "AIzaSyBRCf1vmmQqMg_8O9tCKefWs3P_9Z__T-M",
	authDomain: "caps-laundry-services.firebaseapp.com",
	databaseURL: "https://caps-laundry-services-default-rtdb.firebaseio.com",
	projectId: "caps-laundry-services",
	storageBucket: "caps-laundry-services.appspot.com",
	messagingSenderId: "795365295115",
	appId: "1:795365295115:web:4a269fd2c38cf2d38eb30e"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Elements
const orderCountEl = document.getElementById("order-count");
const inventoryCountEl = document.getElementById("inventory-count");
const salesAmountEl = document.getElementById("sales-amount"); // Already set
const staffTableBody = document.getElementById("active-staff-table-body");

// Fetch Order Count
onValue(ref(db, "orders"), (snapshot) => {
	const data = snapshot.exists() ? snapshot.val() : {};
	orderCountEl.textContent = Object.keys(data).length;
});

// Fetch Inventory Count
onValue(ref(db, "inventory"), (snapshot) => {
	const data = snapshot.exists() ? snapshot.val() : {};
	inventoryCountEl.textContent = Object.keys(data).length;
});

// Fetch Active Staffs
onValue(ref(db, "staffs"), (snapshot) => {
	staffTableBody.innerHTML = "";

	if (!snapshot.exists()) {
		staffTableBody.innerHTML = `<tr><td colspan="3">There is no active staff.</td></tr>`;
		return;
	}

	let hasActive = false;
	const data = snapshot.val();

	Object.values(data).forEach(staff => {
		if (staff.status && staff.status.toLowerCase() === "active") {
			hasActive = true;
			const row = document.createElement("tr");
			row.innerHTML = `
				<td><img src="img/people.png"><p>${staff.fullName || "-"}</p></td>
				<td><span class="status completed">Active</span></td>
			`;
			staffTableBody.appendChild(row);
		}
	});

	if (!hasActive) {
		staffTableBody.innerHTML = `<tr><td colspan="3">There is no active staff.</td></tr>`;
	}
});