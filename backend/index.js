// backend/index.js
const crawlKenh14 = require("./crawler");
const cron = require("node-cron");

// Chạy ngay khi khởi động
crawlKenh14();

// Lập lịch chạy mỗi 5 phút
cron.schedule("*/5 * * * *", () => {
  console.log("Bắt đầu cào dữ liệu (mỗi 5 phút)...");
  crawlKenh14();
});
