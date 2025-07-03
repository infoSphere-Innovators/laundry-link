import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, child, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const dbRef = ref(db);

// DOM elements
const modal = document.getElementById("stock-modal");
const form = document.getElementById("stock-form");
const isNewCheckbox = document.getElementById("is-new-stock");
const idField = document.getElementById("stock-id");
const nameField = document.getElementById("stock-name");
const typeField = document.getElementById("stock-type");
const amountField = document.getElementById("stock-amount");
const priceField = document.getElementById("stock-price");
const dateField = document.getElementById("stock-date");

let latestId = 0;
let inventoryData = {};

function fetchInventory() {
	onValue(ref(db, 'inventory'), snapshot => {
		const tableBody = document.getElementById("inventory-table-body");
		if (tableBody) tableBody.innerHTML = "";

		inventoryData = snapshot.exists() ? snapshot.val() : {};

		Object.keys(inventoryData).forEach(id => {
			const item = inventoryData[id];
			latestId = Math.max(latestId, parseInt(id));
			if (tableBody) {
				tableBody.innerHTML += `
                <tr>
                    <td><input type="checkbox" class="inventory-checkbox" data-id="${id}" /></td>
                    <td>${id}</td>
                    <td>${item.name}</td>
                    <td>${item.type}</td>
                    <td>${item.stocks}</td>
                    <td>₱${item.price ?? "0.00"}</td>
                    <td>${item.date}</td>
                </tr>`;
			}
		});

		updateInventoryStats();
	});
}

function updateInventoryStats() {
	let totalStocks = 0;
	let lowStockItems = [];
	let itemCount = 0;

	Object.values(inventoryData).forEach(item => {
		const stock = parseInt(item.stocks);
		totalStocks += stock;
		if (stock <= 10) lowStockItems.push(item.name);
		itemCount++;
	});

	document.getElementById("available-items").textContent = totalStocks;
	document.getElementById("low-stock-count").textContent = lowStockItems.length;
	document.getElementById("low-stock-names").textContent = lowStockItems.join(", ") || "-";
	document.getElementById("total-items").textContent = itemCount;
}

document.getElementById("add-stock-btn")?.addEventListener("click", () => {
	modal.style.display = "flex";
	dateField.valueAsDate = new Date();
	updateForm();
});

document.getElementById("delete-stock-btn")?.addEventListener("click", async () => {
  const checked = document.querySelectorAll(".inventory-checkbox:checked");
  if (checked.length === 0) {
    showToast("error", "Please select at least one item to delete.");
    return;
  }

  Swal.fire({
    title: `Are you sure?`,
    text: `This will permanently delete ${checked.length} item(s) from your inventory.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel"
  }).then(async (result) => {
    if (result.isConfirmed) {
      // delete each selected item
      for (const checkbox of checked) {
        const itemId = checkbox.dataset.id;
        await set(ref(db, `inventory/${itemId}`), null);
      }
      showToast("success", "Selected item(s) deleted.");
      fetchInventory();
    }
  });
});


function closeModal() {
	modal.style.display = "none";
	form.reset();
	nameField.disabled = false;

	// Remove dropdown if exists
	const dropdown = document.getElementById("existing-stock-select");
	if (dropdown) {
		dropdown.remove();
		nameField.style.display = "block";
	}
}

document.getElementById("close-stock-btn").addEventListener("click", closeModal);

isNewCheckbox.addEventListener("change", updateForm);

function updateForm() {
	if (isNewCheckbox.checked) {
		idField.value = latestId + 1;
		nameField.disabled = false;
		nameField.style.display = "block";
		const dropdown = document.getElementById("existing-stock-select");
		if (dropdown) dropdown.remove();
	} else {
		// Replace name input with dropdown
		const dropdown = document.createElement("select");
		dropdown.id = "existing-stock-select";
		dropdown.required = true;
		dropdown.style.width = "100%";
		dropdown.style.marginTop = "5px";

		dropdown.innerHTML = '<option value="">-- Select Existing Name --</option>';
		Object.entries(inventoryData).forEach(([key, item]) => {
			const opt = document.createElement("option");
			opt.value = key;
			opt.text = item.name;
			dropdown.appendChild(opt);
		});

		dropdown.addEventListener("change", function () {
			const selected = inventoryData[this.value];
			if (selected) {
				idField.value = this.value;
				nameField.value = selected.name;
				typeField.value = selected.type;
                priceField.value = selected.price || "";
			}
		});

		nameField.style.display = "none";
		nameField.insertAdjacentElement("afterend", dropdown);
	}
}

form.addEventListener("submit", async function (e) {
	e.preventDefault();

	const name = nameField.value.trim();
	const type = typeField.value;
	const stocks = parseInt(amountField.value);
	const date = dateField.value;
    const price = parseFloat(priceField.value);

	if (!type || !stocks || !date || isNaN(price) || price < 0 || (!isNewCheckbox.checked && !document.getElementById("existing-stock-select")?.value)) {
        showToast('error', 'Please complete all required fields.');
        return;
    }


	if (isNewCheckbox.checked) {
		// Check if name + type already exists
		let foundKey = null;
		Object.entries(inventoryData).forEach(([key, item]) => {
			if (item.name.toLowerCase() === name.toLowerCase() && item.type === type) {
				foundKey = key;
			}
		});

		if (foundKey) {
			// Update existing
			const existing = inventoryData[foundKey];
			const newStock = parseInt(existing.stocks) + stocks;
			await set(ref(db, `inventory/${foundKey}`), {
				...existing,
				stocks: newStock,
				date,
                price
			});
			showToast('success', 'Stock updated (duplicate found)');
		} else {
			// Create new entry
			const newId = latestId + 1;
			await set(ref(db, `inventory/${newId}`), {
				name,
				type,
				stocks,
				date,
                price
			});
			latestId++;
			showToast('success', 'New stock added');
		}
	} else {
		const selectedKey = document.getElementById("existing-stock-select")?.value;
		if (!selectedKey || !inventoryData[selectedKey]) {
			showToast('error', 'Invalid stock selection.');
			return;
		}

		const existing = inventoryData[selectedKey];
		const newStock = parseInt(existing.stocks) + stocks;
		await set(ref(db, `inventory/${selectedKey}`), {
			...existing,
			stocks: newStock,
			date,
            price
		});
		showToast('success', 'Stock successfully updated');
	}

	closeModal();
});

function showToast(icon, message) {
	const toast = document.createElement('div');
	toast.className = `custom-toast ${icon}`;
	toast.textContent = message;
	document.body.appendChild(toast);
	setTimeout(() => toast.classList.add('visible'), 100);
	setTimeout(() => {
		toast.classList.remove('visible');
		setTimeout(() => toast.remove(), 500);
	}, 3000);
}

// Initial fetch
fetchInventory();