import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const db = getDatabase();
const staffTableBody = document.getElementById("staff-table-body");
const totalStaffElem = document.getElementById("total-staff");
const activeStaffElem = document.getElementById("active-staff");
const inactiveStaffElem = document.getElementById("inactive-staff");

// Load staff data in real-time
onValue(ref(db, 'staffs'), (snapshot) => {
  staffTableBody.innerHTML = "";

  let total = 0;
  let active = 0;
  let inactive = 0;

  snapshot.forEach(child => {
    const staffID = child.key;
    const data = child.val();

    total++;
    if (data.status === "active") active++;
    else inactive++;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" /></td>
      <td>${staffID}</td>
      <td>${data.fullName || "-"}</td>
      <td>${data.contact || "-"}</td>
      <td>${data.dateRegistered || "-"}</td>
      <td>
        <span class="status ${data.status === 'active' ? 'completed' : 'pending'}">
          ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
        </span>
      </td>
    `;

    staffTableBody.appendChild(row);
  });

  // Update counts
  totalStaffElem.textContent = total;
  activeStaffElem.textContent = active;
  inactiveStaffElem.textContent = inactive;
});

const deleteBtn = document.getElementById("delete-staff");

deleteBtn.addEventListener("click", () => {
  const checked = document.querySelectorAll("#staff-table-body input[type=checkbox]:checked");
  if (checked.length !== 1) {
    Swal.fire({
      icon: "warning",
      title: "Select one staff",
      text: "Please select exactly one staff to delete."
    });
    return;
  }

  const row = checked[0].closest("tr");
  const staffID = row.cells[1].textContent;

  Swal.fire({
    icon: "warning",
    title: "Are you sure?",
    text: `Do you really want to delete Staff ID ${staffID}?`,
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel"
  }).then((result) => {
    if (result.isConfirmed) {
      const db = getDatabase();
      remove(ref(db, `staffs/${staffID}`))
        .then(() => {
          Swal.fire("Deleted!", "The staff has been removed.", "success");
        })
        .catch((err) => {
          console.error(err);
          Swal.fire("Error", "Failed to delete staff.", "error");
        });
    }
  });
});