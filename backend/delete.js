const db = require("./firebase");

// Xóa toàn bộ node "articles"
db.ref("articles")
  .remove()
  .then(() => console.log("Xóa thành công"))
  .catch((error) => console.error("Lỗi khi xóa:", error));
