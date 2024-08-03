const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const sanitizeHtml = require("sanitize-html");
const { YoutubeTranscript } = require("youtube-transcript");
const dotenv = require("dotenv");
const WebSocket = require("ws");
const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { getSummary, getKeyPoints } = require("./summarization");

dotenv.config();
const POCKET_CONSUMER_KEY = process.env.POCKET_CONSUMER_KEY;
console.log("POCKET_CONSUMER_KEY:", process.env.POCKET_CONSUMER_KEY);
console.log("SESSION_SECRET:", process.env.SESSION_SECRET);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:3001", // Your frontend URL
    credentials: true, // Allow credentials to be included
  })
);

app.use(bodyParser.json());
app.use(express.json());

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax", // Use 'lax' for local development, 'none' for cross-site requests
    },
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

mongoose.connection.on(
  "error",
  console.error.bind(console, "connection error:")
);
mongoose.connection.once("open", function () {
  console.log("Connected to MongoDB");
});

// WebSocket connection setup
wss.on("connection", (ws) => {
  console.log("WebSocket connection established");
});

// Function to broadcast data to all connected WebSocket clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Define the content schema and model for MongoDB
const contentSchema = new mongoose.Schema({
  url: String,
  title: String,
  category: String,
  tags: String,
  imageUrl: String,
  contentType: { type: String, enum: ["PDF", "Article", "YouTube"] },
  structuredContent: [{ type: Object }],
  description: String,
  publishDate: Date,
  author: String,
  videoId: String,
  transcript: String,
  summary: String,
  keyPoints: String,
  keyInsights: String,
  date: { type: Date, default: Date.now },
});

const Content = mongoose.model("Content", contentSchema);

// // Define the highlight and note schemas and models for MongoDB
// const highlightSchema = new mongoose.Schema({
//   articleId: mongoose.Schema.Types.ObjectId,
//   text: String,
//   startOffset: Number,
//   endOffset: Number,
//   highlightId: String, // Unique identifier for the highlight
//   category: String,
//   timestamp: { type: Date, default: Date.now },
// });

// const Highlight = mongoose.model("Highlight", highlightSchema);

// const noteSchema = new mongoose.Schema({
//   highlightId: mongoose.Schema.Types.ObjectId,
//   note: String,
//   timestamp: { type: Date, default: Date.now },
// });

// const Note = mongoose.model("Note", noteSchema);

// module.exports = Highlight;

// Sanitize text to remove HTML tags and non-ASCII characters
function sanitizeText(text) {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters
}

