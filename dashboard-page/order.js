import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, runTransaction, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';

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

// Modal Handling
const addOrderBtn = document.getElementById("add-order-btn");
const modal = document.getElementById("orderModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const ordersTableBody = document.getElementById("ordersTableBody");

addOrderBtn.addEventListener("click", async () => {
  modal.style.display = "flex";
  document.getElementById("order-form").reset();
  document.getElementById("paymentFields").style.display = "none";
  document.getElementById("gcashReceivedRow").style.display = "none";

  const counterRef = ref(db, 'orderCounter');
  const snapshot = await get(counterRef);
  let orderNumber = 1;
  if (snapshot.exists()) {
    orderNumber = snapshot.val();
    const ordersRef = ref(db, 'order');
    const ordersSnapshot = await get(ordersRef);
    if (ordersSnapshot.exists()) {
      const ids = Object.values(ordersSnapshot.val()).map(o => o.orderId);
      if (ids.length > 0) {
        const max = Math.max(...ids);
        orderNumber = max + 1;
      }
    }
  }
  document.getElementById("orderIdDisplay").value = orderNumber;
});

closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Payment Handling
document.getElementById("payNow").addEventListener("change", () => {
  document.getElementById("paymentFields").style.display = "block";
});

document.getElementById("payLater").addEventListener("change", () => {
  document.getElementById("paymentFields").style.display = "none";
  document.getElementById("gcashReceivedRow").style.display = "none";
});

document.getElementById("gcash").addEventListener("change", () => {
  document.getElementById("gcashReceivedRow").style.display = "block";
});

document.getElementById("cash").addEventListener("change", () => {
  document.getElementById("gcashReceivedRow").style.display = "none";
});

// Populate Services
const serviceSelect = document.getElementById("service");
onValue(ref(db, 'services'), snapshot => {
  serviceSelect.innerHTML = '<option value="">Select Service</option>';
  snapshot.forEach(childSnap => {
    const service = childSnap.val();
    const option = document.createElement("option");
    option.value = JSON.stringify(service);
    option.textContent = `${service.name} (₱${service.price})`;
    serviceSelect.appendChild(option);
  });
});

serviceSelect.addEventListener("change", () => {
  const selected = JSON.parse(serviceSelect.value);
  document.getElementById("serviceAmount").value = selected.price || 0;
  calculateProductTotal();
});

// Populate Products
const productSelects = ["product1", "product2", "product3"];
productSelects.forEach(id => {
  const select = document.getElementById(id);
  onValue(ref(db, 'inventory'), snapshot => {
    select.innerHTML = '<option value="">None</option>';
    snapshot.forEach(childSnap => {
      const product = childSnap.val();
      const option = document.createElement("option");
      option.value = JSON.stringify(product);
      option.textContent = `${product.name} (${product.type}) - ₱${product.price}`;
      select.appendChild(option);
    });
  });
});

function calculateProductTotal() {
  let total = 0;
  productSelects.forEach(id => {
    const val = document.getElementById(id).value;
    if (val) total += JSON.parse(val).price || 0;
  });
  const serviceAmount = parseFloat(document.getElementById("serviceAmount").value || 0);
  document.getElementById("productAmount").value = total;
  document.getElementById("totalAmount").value = total + serviceAmount;
}

productSelects.forEach(id => {
  document.getElementById(id).addEventListener("change", calculateProductTotal);
});

document.getElementById("cashReceived").addEventListener("input", () => {
  const cash = parseFloat(document.getElementById("cashReceived").value || 0);
  const total = parseFloat(document.getElementById("totalAmount").value || 0);
  document.getElementById("customerChange").value = cash - total;
});

// Submit New Order
document.getElementById("order-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const orderId = parseInt(document.getElementById("orderIdDisplay").value);
  const ordersRef = ref(db, 'order/' + orderId);

  const orderData = {
    orderId,
    customerName: document.getElementById("customerName").value,
    dateReceived: document.getElementById("dateReceived").value,
    receivedBy: document.getElementById("receivedBy").value,
    typeOfService: JSON.parse(document.getElementById("service").value).name,
    weight: document.getElementById("weight").value,
    serviceAmount: document.getElementById("serviceAmount").value,
    product1: JSON.parse(document.getElementById("product1").value || null)?.name || "None",
    product2: JSON.parse(document.getElementById("product2").value || null)?.name || "None",
    product3: JSON.parse(document.getElementById("product3").value || null)?.name || "None",
    productAmount: document.getElementById("productAmount").value,
    totalAmount: document.getElementById("totalAmount").value,
    paymentStatus: document.querySelector('input[name="paymentStatus"]:checked').value,
    paymentMethod: document.querySelector('input[name="paymentMethod"]:checked')?.value || "N/A",
    paymentReceivedBy: document.getElementById("paymentReceivedBy").value || "N/A",
    cashReceived: document.getElementById("cashReceived").value,
    customerChange: document.getElementById("customerChange").value,
    dateClaimed: document.getElementById("dateClaimed")?.value || "Not claimed yet",
    orderPublishedBy: document.getElementById("orderPublishedBy").value,
    processStart: document.getElementById("processStart")?.value || "",
    processEnd: document.getElementById("processEnd")?.value || "",
    note: document.getElementById("note")?.value || "",
    claimedBy: document.getElementById("claimedBy")?.value || ""
  };

  await set(ordersRef, orderData);

  // deduct stocks after saving order
    const orderedProducts = [orderData.product1, orderData.product2, orderData.product3]
    .filter(p => p && p !== "None");

    orderedProducts.forEach(prodName => {
    const inventoryQuery = ref(db, 'inventory');
    onValue(inventoryQuery, snapshot => {
        if (snapshot.exists()) {
        const inventoryData = snapshot.val();
        Object.entries(inventoryData).forEach(([key, item]) => {
            if (item.name.toLowerCase() === prodName.toLowerCase()) {
            const updatedStock = parseInt(item.stocks) - 1;
            update(ref(db, `inventory/${key}`), {
                ...item,
                stocks: updatedStock >= 0 ? updatedStock : 0
            });
            }
        });
        }
    }, { onlyOnce: true });
    });

  Swal.fire({
    icon: 'success',
    title: 'Order Saved',
    text: 'Order has been successfully saved.',
    timer: 1500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });

  modal.style.display = "none";
});

