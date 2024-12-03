// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Thay thế bằng thông tin cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyB8SoVXpQezm9oVtmnDkuxwWVEG7dwlvfY",
  authDomain: "kenh14-data-visualization.firebaseapp.com",
  databaseURL:
    "https://kenh14-data-visualization-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kenh14-data-visualization",
  storageBucket: "kenh14-data-visualization.firebasestorage.app",
  messagingSenderId: "777255507453",
  appId: "1:777255507453:web:6fb944f55856b45c30f594",
};

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo cơ sở dữ liệu Realtime Database
const database = getDatabase(app);

export default database;
