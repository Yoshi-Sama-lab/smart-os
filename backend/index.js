require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// 1. Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Public test route
app.get("/", (req, res) => {
  res.send("Student OS Backend is running 🚀");
});

// 2. Authentication Middleware
const verifyToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach user data to request
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 3. Protected Route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to the Student OS backend!",
    user: req.user,
  });
});

// 📚 Add Study Log
app.post("/api/study", verifyToken, async (req, res) => {
  try {
    const { subject, durationMinutes, note, date } = req.body;

    if (!subject || !durationMinutes) {
      return res.status(400).json({ error: "Subject and duration are required" });
    }

    const uid = req.user.uid;

    const docRef = await db.collection("study_logs").add({
      uid,
      subject,
      durationMinutes,
      note: note || "",
      date: date || new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("Error adding study log:", err);
    res.status(500).json({ error: "Failed to add study log" });
  }
});

// 📚 Get Study Logs (for current user)
app.get("/api/study", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection("study_logs")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(logs);
  } catch (err) {
    console.error("Error fetching study logs:", err);
    res.status(500).json({ error: "Failed to fetch study logs" });
  }
});

// 🗑️ Delete Study Log
app.delete("/api/study/:id", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;

    const docRef = db.collection("study_logs").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Log not found" });
    }

    if (doc.data().uid !== uid) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await docRef.delete();

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting study log:", err);
    res.status(500).json({ error: "Failed to delete study log" });
  }
});
// 🎯 Get Goal
app.get("/api/goals", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const docRef = db.collection("goals").doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.json({ dailyMinutes: 120 }); // default
    }

    res.json(doc.data());
  } catch (err) {
    console.error("Error fetching goal:", err);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// 🎯 Set Goal
app.post("/api/goals", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { dailyMinutes } = req.body;

    if (!dailyMinutes) {
      return res.status(400).json({ error: "dailyMinutes is required" });
    }

    await db.collection("goals").doc(uid).set({
      dailyMinutes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, dailyMinutes });
  } catch (err) {
    console.error("Error setting goal:", err);
    res.status(500).json({ error: "Failed to set goal" });
  }
});

// 📅 Add Schedule Event
app.post("/api/schedule", verifyToken, async (req, res) => {
  try {
    const { subject, day, startTime, endTime } = req.body;
    if (!subject || !day || !startTime || !endTime) {
      return res.status(400).json({ error: "All fields required" });
    }

    const uid = req.user.uid;

    const docRef = await db.collection("schedule").add({
      uid,
      subject,
      day,
      startTime,
      endTime,
      completed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ id: docRef.id });
  } catch (err) {
    console.error("Error adding schedule:", err);
    res.status(500).json({ error: "Failed to add schedule" });
  }
});

// 📅 Get Schedule Events
app.get("/api/schedule", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const snapshot = await db
      .collection("schedule")
      .where("uid", "==", uid)
      .orderBy("day", "asc")
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(events);
  } catch (err) {
    console.error("Error fetching schedule:", err);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});
// 📅 Update Schedule Event (toggle completed)
app.patch("/api/schedule/:id", verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    const { completed } = req.body;

    const docRef = db.collection("schedule").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (doc.data().uid !== uid) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await docRef.update({
      completed: !!completed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating schedule event:", err);
    res.status(500).json({ error: "Failed to update schedule event" });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));