// Extract article information using Mozilla's Readability library
async function extractArticleInfo(url) {
  try {
    const { data } = await axios.get(url);
    const dom = new JSDOM(data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("Article content could not be parsed");
    }

    const contentHtml = sanitizeHtml(article.content, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "blockquote",
        "ul",
        "ol",
        "li",
        "img",
        "figure",
        "figcaption",
        "a",
      ],
      allowedAttributes: { img: ["src", "alt"], a: ["href"] },
      textFilter: (text) => text.trim(),
    });

    const domContent = new JSDOM(contentHtml);
    const contentElements = domContent.window.document.body.children;
    const structuredContent = [];
    let imageUrl = "default-thumbnail.png";

    const metaImageUrl =
      dom.window.document.querySelector("meta[property='og:image']")?.content ||
      dom.window.document.querySelector("meta[name='twitter:image']")?.content;

    if (metaImageUrl) {
      const absMetaImageUrl = metaImageUrl.startsWith("http")
        ? metaImageUrl
        : new URL(metaImageUrl, url).href;
      imageUrl = absMetaImageUrl;
    }

    for (let element of contentElements) {
      let imgElement, linkElement;

      switch (element.tagName.toLowerCase()) {
        case "p":
          imgElement = element.querySelector("img");
          linkElement = element.querySelector("a");

          if (imgElement) {
            const src = imgElement.getAttribute("src");
            const absSrc = src.startsWith("http")
              ? src
              : new URL(src, url).href;
            structuredContent.push({
              type: "image",
              url: absSrc,
              caption: imgElement.alt || "",
            });
            if (imageUrl === "default-thumbnail.png") imageUrl = absSrc;
          } else if (linkElement) {
            structuredContent.push({
              type: "paragraph",
              content: element.innerHTML,
            });
          } else {
            structuredContent.push({
              type: "paragraph",
              content: element.innerHTML,
            });
          }
          break;

        case "blockquote":
          structuredContent.push({
            type: "blockquote",
            content: element.innerHTML,
          });
          break;

        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          structuredContent.push({
            type: "heading",
            level: parseInt(element.tagName[1]),
            content: element.textContent,
          });
          break;

        case "ul":
        case "ol":
          const items = [];
          for (let listItem of element.children) {
            if (listItem.tagName.toLowerCase() === "li") {
              items.push(listItem.innerHTML);
            }
          }
          structuredContent.push({
            type: "list",
            ordered: element.tagName.toLowerCase() === "ol",
            items,
          });
          break;

        case "figure":
          imgElement = element.querySelector("img");
          const figcaptionElement = element.querySelector("figcaption");
          if (imgElement) {
            const src = imgElement.getAttribute("src");
            const absSrc = src.startsWith("http")
              ? src
              : new URL(src, url).href;
            structuredContent.push({
              type: "image",
              url: absSrc,
              caption: figcaptionElement ? figcaptionElement.textContent : "",
            });
            if (imageUrl === "default-thumbnail.png") imageUrl = absSrc;
          }
          break;

        case "img":
          const src = element.getAttribute("src");
          const absSrc = src.startsWith("http") ? src : new URL(src, url).href;
          structuredContent.push({
            type: "image",
            url: absSrc,
            caption: element.alt || "",
          });
          if (imageUrl === "default-thumbnail.png") imageUrl = absSrc;
          break;

        case "a":
          structuredContent.push({
            type: "link",
            url: element.href,
            content: element.innerHTML,
          });
          break;
      }
    }

    return {
      title: article.title,
      author: article.byline || "Unknown Author",
      publishDate: article.date_published || new Date().toISOString(),
      structuredContent,
      imageUrl,
    };
  } catch (error) {
    console.error("Error extracting article information:", error.message);
    throw new Error("Content could not be retrieved.");
  }
}

