// Define the highlight and note schemas and models for MongoDB
const highlightSchema = new mongoose.Schema({
  articleId: mongoose.Schema.Types.ObjectId,
  text: String,
  startOffset: Number,
  endOffset: Number,
  highlightId: String, // Unique identifier for the highlight
  category: String,
  timestamp: { type: Date, default: Date.now },
});

const Highlight = mongoose.model("Highlight", highlightSchema);

const noteSchema = new mongoose.Schema({
  highlightId: mongoose.Schema.Types.ObjectId,
  note: String,
  timestamp: { type: Date, default: Date.now },
});

const Note = mongoose.model("Note", noteSchema);

module.exports = Highlight;
// Endpoint to save highlights
app.post("/api/highlights", async (req, res) => {
  try {
    console.log("Received highlight data:", req.body); // Log the received data
    const highlight = new Highlight(req.body);
    const savedHighlight = await highlight.save();
    console.log("Saved highlight:", savedHighlight); // Log the saved highlight
    res.json({
      message: "Highlight saved successfully",
      highlight: savedHighlight,
    });
  } catch (error) {
    console.error("Error saving highlight:", error); // Log any error
    res.status(500).json({ message: "Error saving highlight", error });
  }
});

// Endpoint to get highlights
app.get("/api/highlights", async (req, res) => {
  try {
    const highlights = await Highlight.find();
    console.log("Fetched highlights:", highlights); // Log the fetched highlights
    res.json(highlights);
  } catch (error) {
    console.error("Error fetching highlights:", error); // Log any error
    res.status(500).json({ message: "Error fetching highlights", error });
  }
});

// Endpoint to save notes
app.post("/api/notes", async (req, res) => {
  try {
    console.log("Received note data:", req.body); // Debugging line

    if (!req.body.highlightId || !req.body.content) {
      return res
        .status(400)
        .json({ message: "Highlight ID and content are required" });
    }

    const note = new Note({
      highlightId: req.body.highlightId,
      note: req.body.content,
    });

    const savedNote = await note.save();
    console.log("Saved note:", savedNote); // Debugging line

    res.json({ message: "Note saved successfully", note: savedNote });
  } catch (error) {
    console.error("Error saving note:", error); // Debugging line
    res.status(500).json({ message: "Error saving note", error });
  }
});

// Endpoint to get notes for a specific highlight
app.get("/api/notes/:highlightId", async (req, res) => {
  try {
    console.log("Fetching notes for highlight ID:", req.params.highlightId); // Log the highlight ID
    const notes = await Note.find({ highlightId: req.params.highlightId });
    console.log("Fetched notes:", notes); // Log the fetched notes
    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error); // Log any error
    res.status(500).json({ message: "Error fetching notes", error });
  }
});

// Endpoint to delete a highlight
app.delete("/api/highlights/:id", async (req, res) => {
  try {
    const highlightId = req.params.id;
    const deletedHighlight = await Highlight.findByIdAndDelete(highlightId);
    if (deletedHighlight) {
      res.json({ message: "Highlight deleted successfully" });
    } else {
      res.status(404).json({ message: "Highlight not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting highlight", error });
  }
});
