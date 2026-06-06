import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    project: "{{projectName}}",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