async function extractArticleInfo(url) {
  try {
    const { data } = await axios.get(url);
    const dom = new JSDOM(data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error("Article content could not be parsed");
    }

    const contentHtml = sanitizeHtml(article.content, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "blockquote",
        "ul",
        "ol",
        "li",
        "img",
        "figure",
        "figcaption",
        "a",
      ],
      allowedAttributes: { img: ["src", "alt"], a: ["href"] },
      textFilter: (text) => text.trim(),
    });

    const domContent = new JSDOM(contentHtml);
    const contentElements = domContent.window.document.body.children;
    const structuredContent = [];
    let imageUrl = "default-thumbnail.png";

    const metaImageUrl =
      dom.window.document.querySelector("meta[property='og:image']")?.content ||
      dom.window.document.querySelector("meta[name='twitter:image']")?.content;

    if (metaImageUrl) {
      const absMetaImageUrl = metaImageUrl.startsWith("http")
        ? metaImageUrl
        : new URL(metaImageUrl, url).href;
      imageUrl = absMetaImageUrl;
    }

    for (let element of contentElements) {
      let imgElement, linkElement;

      switch (element.tagName.toLowerCase()) {
        case "p":
          imgElement = element.querySelector("img");
          linkElement = element.querySelector("a");

          if (imgElement) {
            const src = imgElement.getAttribute("src");
            const absSrc = src.startsWith("http")
              ? src
              : new URL(src, url).href;
            structuredContent.push({
              type: "image",
              url: absSrc,
              caption: imgElement.alt || "",
            });
            if (imageUrl === "default-thumbnail.png") imageUrl = absSrc;
          } else if (linkElement) {
            structuredContent.push({
              type: "paragraph",
              content: element.innerHTML,
            });
          } else {
            structuredContent.push({
              type: "paragraph",
              content: element.innerHTML,
            });
          }
          break;

        case "blockquote":
          structuredContent.push({
            type: "blockquote",
            content: element.innerHTML,
          });
          break;

        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          structuredContent.push({
            type: "heading",
            level: parseInt(element.tagName[1]),
            content: element.textContent,
          });
          break;

        case "ul":
        case "ol":
          const items = [];
          for (let listItem of element.children) {
            if (listItem.tagName.toLowerCase() === "li") {
              items.push(listItem.innerHTML);
            }
          }
          structuredContent.push({
            type: "list",
            ordered: element.tagName.toLowerCase() === "ol",
            items,
          });
          break;

        case "figure":
          imgElement = element.querySelector("img");
          const figcaptionElement = element.querySelector("figcaption");
          if (imgElement) {
            const src = imgElement.getAttribute("src");
            const absSrc = src.startsWith("http")
              ? src
              : new URL(src, url).href;
            structuredContent.push({
              type: "image",
              url: absSrc,
              caption: figcaptionElement ? figcaptionElement.textContent : "",
            });
            if (imageUrl === "default-thumbnail.png") imageUrl = absSrc;
          }
          break;

        case "img":
          const src = element.getAttribute("src");
          const absSrc = src.startsWith("http") ? src : new URL(src, url).href;
          structuredContent.push({
            type: "image",
            url: absSrc,
            caption: element.alt || "",
          });
          if (imageUrl === "default-thumbnail.png") imageUrl = absSrc;
          break;

        case "a":
          structuredContent.push({
            type: "link",
            url: element.href,
            content: element.innerHTML,
          });
          break;
      }
    }

    return {
      title: article.title,
      author: article.byline || "Unknown Author",
      publishDate: article.date_published || new Date().toISOString(),
      structuredContent,
      imageUrl,
    };
  } catch (error) {
    console.error("Error extracting article information:", error.message);
    throw new Error("Content could not be retrieved.");
  }
}

module.exports = extractArticleInfo;

