const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------- MONGODB CONNECTION ------------------- //
mongoose.connect("mongodb://127.0.0.1:27017/tamEventsDB", {
  serverSelectionTimeoutMS: 5000,
  family: 4,
}).catch(err => console.error("❌ Initial MongoDB connection error:", err));

const db = mongoose.connection;

db.on("error", (err) => console.error("❌ MongoDB connection error:", err));

db.once("open", () => {
  console.log("✅ Connected to MongoDB successfully");
});

// ------------------- SCHEMAS ------------------- //

// Data Alchemy (single registration)
const singleRegSchema = new mongoose.Schema({
  event: String,
  name: String,
  registration: String,
  email: String,
  contact: String,
  regID: String,
});
const SingleReg = mongoose.model("SingleReg", singleRegSchema, "dataregs");

// Survival Showdown (team registration)
const survivalTeamSchema = new mongoose.Schema({
  event: String,
  teamName: String,
  teamSize: Number,
  members: [
    {
      name: String,
      registration: String,
      email: String,
      contact: String,
    },
  ],
  teamID: String,
});
const SurvivalTeamReg = mongoose.model("SurvivalTeamReg", survivalTeamSchema, "survivalregs");

// Code Cortex (team registration)
const codeCortexTeamSchema = new mongoose.Schema({
  event: String,
  teamName: String,
  teamSize: Number,
  members: [
    {
      name: String,
      registration: String,
      email: String,
      contact: String,
    },
  ],
  teamID: String,
});
const CodeCortexTeamReg = mongoose.model("CodeCortexTeamReg", codeCortexTeamSchema, "codecortexregs");

// ------------------- HELPERS ------------------- //
function generateID() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ------------------- ROUTES ------------------- //

// 1️⃣ Data Alchemy Registration (Single)
app.post("/api/dataalchemy-register", async (req, res) => {
  try {
    const { registration, email, contact, name } = req.body;

    const regID = generateID();
    const newReg = new SingleReg({ event: "dataalchemy", name, registration, email, contact, regID });
    await newReg.save();

    res.json({ status: "success", registration_id: regID });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 3️⃣ Code Cortex Registration (Team) - Leader creates team
app.post("/api/codecortex-register", async (req, res) => {
  try {
    const { teamName, teamSize, name, registration, email, contact } = req.body;

    if (!teamName || !teamSize || !name || !registration || !email || !contact) {
      return res.json({ status: "error", message: "All fields are required." });
    }

    if (teamSize < 2 || teamSize > 4) {
      return res.json({ status: "error", message: "Team size must be between 2 and 4." });
    }

    const teamID = generateID();

    const newTeam = new CodeCortexTeamReg({
      event: "codecortex",
      teamName,
      teamSize,
      members: [{ name, registration, email, contact }],
      teamID
    });

    await newTeam.save();
    res.json({ status: "success", team_id: teamID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 3️⃣ Code Cortex Join Team - Member joins existing team
app.post("/api/codecortex-join", async (req, res) => {
  try {
    const { teamId, name, registration, email, contact } = req.body;

    if (!teamId || !name || !registration || !email || !contact) {
      return res.json({ status: "error", message: "All fields are required." });
    }

    const team = await CodeCortexTeamReg.findOne({ teamID: teamId });
    if (!team) return res.json({ status: "error", message: "Team not found." });

    if (team.members.length >= team.teamSize) {
      return res.json({ status: "error", message: "Team is already full." });
    }

    // Prevent duplicate member
    const exists = team.members.some(m => m.registration === registration);
    if (exists) return res.json({ status: "error", message: "Member already in team." });

    team.members.push({ name, registration, email, contact });
    await team.save();

    res.json({ status: "success", team_id: teamId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});


// 2️⃣ Survival Showdown Registration (Team) - Leader creates team
app.post("/api/survival-register", async (req, res) => {
  try {
    const { teamName, teamSize, name, registration, email, contact } = req.body;

    if (!teamName || !teamSize || !name || !registration || !email || !contact) {
      return res.json({ status: "error", message: "All fields are required." });
    }

    if (teamSize < 2 || teamSize > 4) {
      return res.json({ status: "error", message: "Team size must be between 2 and 4." });
    }

    const teamID = generateID();

    const newTeam = new SurvivalTeamReg({
      event: "survival",
      teamName,
      teamSize,
      members: [{ name, registration, email, contact }],
      teamID
    });

    await newTeam.save();
    res.json({ status: "success", team_id: teamID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// 2️⃣ Survival Showdown Join Team - Member joins existing team
app.post("/api/survival-join", async (req, res) => {
  try {
    const { teamId, name, registration, email, contact } = req.body;

    if (!teamId || !name || !registration || !email || !contact) {
      return res.json({ status: "error", message: "All fields are required." });
    }

    const team = await SurvivalTeamReg.findOne({ teamID: teamId });
    if (!team) return res.json({ status: "error", message: "Team not found." });

    if (team.members.length >= team.teamSize) {
      return res.json({ status: "error", message: "Team is already full." });
    }

    // Prevent duplicate member
    const exists = team.members.some(m => m.registration === registration);
    if (exists) return res.json({ status: "error", message: "Member already in team." });

    team.members.push({ name, registration, email, contact });
    await team.save();

    res.json({ status: "success", team_id: teamId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ------------------- ADMIN PANEL ROUTES ------------------- //

// Get all registrations combined (for admin panel)
app.get("/api/registrations", async (req, res) => {
  try {
    const [singleRegs, survivalRegs, codeCortexRegs] = await Promise.all([
      SingleReg.find({}).lean(),
      SurvivalTeamReg.find({}).lean(),
      CodeCortexTeamReg.find({}).lean()
    ]);

    const allRegistrations = [
      ...singleRegs.map(reg => ({ ...reg, type: 'single' })),
      ...survivalRegs.map(reg => ({ ...reg, type: 'team' })),
      ...codeCortexRegs.map(reg => ({ ...reg, type: 'team' }))
    ];

    res.json(allRegistrations);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get single event registrations
app.get("/api/dataregs", async (req, res) => {
  try {
    const data = await SingleReg.find({});
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get survival registrations
app.get("/api/survivalregs", async (req, res) => {
  try {
    const data = await SurvivalTeamReg.find({});
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get codecortex registrations
app.get("/api/codecortexregs", async (req, res) => {
  try {
    const data = await CodeCortexTeamReg.find({});
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Update registration (single)
app.put("/api/registrations/single/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updated = await SingleReg.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ status: "error", message: "Registration not found" });
    
    res.json({ status: "success", data: updated });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Update registration (team)
app.put("/api/registrations/team/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    let updated = await SurvivalTeamReg.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) updated = await CodeCortexTeamReg.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ status: "error", message: "Registration not found" });
    
    res.json({ status: "success", data: updated });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Delete registration (single)
app.delete("/api/registrations/single/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await SingleReg.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ status: "error", message: "Registration not found" });
    
    res.json({ status: "success", message: "Registration deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Delete registration (team)
app.delete("/api/registrations/team/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    let deleted = await SurvivalTeamReg.findByIdAndDelete(id);
    if (!deleted) deleted = await CodeCortexTeamReg.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ status: "error", message: "Registration not found" });
    
    res.json({ status: "success", message: "Registration deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ------------------- START SERVER ------------------- //
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
