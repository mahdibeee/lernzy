document.addEventListener("DOMContentLoaded", function () {
  console.log("viewer.js script loaded now");

  const urlParams = new URLSearchParams(window.location.search);
  const contentId = urlParams.get("id");

  if (!contentId) {
    alert("Content ID is missing from the URL");
    return;
  }

  const renderImages = false; // Set this flag to control image rendering
  let fetchedContentText = ""; // Variable to store the fetched content

  getApiKey();
  fetchContentById(contentId, renderImages);

  async function renderStructuredContent(
    structuredContent,
    contentId,
    renderImages = false
  ) {
    const contentContainer = document.getElementById("content");
    contentContainer.innerHTML = "";

    structuredContent.forEach((element) => {
      let htmlElement;

      if (element.type === "paragraph") {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = element.content;
        const imgElement = tempDiv.querySelector("img");

        if (imgElement && !renderImages) {
          imgElement.remove();
        }

        element.content = tempDiv.innerHTML;
      }

      switch (element.type) {
        case "paragraph":
          htmlElement = document.createElement("p");
          htmlElement.innerHTML = element.content;
          break;
        case "blockquote":
          htmlElement = document.createElement("blockquote");
          htmlElement.textContent = element.content;
          break;
        case "heading":
          htmlElement = document.createElement(`h${element.level}`);
          htmlElement.textContent = element.content;
          break;
        case "list":
          htmlElement = document.createElement("ul");
          element.items.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = item;
            htmlElement.appendChild(listItem);
          });
          break;
        case "image":
          if (renderImages) {
            htmlElement = document.createElement("img");
            htmlElement.src = element.url;
            if (element.caption) {
              const caption = document.createElement("figcaption");
              caption.textContent = element.caption;
              const figure = document.createElement("figure");
              figure.appendChild(htmlElement);
              figure.appendChild(caption);
              htmlElement = figure;
            }
          } else {
            return;
          }
          break;
        case "link":
          htmlElement = document.createElement("a");
          htmlElement.href = element.url;
          htmlElement.innerHTML = element.content;
          break;
      }
      contentContainer.appendChild(htmlElement);
    });
  }

  async function getApiKey() {
    try {
      const response = await fetch("http://localhost:3000/config");
      const data = await response.json();
      OPENAI_API_KEY = data.apiKey;
    } catch (error) {
      console.error("Error fetching API key:", error);
    }
  }

  async function fetchSummary(contentId) {
    try {
      const response = await fetch("http://localhost:3000/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      return data;
    } catch (error) {
      console.error("Error fetching summary:", error);
      throw error;
    }
  }

  document
    .getElementById("summarizeButton")
    .addEventListener("click", summarizeContent);

  async function summarizeContent(event) {
    event.stopPropagation();
    console.log("Summarize button clicked");
    const contentId = new URLSearchParams(window.location.search).get("id");
    if (!contentId) {
      alert("Content ID is missing from the URL");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/content/${contentId}`
      );
      if (!response.ok)
        throw new Error(`Error fetching content: ${response.statusText}`);
      const data = await response.json();
      const content = data.structuredContent
        .filter((item) => item.type === "paragraph")
        .map((item) => item.content)
        .join(" ");
      console.log("Content to summarize:", content);
      const summaryData = await fetchSummary(contentId);
      document.getElementById("summary").innerText = summaryData.summary;
      document.getElementById("keypoints").innerText =
        summaryData.keyPoints + "\n\n" + summaryData.keyInsights;
    } catch (error) {
      console.error("Error summarizing content:", error);
    }
  }

  const audioPlayer = document.getElementById("audioPlayer");
  const playButton = document.querySelector(".nav-play .icon-play");
  const pauseButton = document.querySelector(".nav-play .icon-pause");
  const playPauseLink = document.querySelector(".nav-play .nav-link");

  if (!audioPlayer || !playButton || !pauseButton || !playPauseLink) {
    console.error("Audio player or control elements not found");
    return;
  }

  // Function to fetch and set audio source
  async function fetchAndSetAudioSource() {
    if (!audioPlayer.src) {
      console.log("Fetching content for TTS");

      let contentText = Array.from(document.querySelectorAll("#content p"))
        .map((p) => p.innerText)
        .join(" ");

      contentText = sanitizeText(contentText);

      console.log("Content Text:", contentText);

      try {
        const ttsResponse = await fetch(
          "http://localhost:3000/api/synthesize",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: contentText }),
          }
        );

        if (!ttsResponse.ok)
          throw new Error(`TTS server error: ${ttsResponse.statusText}`);
        const ttsData = await ttsResponse.json();
        const audioUrl = "http://localhost:3000" + ttsData.audio_url;

        console.log("Audio URL:", audioUrl);

        audioPlayer.src = audioUrl;
        audioPlayer.load();
        audioPlayer.style.display = "block";
      } catch (error) {
        console.error("Error fetching TTS:", error);
        return;
      }
    }
  }

  function togglePlayPause() {
    if (audioPlayer.paused) {
      audioPlayer.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    } else {
      audioPlayer.pause();
    }
  }

  // viewer.js - Play button click handler
  // Function to sanitize text before sending for TTS
  function sanitizeText(text) {
    return text.replace(/[^\x00-\x7F]/g, ""); // Remove non-ASCII characters
  }

  // Updated event listener for the play/pause link
  playPauseLink.addEventListener("click", async function (event) {
    event.preventDefault();
    await fetchAndSetAudioSource();
    togglePlayPause();
  });

  // Ensure player controls work independently
  audioPlayer.addEventListener("play", async function () {
    if (!audioPlayer.src) {
      await fetchAndSetAudioSource();
    }
    playButton.style.display = "none";
    pauseButton.style.display = "inline";
  });

  audioPlayer.addEventListener("pause", function () {
    playButton.style.display = "inline";
    pauseButton.style.display = "none";
  });

  audioPlayer.addEventListener("ended", function () {
    playButton.style.display = "inline";
    pauseButton.style.display = "none";
  });

  const sanitizedUrl = sanitizeYouTubeURL(content.url);

  function sanitizeYouTubeURL(url) {
    const urlObj = new URL(url);
    return `${
      urlObj.origin
    }${urlObj.pathname}?v=${urlObj.searchParams.get("v")}`;
  }

  let contentText = ""; // Variable to store the content

  async function fetchContentById(contentId, renderImages = false) {
    fetch(`http://localhost:3000/api/content/${contentId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching content: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        // Sanitize the YouTube URL if content type is YouTube
        if (data.contentType === "YouTube") {
          data.url = sanitizeYouTubeURL(data.url);
        }

        document.getElementById("contentTitle").textContent =
          data.title || "Untitled";
        document.getElementById("contentAuthor").textContent = `By ${
          data.author || "Unknown Author"
        }`;
        document.getElementById(
          "contentDate"
        ).textContent = `Published on ${moment(data.publishDate).format(
          "MMMM Do YYYY"
        )}`;

        const summarizeButton = document.getElementById("summarizeButton");
        if (summarizeButton) {
          summarizeButton.setAttribute("data-id", contentId);
        }

        renderStructuredContent(
          data.structuredContent || [],
          contentId,
          renderImages
        );

        // Store the content in the variable
        contentText = data.structuredContent
          .filter((item) => item.type === "paragraph")
          .map((item) => item.content)
          .join(" ");
      })
      .catch((error) => console.error("Error fetching content:", error));
  }
});