function cleanTranscript(text) {
  return text.replace(/&amp;#39;/g, "'");
}

function sanitizeYouTubeURL(url) {
  const urlObj = new URL(url);
  return `${urlObj.origin}${urlObj.pathname}?v=${urlObj.searchParams.get("v")}`;
}

// Extract YouTube information
async function extractYouTubeInfo(url) {
  const sanitizedUrl = sanitizeYouTubeURL(url);
  const videoId = sanitizedUrl.split("v=")[1];
  const apiKey = process.env.YOUTUBE_API_KEY;
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics,status`;

  try {
    const { data } = await axios.get(apiUrl);
    if (!data.items.length) throw new Error("No video data found");
    const video = data.items[0].snippet;
    const {
      title,
      description,
      publishedAt: publishDate,
      channelTitle: author,
    } = video;

    const thumbnails = video.thumbnails;
    const imageUrl = thumbnails.maxres
      ? thumbnails.maxres.url
      : thumbnails.standard
      ? thumbnails.standard.url
      : thumbnails.high
      ? thumbnails.high.url
      : thumbnails.medium
      ? thumbnails.medium.url
      : thumbnails.default.url;

    let transcript = "";
    let transcriptAvailable = true;

    try {
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: "en",
      });
      transcript = transcriptData
        .map((item) => cleanTranscript(item.text))
        .join(" ");
    } catch (error) {
      if (error.message.includes("Transcript is disabled on this video")) {
        transcriptAvailable = false;
      } else {
        console.error("Error fetching transcript:", error);
        throw new Error("Transcript could not be retrieved.");
      }
    }

    return {
      title,
      description,
      publishDate,
      author,
      transcript,
      imageUrl,
      transcriptAvailable,
    };
  } catch (error) {
    console.error("Error extracting YouTube information:", error.message);
    throw new Error("Content could not be retrieved.");
  }
}

// // Endpoint to save highlights
// app.post("/api/highlights", async (req, res) => {
//   try {
//     console.log("Received highlight data:", req.body); // Log the received data
//     const highlight = new Highlight(req.body);
//     const savedHighlight = await highlight.save();
//     console.log("Saved highlight:", savedHighlight); // Log the saved highlight
//     res.json({
//       message: "Highlight saved successfully",
//       highlight: savedHighlight,
//     });
//   } catch (error) {
//     console.error("Error saving highlight:", error); // Log any error
//     res.status(500).json({ message: "Error saving highlight", error });
//   }
// });

// // Endpoint to get highlights
// app.get("/api/highlights", async (req, res) => {
//   try {
//     const highlights = await Highlight.find();
//     console.log("Fetched highlights:", highlights); // Log the fetched highlights
//     res.json(highlights);
//   } catch (error) {
//     console.error("Error fetching highlights:", error); // Log any error
//     res.status(500).json({ message: "Error fetching highlights", error });
//   }
// });

// // Endpoint to save notes
// app.post("/api/notes", async (req, res) => {
//   try {
//     console.log("Received note data:", req.body); // Debugging line

//     if (!req.body.highlightId || !req.body.content) {
//       return res
//         .status(400)
//         .json({ message: "Highlight ID and content are required" });
//     }

//     const note = new Note({
//       highlightId: req.body.highlightId,
//       note: req.body.content,
//     });

//     const savedNote = await note.save();
//     console.log("Saved note:", savedNote); // Debugging line

//     res.json({ message: "Note saved successfully", note: savedNote });
//   } catch (error) {
//     console.error("Error saving note:", error); // Debugging line
//     res.status(500).json({ message: "Error saving note", error });
//   }
// });

// // Endpoint to get notes for a specific highlight
// app.get("/api/notes/:highlightId", async (req, res) => {
//   try {
//     console.log("Fetching notes for highlight ID:", req.params.highlightId); // Log the highlight ID
//     const notes = await Note.find({ highlightId: req.params.highlightId });
//     console.log("Fetched notes:", notes); // Log the fetched notes
//     res.json(notes);
//   } catch (error) {
//     console.error("Error fetching notes:", error); // Log any error
//     res.status(500).json({ message: "Error fetching notes", error });
//   }
// });

// // Endpoint to delete a highlight
// app.delete("/api/highlights/:id", async (req, res) => {
//   try {
//     const highlightId = req.params.id;
//     const deletedHighlight = await Highlight.findByIdAndDelete(highlightId);
//     if (deletedHighlight) {
//       res.json({ message: "Highlight deleted successfully" });
//     } else {
//       res.status(404).json({ message: "Highlight not found" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting highlight", error });
//   }
// });

// Endpoint to summarize content
app.post("/api/summarize", async (req, res) => {
  const { contentId } = req.body;
  try {
    const content = await Content.findById(contentId);
    if (content.summary && content.keyPoints && content.keyInsights) {
      res.json({
        summary: content.summary,
        keyPoints: content.keyPoints,
        keyInsights: content.keyInsights,
      });
    } else {
      const textContent =
        content.transcript ||
        content.structuredContent
          .filter((item) => item.type === "paragraph")
          .map((el) => el.content)
          .join(" ");
      const { summary, keyPoints, keyInsights } = await getSummary(textContent);
      content.summary = summary;
      content.keyPoints = keyPoints;
      content.keyInsights = keyInsights;
      await content.save();
      res.json({ summary, keyPoints, keyInsights });
    }
  } catch (error) {
    console.error("Error summarizing content:", error);
    res.status(500).json({ message: "Error summarizing content", error });
  }
});

console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY}`);

// Create a temporary directory for audio files
const tempDir = path.join(__dirname, "temp", "tts-audio");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.use("/audio", express.static(tempDir));

app.post("/api/synthesize", (req, res) => {
  let text = req.body.text;

  if (!text) {
    return res.status(400).send("No text provided");
  }

  // Sanitize the text to remove HTML tags and non-ASCII characters
  text = sanitizeText(text);

  if (text.trim() === "") {
    return res.status(400).send("No valid text provided after sanitization");
  }

  const tempFilePath = path.join(tempDir, `${Date.now()}_input.txt`);
  const outputFilePath = path.join(tempDir, `${Date.now()}_output.wav`);

  fs.writeFileSync(tempFilePath, text, { encoding: "utf-8" });
  console.log(`Temporary input file created at: ${tempFilePath}`);
  console.log(`Expected output file will be at: ${outputFilePath}`);

  const pythonProcess = spawn(
    "python",
    [
      path.join(__dirname, "openai_tts_service.py"),
      tempFilePath,
      outputFilePath,
    ],
    {
      env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY },
    }
  );

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    fs.unlinkSync(tempFilePath);
    if (code !== 0) {
      return res.status(500).send(`Python script exited with code ${code}`);
    }
    console.log(
      `Python script completed. Output file created at: ${outputFilePath}`
    );
    res.json({ audio_url: `/audio/${path.basename(outputFilePath)}` });

    // Clean up the audio file after 5 minutes
    setTimeout(() => {
      fs.unlink(outputFilePath, (err) => {
        if (err) console.error(`Error deleting file: ${err}`);
        else console.log(`Deleted temporary file: ${outputFilePath}`);
      });
    }, 5 * 60 * 1000);
  });
});

