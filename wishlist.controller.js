const Wishlist = require("../models/Wishlist.model");
const Listing = require("../models/Listing.model");
const Experience = require("../models/Experience.model");

// ---- Helper: ensure wishlist exists ----
async function ensureWishlist(userId) {
  let wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      folders: []
    });
  }

  return wishlist;
}

// ------------------------------------------------------------
// GET WISHLIST
// ------------------------------------------------------------
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await ensureWishlist(req.user.id);
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// CREATE FOLDER
// ------------------------------------------------------------
exports.createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    const wishlist = await ensureWishlist(req.user.id);

    wishlist.folders.push({ name, items: [] });
    await wishlist.save();

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// ADD ITEM TO FOLDER
// ------------------------------------------------------------
exports.addItemToFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { refId, type } = req.body; // listing or experience

    if (!["listing", "experience"].includes(type)) {
      return res.status(400).json({ error: "Invalid item type" });
    }

    // Validate existence of the item before adding
    let exists = null;

    if (type === "listing") {
      exists = await Listing.findById(refId);
    } else {
      exists = await Experience.findById(refId);
    }

    if (!exists) {
      return res.status(404).json({ error: "Item not found" });
    }

    const wishlist = await ensureWishlist(req.user.id);
    const folder = wishlist.folders.id(folderId);

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    // Prevent duplicates
    const alreadyAdded = folder.items.some(
      item => item.refId.toString() === refId && item.type === type
    );

    if (alreadyAdded) {
      return res.status(400).json({ error: "Item already in folder" });
    }

    folder.items.push({ refId, type });
    await wishlist.save();

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// REMOVE ITEM FROM FOLDER
// ------------------------------------------------------------
exports.removeItemFromFolder = async (req, res) => {
  try {
    const { folderId, itemId } = req.params; // itemId = refId

    const wishlist = await ensureWishlist(req.user.id);
    const folder = wishlist.folders.id(folderId);

    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }

    folder.items = folder.items.filter(
      (item) => item.refId.toString() !== itemId
    );

    await wishlist.save();

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------------------------------------------------
// DELETE FOLDER
// ------------------------------------------------------------
exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const wishlist = await ensureWishlist(req.user.id);

    wishlist.folders = wishlist.folders.filter(
      (folder) => folder._id.toString() !== folderId
    );

    await wishlist.save();

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