// Load Orders Table and Counters
function loadOrders() {
  const ordersRef = ref(db, 'order');
  onValue(ordersRef, (snapshot) => {
    ordersTableBody.innerHTML = "";

    let totalOrders = 0;
    let completedOrders = 0;
    let notPaidOrders = 0;

    snapshot.forEach(child => {
      const order = child.val();
      totalOrders++;
      if (order.paymentStatus === "Completed") completedOrders++;
      else if (order.paymentStatus === "Not Paid") notPaidOrders++;

      const row = document.createElement("tr");
      const productList = [order.product1, order.product2, order.product3].filter(p => p && p !== "None").join(", ");
      const statusClass = order.paymentStatus === 'Completed' ? 'completed' : 'pending';

      row.innerHTML = `
        <td><input type="checkbox" class="rowCheckbox" /></td>
        <td>${order.orderId || "-"}</td>
        <td>${order.customerName || "-"}</td>
        <td>${order.dateReceived || "-"}</td>
        <td>${order.receivedBy || "-"}</td>
        <td>${order.typeOfService || "-"}</td>
        <td>${order.weight || "-"}</td>
        <td>₱${order.serviceAmount || "0"}</td>
        <td>${productList || "None"}</td>
        <td>₱${order.productAmount || "0"}</td>
        <td>₱${order.totalAmount || "0"}</td>
        <td><span class="status ${statusClass}">${order.paymentStatus}</span></td>
        <td>${order.paymentMethod || "N/A"}</td>
        <td>${order.paymentReceivedBy || "-"}</td>
        <td>${order.dateClaimed || "-"}</td>
        <td>${order.orderPublishedBy || "-"}</td>
        <td>${order.processStart || "-"}</td>
        <td>${order.processEnd || "-"}</td>
        <td>${order.note || "-"}</td>
        <td>${order.claimedBy || "-"}</td>
      `;
      ordersTableBody.appendChild(row);
    });

    document.getElementById("totalOrders").textContent = totalOrders;
    document.getElementById("notPaidOrders").textContent = notPaidOrders;
    document.getElementById("completedOrders").textContent = completedOrders;
  });
}

loadOrders();

// Edit Order Logic
const editBtn = document.getElementById("edit-stock-btn");
const editModal = document.getElementById("editOrderModal");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");

