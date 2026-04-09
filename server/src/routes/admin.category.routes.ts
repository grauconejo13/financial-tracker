import express from "express";
import { Category } from "../models/Category.model";

const router = express.Router();

// CREATE
router.post("/", async (req, res) => {
  const category = await Category.create(req.body);
  res.json(category);
});

// READ
router.get("/", async (_req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const updated = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