// Save content
async function processArticleContent(content) {
  try {
    const { title, author, publishDate, structuredContent, imageUrl } =
      await extractArticleInfo(content.url);
    content.title = title;
    content.author = author;
    content.publishDate = publishDate;
    content.structuredContent = structuredContent;
    content.imageUrl = imageUrl;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function processYouTubeContent(content) {
  try {
    const {
      title,
      description,
      publishDate,
      author,
      transcript,
      imageUrl,
      transcriptAvailable,
    } = await extractYouTubeInfo(content.url);
    content.title = title;
    content.description = description;
    content.publishDate = publishDate;
    content.author = author;
    content.transcript = transcript;
    content.imageUrl = imageUrl;

    if (!transcriptAvailable) {
      throw new Error("Transcript is disabled on this video");
    }
  } catch (error) {
    console.error("Error extracting YouTube info:", error);
    throw new Error(error.message);
  }
}

app.post("/api/save", async (req, res) => {
  const content = new Content(req.body);

  try {
    if (content.contentType === "Article") {
      await processArticleContent(content);
    } else if (content.contentType === "YouTube") {
      await processYouTubeContent(content);
    }

    const savedContent = await content.save();
    broadcast({ message: "Content saved", content: savedContent });
    res.json({
      message: "Content saved successfully",
      contentId: savedContent._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving content", error });
  }
});

// Remove content
app.post("/api/remove", async (req, res) => {
  const { contentId } = req.body;
  try {
    const result = await Content.findByIdAndDelete(contentId);
    if (result) {
      broadcast({ message: "Content removed", contentId });
      res.json({ message: "Content removed successfully" });
    } else {
      res.status(404).json({ message: "Content not found" });
    }
  } catch (error) {
    console.error("Error removing content:", error);
    res.status(500).json({ message: "Error removing content", error });
  }
});

// Fetch all content
app.get("/api/content", async (req, res) => {
  try {
    const contents = await Content.find();
    res.json(contents);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Error fetching content", error });
  }
});

// Fetch content by ID
app.get("/api/content/:id", async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (content) {
      res.json(content);
    } else {
      res.status(404).json({ message: "Content not found" });
    }
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Error fetching content", error });
  }
});

// Update content category and tags
app.patch("/api/content/:id", async (req, res) => {
  const contentId = req.params.id;
  const { category, tags } = req.body;

  try {
    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      { category, tags },
      { new: true }
    );
    if (updatedContent) {
      res.json({
        message: "Content updated successfully",
        content: updatedContent,
      });
      broadcast({ message: "Content updated", content: updatedContent });
    } else {
      res.status(404).json({ message: "Content not found" });
    }
  } catch (error) {
    console.error("Error updating content:", error);
    res.status(500).json({ message: "Error updating content", error });
  }
});

// Check if content exists by URL
app.get("/api/checkContent", async (req, res) => {
  const { url } = req.query;
  try {
    const content = await Content.findOne({ url });
    if (content) {
      res.json({ saved: true, content });
    } else {
      res.json({ saved: false });
    }
  } catch (error) {
    console.error("Error checking content:", error);
    res.status(500).json({ message: "Error checking content", error });
  }
});

// Start Pocket integration by obtaining a request token
app.get("/api/pocket/start", async (req, res) => {
  try {
    const response = await axios.post(
      "https://getpocket.com/v3/oauth/request",
      {
        consumer_key: POCKET_CONSUMER_KEY,
        redirect_uri: "http://localhost:3000/api/pocket/callback",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Accept": "application/json",
        },
      }
    );

    const requestToken = response.data.code;
    req.session.pocketRequestToken = requestToken;

    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("Session after saving request token:", req.session);

      const authorizationUrl = `https://getpocket.com/auth/authorize?request_token=${requestToken}&redirect_uri=http://localhost:3000/api/pocket/callback`;
      res.json({ authorization_url: authorizationUrl });
    });
  } catch (error) {
    console.error(
      "Error initiating Pocket integration:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Pocket integration failed" });
  }
});

