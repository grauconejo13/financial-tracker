import express from "express";
import { Template } from "../models/Template.model";

const router = express.Router();

// CREATE
router.post("/", async (req, res) => {
  const template = await Template.create(req.body);
  res.json(template);
});

// READ
router.get("/", async (_req, res) => {
  const templates = await Template.find();
  res.json(templates);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const updated = await Template.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
