import mongoose from "mongoose";

const goalFieldSchema = new mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed
});

const goalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    contributedAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true },

    templateType: {
      type: String,
      enum: ["grocery", "rent", "personal", "vacation", "tuition"],
      default: null
    },

    fields: [goalFieldSchema]
  },
  { timestamps: true }
);

export const Goal = mongoose.model("Goal", goalSchema);