// Handle Pocket OAuth callback and exchange the request token for an access token
app.get("/api/pocket/callback", async (req, res) => {
  console.log("Session data on callback:", req.session);
  const requestToken = req.session.pocketRequestToken;

  if (!requestToken) {
    console.error("Request token missing in session.");
    return res.status(400).send("No request token found");
  }

  try {
    const response = await axios.post(
      "https://getpocket.com/v3/oauth/authorize",
      {
        consumer_key: POCKET_CONSUMER_KEY,
        code: requestToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Accept": "application/json",
        },
      }
    );

    const accessToken = response.data.access_token;
    req.session.pocketAccessToken = accessToken;
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).send("Error saving session");
      }
      console.log("Session after saving access token:", req.session);
      // Send an HTML response to close the window and notify the parent
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage('pocket-authenticated', '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    });
  } catch (error) {
    console.error("Error obtaining Pocket access token:", error);
    res.status(500).send("Error obtaining Pocket access token");
  }
});

// Function to save Pocket items to MongoDB
async function savePocketItems(items) {
  try {
    const savedItems = [];
    for (const itemId in items) {
      const item = items[itemId];
      const content = new Content({
        url: item.resolved_url || item.given_url,
        title: item.resolved_title || item.given_title,
        category: "Pocket",
        tags: item.tags ? Object.keys(item.tags).join(", ") : "",
        imageUrl: item.top_image_url || "default-thumbnail.png",
        contentType: item.resolved_url.includes("youtube.com")
          ? "YouTube"
          : "Article",
        description: item.excerpt,
        publishDate: new Date(item.time_added * 1000),
        author: item.authors
          ? Object.values(item.authors)
              .map((a) => a.name)
              .join(", ")
          : "Unknown Author",
      });

      try {
        if (content.contentType === "Article") {
          await processArticleContent(content);
        } else if (content.contentType === "YouTube") {
          await processYouTubeContent(content);
        }
        const savedContent = await content.save();
        savedItems.push(savedContent);
      } catch (error) {
        console.error(`Error processing content ${itemId}:`, error.message);
      }
    }
    return savedItems;
  } catch (error) {
    console.error("Error saving Pocket items to MongoDB:", error);
    throw new Error("Error saving Pocket items to MongoDB");
  }
}

// Retrieve Pocket items
app.get("/api/pocket/items", async (req, res) => {
  const accessToken = req.session.pocketAccessToken;
  if (!accessToken) {
    return res.status(400).send("Pocket access token is missing");
  }
  try {
    const response = await axios.post(
      "https://getpocket.com/v3/get",
      {
        consumer_key: POCKET_CONSUMER_KEY,
        access_token: accessToken,
        state: "all",
        sort: "newest",
        detailType: "complete",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Accept": "application/json",
        },
      }
    );
    const items = response.data.list;
    console.log("Pocket items fetched:", items); // Log fetched items

    // Process and save items to MongoDB
    const savedItems = await savePocketItems(items);
    res.json(savedItems);
  } catch (error) {
    console.error("Error fetching Pocket items:", error);
    res.status(500).send("Error fetching Pocket items");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
