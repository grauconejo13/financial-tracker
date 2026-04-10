import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import { corsMiddleware } from "./config/corsOptions";
import { errorHandler } from "./middleware/error.middleware";
import transactionRoutes from "./routes/transaction.routes";
import debtRoutes from "./routes/debt.routes";
import authRoutes from "./routes/auth.routes";
import incomeRoutes from "./routes/income.routes";
import expenseRoutes from "./routes/expense.routes";
import userRoutes from "./routes/user.routes";
import goalRoutes from "./routes/goal.routes";
import savingsRoutes from "./routes/savings.routes";
import categoryRoutes from "./routes/admin.category.routes";
import adminTemplateRoutes from "./routes/admin.template.routes";
import adminStatsRoutes from "./routes/admin.stats.routes";
import accountabilityRoutes from "./routes/accountability.routes";
import templateRoutes from "./routes/template.routes";
import semesterRoutes from "./routes/semester.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import ghostRoutes from "./routes/ghost.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();

app.use(corsMiddleware);
/** Profile updates can include base64 avatars; default ~100kb is too small */
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.send("ClearPath API is running");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/semester", semesterRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/accountability", accountabilityRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/user", userRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/templates", adminTemplateRoutes);
app.use("/api/admin/stats", adminStatsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ghost", ghostRoutes);

app.use(errorHandler);

export default app;
