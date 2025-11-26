const mongoose = require("mongoose");

const WishlistItemSchema = new mongoose.Schema(
  {
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: ["listing"/*, "experience", services*/],
      required: true,
    },
  },
  { _id: false }
);

const FolderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    items: [WishlistItemSchema],
  },
  { _id: true }
);

const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    folders: [FolderSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wishlist", WishlistSchema);