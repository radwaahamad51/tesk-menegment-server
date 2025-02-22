require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection 
const uri = "mongodb+srv://tesk-1:ugvlmehDlWLSqV6i@cluster0.xhwto.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("job_task");
    const Task = db.collection("jobtask");

    // Create a Task
    app.post("/tasks", async (req, res) => {
      try {
        const { title, description, category, uid } = req.body;

        if (!title || !uid) {
          return res.status(400).json({ error: "Title and UID are required" });
        }

        const newTask = {
          title,
          description: description || "",
          category: category || "To-Do",
          uid,
          timestamp: new Date(),
        };

        const result = await Task.insertOne(newTask);
        res.status(201).json({ success: true, task: { _id: result.insertedId, ...newTask } });
      } catch (error) {
        console.error("Error inserting task:", error);
        res.status(500).json({ error: "Failed to insert task" });
      }
    });

    // Read (Get) Tasks for a User
    app.get("/tasks", async (req, res) => {
      try {
        const { uid } = req.query;
        if (!uid) {
          return res.status(400).json({ error: "UID is required" });
        }
        const tasks = await Task.find({ uid }).sort({ timestamp: 1 }).toArray();
        res.json(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Update a Task
    app.put("/tasks/:id", async (req, res) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid task ID format" });
      }
      
      const { category, title } = req.body;
      const updateFields = {};
      
      if (category) updateFields.category = category;
      if (title) updateFields.title = title;
      
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
      }
      
      try {
        const updateResult = await Task.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields }
        );
        
        if (updateResult.matchedCount === 0) {
          return res.status(404).json({ error: "Task not found" });
        }
        res.json({ message: "Task updated successfully" });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Delete a Task
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const objectId = new ObjectId(id);
        const deleteResult = await Task.deleteOne({ _id: objectId });

        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: "Task not found" });
        }

        res.json({ success: true, deletedCount: deleteResult.deletedCount });
      } catch (error) {
        console.error(" Error deleting task:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Start Express Server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error(" Error connecting to MongoDB:", error);
  }
}

run();