editBtn.addEventListener("click", async () => {
  const selectedCheckbox = document.querySelector(".rowCheckbox:checked");
  if (!selectedCheckbox) {
    return Swal.fire({
      icon: 'warning',
      title: 'No selection',
      text: 'Please select an order to edit.',
      toast: true,
      timer: 1500,
      showConfirmButton: false,
      position: 'top-end'
    });
  }

  const selectedRow = selectedCheckbox.closest("tr");
  const orderId = parseInt(selectedRow.cells[1].textContent);
  const snapshot = await get(ref(db, 'order/' + orderId));
  if (!snapshot.exists()) {
    return Swal.fire({
      icon: 'error',
      title: 'Order not found',
      text: 'The selected order could not be found in the database.'
    });
  }

  const order = snapshot.val();

  // Fill modal fields
  document.getElementById("editOrderId").value = order.orderId;
  document.getElementById("editCustomerName").value = order.customerName;
  document.getElementById("editDateReceived").value = order.dateReceived;
  document.getElementById("editReceivedBy").value = order.receivedBy;
  document.getElementById("editServiceType").value = order.typeOfService;
  document.getElementById("editWeight").value = order.weight;
  document.getElementById("editServiceAmount").value = order.serviceAmount;
  document.getElementById("editProducts").value = [order.product1, order.product2, order.product3].filter(p => p && p !== "None").join(", ");
  document.getElementById("editProductAmount").value = order.productAmount;
  document.getElementById("editTotalAmount").value = order.totalAmount;
  document.getElementById("editPaymentStatus").value = order.paymentStatus;
  document.getElementById("editPaymentMethod").value = order.paymentMethod;
  document.getElementById("editPaymentReceivedBy").value = order.paymentReceivedBy || "";
  document.getElementById("editCashReceived").value = order.cashReceived || "";
  document.getElementById("editCustomerChange").value = order.customerChange || "";
  document.getElementById("editProcessStart").value = order.processStart || "";
  document.getElementById("editProcessEnd").value = order.processEnd || "";
  document.getElementById("editNote").value = order.note || "";
  document.getElementById("editDateClaimed").value = order.dateClaimed !== "Not claimed yet" ? order.dateClaimed : "";
  document.getElementById("editClaimedBy").value = order.claimedBy || "";
  document.getElementById("editOrderPublishedBy").value = order.orderPublishedBy;

  editModal.classList.add("show");
});

closeEditModalBtn.addEventListener("click", () => {
  editModal.classList.remove("show");
});

window.addEventListener("click", (event) => {
  if (event.target === editModal) {
    editModal.classList.remove("show");
  }
});

// Submit Edit Form
document.getElementById("edit-order-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const orderId = parseInt(document.getElementById("editOrderId").value);
  const updatedOrder = {
    orderId,
    customerName: document.getElementById("editCustomerName").value,
    dateReceived: document.getElementById("editDateReceived").value,
    receivedBy: document.getElementById("editReceivedBy").value,
    typeOfService: document.getElementById("editServiceType").value,
    weight: document.getElementById("editWeight").value,
    serviceAmount: document.getElementById("editServiceAmount").value,
    product1: document.getElementById("editProducts").value.split(",")[0]?.trim() || "None",
    product2: document.getElementById("editProducts").value.split(",")[1]?.trim() || "None",
    product3: document.getElementById("editProducts").value.split(",")[2]?.trim() || "None",
    productAmount: document.getElementById("editProductAmount").value,
    totalAmount: document.getElementById("editTotalAmount").value,
    paymentStatus: document.getElementById("editPaymentStatus").value,
    paymentMethod: document.getElementById("editPaymentMethod").value,
    paymentReceivedBy: document.getElementById("editPaymentReceivedBy").value,
    cashReceived: document.getElementById("editCashReceived").value,
    customerChange: document.getElementById("editCustomerChange").value,
    processStart: document.getElementById("editProcessStart").value,
    processEnd: document.getElementById("editProcessEnd").value,
    note: document.getElementById("editNote").value,
    dateClaimed: document.getElementById("editDateClaimed").value || "Not claimed yet",
    claimedBy: document.getElementById("editClaimedBy").value,
    orderPublishedBy: document.getElementById("editOrderPublishedBy").value
  };

  try {
    await update(ref(db, 'order/' + orderId), updatedOrder);

    Swal.fire({
      icon: 'success',
      title: 'Order Updated',
      text: 'Order has been successfully updated.',
      toast: true,
      timer: 1500,
      position: 'top-end',
      showConfirmButton: false
    });

    editModal.classList.remove("show");
    loadOrders();
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: 'An error occurred while updating the order.'
    });
  }
});
