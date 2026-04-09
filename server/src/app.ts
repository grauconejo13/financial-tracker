import express from "express";
import cors from "cors";
import morgan from "morgan";
import bodyParser from "body-parser";
import { errorHandler } from "./middleware/error.middleware";
import transactionRoutes from "./routes/transaction.routes";
import debtRoutes from "./routes/debt.routes";
import authRoutes from "./routes/auth.routes";
import incomeRoutes from "./routes/income.routes";
import expenseRoutes from "./routes/expense.routes";
import userRoutes from "./routes/user.routes";
import templateRoutes from "./routes/template.routes";
import goalRoutes from "./routes/goal.routes";
import savingsRoutes from "./routes/savings.routes";
import categoryRoutes from "./routes/admin.category.routes";
import adminTemplateRoutes from "./routes/admin.template.routes";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://financial-tracker-kappa-wine.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.options("*", cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.send("ClearPath API is running");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/templates", adminTemplateRoutes);

app.use(errorHandler);

export default app;
