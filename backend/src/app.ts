import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { env } from "./config/env";

import authRoutes from "./modules/auth/authRoutes";
import subjectRoutes from "./modules/subjects/subjectRoutes";
import videoRoutes from "./modules/videos/videoRoutes";
import progressRoutes from "./modules/progress/progressRoutes";
import adminRoutes from "./modules/admin/adminRoutes";
import enrollmentRoutes from "./modules/enrollments/enrollmentRoutes";
import reviewRoutes from "./modules/reviews/reviewRoutes";
import profileRoutes from "./modules/profile/profileRoutes";
import noteRoutes from "./modules/notes/noteRoutes";
import userRoutes from "./modules/users/userRoutes";
import certificateRoutes from "./modules/certificates/certificateRoutes";
import recommendationRoutes from "./modules/recommendations/recommendationRoutes";
import streakRoutes from "./modules/streak/streakRoutes";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api", enrollmentRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export default app;
