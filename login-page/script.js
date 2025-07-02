// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child } from "firebase/database";

// Your web app's Firebase configuration
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
const database = getDatabase(app);

// ✅ Admin login function
export function adminLogin() {
  const usernameInput = document.getElementById("logEmail");
  const passwordInput = document.getElementById("logPassword");

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  const dbRef = ref(database);

  get(child(dbRef, "admins")).then((snapshot) => {
    if (snapshot.exists()) {
      let loginSuccess = false;

      snapshot.forEach((childSnapshot) => {
        const admin = childSnapshot.val();
        if (admin.username === username && admin.password === password) {
          loginSuccess = true;
        }
      });

      if (loginSuccess) {
        alert("Login successful!");
        window.location.href = "dashboard/index.html"; // Redirect to dashboard
      } else {
        alert("Invalid username or password.");
      }
    } else {
      alert("No admin records found.");
    }
  }).catch((error) => {
    console.error("Error reading from database:", error);
    alert("Login failed due to a system error.");
  });
}
