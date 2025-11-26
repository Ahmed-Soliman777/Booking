const express = require("express");
const router = express.Router();
const { 
  getWishlist,
  createFolder,
  addItemToFolder,
  removeItemFromFolder,
  deleteFolder
} = require("../controllers/wishlist.controller");

const auth = require("../middleware/auth");

router.get("/", auth, getWishlist);
router.post("/folder", auth, createFolder);
router.post("/folder/:folderId/item", auth, addItemToFolder);
router.delete("/folder/:folderId/item/:itemId", auth, removeItemFromFolder);
router.delete("/folder/:folderId", auth, deleteFolder);

module.exports = router;
