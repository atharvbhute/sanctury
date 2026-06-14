import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import prisma from "./src/prisma/client.js";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth Middleware
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name?: string };
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };

  // Profile API
  app.get("/api/profile", authMiddleware, async (req: any, res) => {
    try {
      const email = req.user.email.toLowerCase().trim();
      let profile = await prisma.userProfile.findUnique({
        where: { email },
      });
      if (!profile) {
        profile = await prisma.userProfile.create({
          data: {
            email,
            displayName: req.user.name || email.split("@")[0],
            glowColor: "rgba(255, 193, 7, 0.5)",
            hasMapAccess: true,
            isAdmin: false,
          },
        });
      }
      res.json({ data: profile });
    } catch (err: any) {
      console.error("GET /api/profile error:", err);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.put("/api/profile", authMiddleware, async (req: any, res) => {
    try {
      const email = req.user.email.toLowerCase().trim();
      const { displayName, photoURL, glowColor } = req.body;
      const updated = await prisma.userProfile.upsert({
        where: { email },
        update: {
          ...(displayName !== undefined && { displayName }),
          ...(photoURL !== undefined && { photoURL }),
          ...(glowColor !== undefined && { glowColor }),
        },
        create: {
          email,
          displayName: displayName || email.split("@")[0],
          photoURL,
          glowColor: glowColor || "rgba(255, 193, 7, 0.5)",
          hasMapAccess: true,
        },
      });
      res.json({ data: updated });
    } catch (err: any) {
      console.error("PUT /api/profile error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Journals API
  app.get("/api/journals", authMiddleware, async (req: any, res) => {
    try {
      const email = req.user.email.toLowerCase().trim();
      const journals = await prisma.journal.findMany({
        where: { userEmail: email },
        orderBy: { createdAt: "desc" },
      });
      res.json({ data: journals });
    } catch (err: any) {
      console.error("GET /api/journals error:", err);
      res.status(500).json({ message: "Failed to fetch journals" });
    }
  });

  app.post("/api/journals", authMiddleware, async (req: any, res) => {
    try {
      const email = req.user.email.toLowerCase().trim();
      const { title, textContent, stateBefore, stateAfter } = req.body;
      if (!title || !textContent) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      const journal = await prisma.journal.create({
        data: {
          userEmail: email,
          title,
          textContent,
          stateBefore,
          stateAfter,
        },
      });
      res.json({ data: journal });
    } catch (err: any) {
      console.error("POST /api/journals error:", err);
      res.status(500).json({ message: "Failed to save journal" });
    }
  });

  app.put("/api/journals/:id", authMiddleware, async (req: any, res) => {
    try {
      const email = req.user.email.toLowerCase().trim();
      const { id } = req.params;
      const { title, textContent, stateBefore, stateAfter } = req.body;

      const journal = await prisma.journal.findFirst({
        where: { id, userEmail: email },
      });
      if (!journal) {
        return res.status(404).json({ message: "Journal not found or unauthorized" });
      }

      const updated = await prisma.journal.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(textContent !== undefined && { textContent }),
          ...(stateBefore !== undefined && { stateBefore }),
          ...(stateAfter !== undefined && { stateAfter }),
        },
      });
      res.json({ data: updated });
    } catch (err: any) {
      console.error("PUT /api/journals error:", err);
      res.status(500).json({ message: "Failed to update journal" });
    }
  });

  // Progress API
  app.get("/api/user-progress", authMiddleware, async (req: any, res) => {
    try {
      const email = req.user.email.toLowerCase().trim();
      const { since } = req.query;

      const whereClause: any = { userEmail: email };
      if (since) {
        whereClause.completedAt = { gte: new Date(since as string) };
      }

      const progress = await prisma.userProgress.findMany({
        where: whereClause,
        orderBy: { completedAt: "desc" },
      });
      res.json({ data: progress });
    } catch (err: any) {
      console.error("GET /api/user-progress error:", err);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/user-progress", authMiddleware, async (req: any, res) => {
    try {
      const email = req.user.email.toLowerCase().trim();
      const { sessionName, duration } = req.body;
      if (!sessionName || duration === undefined) {
        return res.status(400).json({ message: "sessionName and duration are required" });
      }

      const progress = await prisma.userProgress.create({
        data: {
          userEmail: email,
          sessionName,
          duration: parseFloat(duration),
        },
      });
      res.json({ data: progress });
    } catch (err: any) {
      console.error("POST /api/user-progress error:", err);
      res.status(500).json({ message: "Failed to save progress" });
    }
  });

  // Reset Gated Lead Registration APIs
  app.post("/api/reset-registration", async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      if (!name || !email || !phone) {
        return res.status(400).json({ message: "Name, email, and phone are required" });
      }
      const registration = await prisma.resetRegistration.upsert({
        where: { email: email.toLowerCase().trim() },
        update: { name, phone },
        create: {
          email: email.toLowerCase().trim(),
          name,
          phone,
        },
      });
      res.json({ success: true, data: registration });
    } catch (err: any) {
      console.error("POST /api/reset-registration error:", err);
      res.status(500).json({ message: "Failed to save registration" });
    }
  });

  app.get("/api/reset-registration/check", async (req, res) => {
    try {
      const email = req.query.email?.toString().toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const registration = await prisma.resetRegistration.findUnique({
        where: { email },
      });
      res.json({ registered: !!registration });
    } catch (err) {
      console.error("GET /api/reset-registration/check error:", err);
      res.status(500).json({ message: "Failed to check registration" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Catch-all route to serve index.html in dev mode (needed for SPA routing fallback)
    app.get('*', async (req, res, next) => {
      // Exclude API routes and files with extensions
      if (req.url.startsWith('/api') || req.url.includes('.')) {
        return next();
      }
      try {
        const templatePath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(req.url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
