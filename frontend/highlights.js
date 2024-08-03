document.addEventListener("DOMContentLoaded", function () {
  console.log("viewer.js script loaded");

  const urlParams = new URLSearchParams(window.location.search);
  const contentId = urlParams.get("id");

  if (!contentId) {
    alert("Content ID is missing from the URL");
    return;
  }

  async function renderStructuredContent(structuredContent, contentId) {
    const contentContainer = document.getElementById("content");
    contentContainer.innerHTML = "";

    structuredContent.forEach((element) => {
      let htmlElement;
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
          break;
        case "link":
          htmlElement = document.createElement("a");
          htmlElement.href = element.url;
          htmlElement.innerHTML = element.content;
          break;
      }
      contentContainer.appendChild(htmlElement);
    });

    // Restore highlights from the database
    try {
      const response = await fetch(
        `http://localhost:3000/api/highlights?contentId=${contentId}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const highlights = await response.json();
      highlights.forEach((highlight) => {
        highlightText(
          highlight.startOffset,
          highlight.endOffset,
          highlight._id
        );
      });
    } catch (error) {
      console.error("Error fetching highlights:", error);
    }
  }

  function highlightText(startOffset, endOffset, highlightId) {
    const range = document.createRange();
    const textNode = document.body.firstChild;

    range.setStart(textNode, startOffset);
    range.setEnd(textNode, endOffset);

    const mark = document.createElement("mark");
    mark.style.backgroundColor = "yellow";
    mark.style.cursor = "pointer";
    mark.dataset.highlightId = highlightId;

    try {
      range.surroundContents(mark);
    } catch (error) {
      console.error("Error highlighting text:", error);
    }
  }

  async function fetchSummary(content) {
    try {
      console.log("Fetching summary for content:", content); // Debugging line
      const response = await fetch("http://localhost:3000/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      console.log("Summary fetched:", data.summary); // Debugging line
      return data.summary;
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }

  async function summarizeContent(event) {
    event.stopPropagation(); // Stop the event from propagating
    console.log("Summarize button clicked"); // Debugging line
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
        .map((item) => item.content)
        .join(" ");
      console.log("Content to summarize:", content); // Debugging line
      const summary = await fetchSummary(content);
      document.getElementById("summary").innerText = summary;
    } catch (error) {
      console.error("Error summarizing content:", error);
    }
  }

  document
    .getElementById("summarizeButton")
    .addEventListener("click", summarizeContent);

  // Fetch content by ID
  fetch(`http://localhost:3000/api/content/${contentId}`)
    .then((response) => response.json())
    .then((data) => {
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

      if (data.imageUrl && data.imageUrl !== "default-thumbnail.png") {
        const contentImage = document.getElementById("contentImage");
        contentImage.src = data.imageUrl;
        contentImage.style.display = "block";
      }

      renderStructuredContent(data.structuredContent || [], contentId);

      // Store the category for highlights
      const category = data.category || "Uncategorized";

      // Highlight and Note Taking Functionality
      let selectedText = "";

      document.addEventListener("mouseup", (event) => {
        const selection = window.getSelection().toString().trim();
        console.log("Selection:", selection); // Debugging line
        if (selection.length > 0) {
          selectedText = selection;
          showTooltip(event.pageX, event.pageY, false);
        } else {
          hideTooltip();
        }
      });

      const tooltip = document.getElementById("tooltip");
      const noteModal = document.getElementById("noteModal");
      const noteTextarea = document.getElementById("noteTextarea");
      const saveNoteButton = document.getElementById("saveNoteButton");

      function showTooltip(x, y, isHighlighted) {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.classList.add("show");

        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (tooltipRect.right > viewportWidth) {
          tooltip.style.left = `${x - tooltipRect.width}px`;
        }
        if (tooltipRect.bottom > viewportHeight) {
          tooltip.style.top = `${y - tooltipRect.height}px`;
        }

        if (isHighlighted) {
          removeHighlightButton();
          addDeleteButton();
          addNoteButton();
        } else {
          removeDeleteButton();
          removeNoteButton();
          addHighlightButton();
        }
      }

      function addDeleteButton() {
        if (!document.getElementById("deleteButton")) {
          const deleteButton = document.createElement("button");
          deleteButton.id = "deleteButton";
          deleteButton.textContent = "Delete";
          deleteButton.addEventListener("click", () => {
            deleteHighlight();
            hideTooltip();
          });
          tooltip.appendChild(deleteButton);
        }
      }

      function removeDeleteButton() {
        const deleteButton = document.getElementById("deleteButton");
        if (deleteButton) {
          deleteButton.remove();
        }
      }

      function addHighlightButton() {
        if (!document.getElementById("highlightButton")) {
          const highlightButton = document.createElement("button");
          highlightButton.id = "highlightButton";
          highlightButton.textContent = "Highlight";
          highlightButton.addEventListener("click", () => {
            highlightSelection();
            saveHighlight();
            hideTooltip();
          });
          tooltip.appendChild(highlightButton);
        }
      }

      function removeHighlightButton() {
        const highlightButton = document.getElementById("highlightButton");
        if (highlightButton) {
          highlightButton.remove();
        }
      }

      function addNoteButton() {
        if (!document.getElementById("noteButton")) {
          const noteButton = document.createElement("button");
          noteButton.id = "noteButton";
          noteButton.textContent = "Take Notes";
          noteButton.addEventListener("click", () => {
            noteModal.style.display = "block";
            hideTooltip();
          });
          tooltip.appendChild(noteButton);
        }
      }

      function removeNoteButton() {
        const noteButton = document.getElementById("noteButton");
        if (noteButton) {
          noteButton.remove();
        }
      }

      function hideTooltip() {
        const tooltip = document.getElementById("tooltip");
        console.log("Hiding tooltip"); // Debugging line
        tooltip.classList.remove("show");
        console.log(
          "Tooltip display property:",
          tooltip.classList.contains("show")
        );
      }

      function wrapRangeWithMultipleMarks(range, uniqueId) {
        const fragment = document.createDocumentFragment();
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;
        const commonAncestor = range.commonAncestorContainer;

        function processNode(node, isStart, isEnd) {
          if (node.nodeType === Node.TEXT_NODE) {
            let text = node.textContent;
            if (isStart) {
              text = text.substring(range.startOffset);
            }
            if (isEnd) {
              text = text.substring(0, range.endOffset);
            }
            if (text.length > 0) {
              const mark = document.createElement("mark");
              mark.style.backgroundColor = "yellow";
              mark.style.cursor = "pointer";
              mark.dataset.highlightId = uniqueId;
              mark.textContent = text;
              return mark;
            }
            return null;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const newElement = node.cloneNode(false);
            for (let child of node.childNodes) {
              const processedChild = processNode(
                child,
                isStart && child === startContainer,
                isEnd && child === endContainer
              );
              if (processedChild) {
                newElement.appendChild(processedChild);
              }
            }
            return newElement;
          }
          return null;
        }

        const processedContent = processNode(
          commonAncestor,
          commonAncestor === startContainer,
          commonAncestor === endContainer
        );

        if (processedContent) {
          fragment.appendChild(processedContent);
        }

        range.deleteContents();
        range.insertNode(fragment);
      }

      function highlightSelection() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const uniqueId = `highlight-${new Date().getTime()}`;

        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        if (
          startContainer === endContainer &&
          startContainer.nodeType === Node.TEXT_NODE
        ) {
          const mark = document.createElement("mark");
          mark.style.backgroundColor = "yellow";
          mark.style.cursor = "pointer"; // Change cursor to pointer (hand)
          mark.dataset.highlightId = uniqueId; // Add unique ID
          range.surroundContents(mark);
        } else {
          wrapRangeWithMultipleMarks(range, uniqueId);
        }

        document
          .querySelectorAll(`[data-highlight-id="${uniqueId}"]`)
          .forEach((mark) => {
            mark.addEventListener("click", (event) => {
              showTooltip(event.pageX, event.pageY, true);
              window.latestHighlightElement = mark;
            });
          });

        // Store the latest highlighted element
        window.latestHighlightElement = document.querySelector(
          `[data-highlight-id="${uniqueId}"]`
        );
      }

      async function deleteHighlight() {
        try {
          const highlightElement = window.latestHighlightElement;
          if (!highlightElement) {
            console.error("No highlight to delete");
            return;
          }

          const highlightId = highlightElement.dataset.highlightId;
          if (!highlightId) {
            console.error("No highlight ID found");
            return;
          }

          const response = await fetch(
            `http://localhost:3000/api/highlights/${highlightId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            console.log("Highlight deleted successfully");
            // Remove the highlight from the UI
            const parent = highlightElement.parentNode;
            while (highlightElement.firstChild) {
              parent.insertBefore(
                highlightElement.firstChild,
                highlightElement
              );
            }
            parent.removeChild(highlightElement);
          } else {
            console.error("Error deleting highlight:", response.statusText);
          }
        } catch (error) {
          console.error("Error deleting highlight:", error);
        }
      }

      document
        .getElementById("highlightButton")
        .addEventListener("click", () => {
          highlightSelection();
          saveHighlight();
          hideTooltip(); // Add this line to close the tooltip
        });

      // Event listener to show tooltip on clicking highlighted text
      document.addEventListener("click", (event) => {
        const target = event.target;
        if (
          target.tagName === "MARK" &&
          target.style.backgroundColor === "yellow"
        ) {
          window.latestHighlightElement = target;
          showTooltip(event.pageX, event.pageY, true);
        }
      });

      document.getElementById("noteButton").addEventListener("click", () => {
        noteModal.style.display = "block";
        hideTooltip(); // Add this line to close the tooltip
      });

      document.getElementById("copyButton").addEventListener("click", () => {
        navigator.clipboard.writeText(selectedText);
        hideTooltip(); // Add this line to close the tooltip
      });

      document.querySelector(".close").addEventListener("click", () => {
        noteModal.style.display = "none";
      });

      saveNoteButton.addEventListener("click", async () => {
        const noteContent = noteTextarea.value;
        if (!noteContent.trim()) {
          alert("Note content cannot be empty");
          return;
        }

        const highlightId = await saveHighlight();
        if (highlightId) {
          await saveNote(noteContent, highlightId);
        }

        noteTextarea.value = "";
        noteModal.style.display = "none";
      });

      function showLoadingIndicator() {
        // Implement the logic to show a loading indicator
      }

      function hideLoadingIndicator() {
        // Implement the logic to hide the loading indicator
      }

      async function saveHighlight() {
        try {
          showLoadingIndicator(); // Show loading indicator

          const highlightElement = window.latestHighlightElement;
          const highlightId = highlightElement.dataset.highlightId;

          const response = await fetch("http://localhost:3000/api/highlights", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              articleId: contentId,
              text: selectedText,
              category: category,
              highlightId: highlightId,
            }),
          });

          const result = await response.json();
          console.log("Highlight saved:", result);

          window.latestHighlightId = result.highlight._id;
          highlightElement.dataset.highlightId = result.highlight._id;

          hideLoadingIndicator(); // Hide loading indicator

          return result.highlight._id;
        } catch (error) {
          console.error("Error saving highlight:", error);
          hideLoadingIndicator(); // Hide loading indicator in case of error
        }
      }

      async function saveNote(content, highlightId) {
        try {
          const response = await fetch("http://localhost:3000/api/notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              highlightId: highlightId,
              content,
            }),
          });

          if (!response.ok) {
            console.error("Failed to save note:", response.statusText);
          }

          const result = await response.json();
          console.log("Note saved:", result);
        } catch (error) {
          console.error("Error saving note:", error);
        }
      }
      async function saveHighlightAndNote() {
        try {
          const highlightId = await saveHighlight();
          if (highlightId) {
            await saveNote(noteTextarea.value, highlightId);
          }
        } catch (error) {
          console.error("Error saving highlight and note:", error);
          // Handle rollback if necessary
        } finally {
          noteTextarea.value = "";
          noteModal.style.display = "none";
        }
      }

      saveNoteButton.addEventListener("click", saveHighlightAndNote);
    })
    .catch((error) => console.error("Error fetching content:", error));

  // Event listener for summarize button
  document
    .querySelector(".btn-outline-secondary")
    .addEventListener("click", summarizeContent);
});
