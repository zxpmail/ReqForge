import express from "express";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/health", healthRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`{{projectName}} running on http://localhost:${PORT}`);
});

export default app;
