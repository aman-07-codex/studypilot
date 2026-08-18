import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dashboardRouter from "./src/server/routes/dashboardRoutes";
import subjectRouter from "./src/server/routes/subjectRoutes";
import { subjectTopicsRouter, topicRouter } from "./src/server/routes/topicRoutes";
import examRouter from "./src/server/routes/examRoutes";
import studyPlanRouter from "./src/server/routes/studyPlanRoutes";
import studySessionRouter from "./src/server/routes/studySessionRoutes";
import profileRouter from "./src/server/routes/profileRoutes";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes
  const apiRouter = express.Router();
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  apiRouter.use("/dashboard", dashboardRouter);
  apiRouter.use("/subjects", subjectRouter);
  apiRouter.use("/subjects/:subjectId/topics", subjectTopicsRouter);
  apiRouter.use("/topics", topicRouter);
  apiRouter.use("/exams", examRouter);
  apiRouter.use("/study-plans", studyPlanRouter);
  apiRouter.use("/study-sessions", studySessionRouter);
  apiRouter.use("/profile", profileRouter);

  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
