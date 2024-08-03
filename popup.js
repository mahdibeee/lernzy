document.addEventListener("DOMContentLoaded", function () {
  let tags = [];
  let savingStartTime = 0; // Variable to track when saving starts
  let savedContentId = null;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    let url = activeTab.url;
    let title = activeTab.title;
    document.getElementById("contentTitle").textContent = title;
    document.getElementById("contentDomain").textContent = new URL(
      url
    ).hostname;

    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        let imageUrl =
          doc.querySelector('meta[property="og:image"]')?.content ||
          doc.querySelector('meta[name="twitter:image"]')?.content ||
          doc.querySelector('link[rel="icon"]')?.href ||
          doc.querySelector('link[rel="shortcut icon"]')?.href ||
          "default-thumbnail.png";

        if (!imageUrl.startsWith("http")) {
          imageUrl = new URL(imageUrl, url).href;
        }
        document.getElementById("contentImage").src = imageUrl;
      })
      .catch((error) => console.error("Error fetching page content:", error));

    checkIfContentSaved(url);
  });

  document
    .getElementById("tags-input")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter" && this.value.trim() !== "") {
        event.preventDefault();
        if (tags.length >= 3) {
          alert("You can only add up to three tags.");
          return;
        }
        const tagValue = this.value.trim();
        tags.push(tagValue);
        updateTagsDisplay();
        this.value = "";
      }
    });

  function updateTagsDisplay() {
    const container = document.getElementById("tags-container");
    container.innerHTML = "";
    tags.forEach((tag, index) => {
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tag;
      tagSpan.className = "tag";
      const closeBtn = document.createElement("span");
      closeBtn.textContent = "×";
      closeBtn.className = "tag-close";
      closeBtn.onclick = function () {
        tags.splice(index, 1);
        updateTagsDisplay();
      };
      tagSpan.appendChild(closeBtn);
      container.appendChild(tagSpan);
    });
  }

  document
    .getElementById("saveButton")
    .addEventListener("click", function (event) {
      event.preventDefault();
      let category = document.getElementById("category").value.trim();
      savingStartTime = Date.now();
      showSavingAnimation();

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let activeTab = tabs[0];
        let url = activeTab.url;
        let title = activeTab.title;
        let imageUrl = document.getElementById("contentImage").src;

        let contentType = "Article";
        if (url.includes("youtube.com/watch")) {
          contentType = "YouTube";
        }

        const data = {
          url,
          title,
          category,
          tags: tags.join(", "),
          imageUrl,
          contentType,
        };

        fetch("http://localhost:3000/api/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Content saved successfully") {
              console.log("Content saved successfully.");
              savedContentId = data.contentId;
              toggleSaveRemoveButtons(true);
              showAlert("Content saved successfully!", "success");
            } else {
              throw new Error(data.message);
            }
          })
          .catch((error) => {
            console.error("Error saving content:", error);
            showAlert("Error saving content!", "danger");
          })
          .finally(() => {
            hideSavingAnimation();
          });
      });
    });

  document
    .getElementById("removeButton")
    .addEventListener("click", function (event) {
      event.preventDefault();
      if (!savedContentId) {
        console.error("No content ID found for removal.");
        return;
      }

      console.log("Removing content with ID:", savedContentId);

      fetch("http://localhost:3000/api/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentId: savedContentId }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Content removed successfully") {
            console.log("Content removed successfully.");
            toggleSaveRemoveButtons(false);
            savedContentId = null;
            showAlert("Content removed successfully!", "success");
          } else {
            throw new Error(data.message);
          }
        })
        .catch((error) => {
          console.error("Error removing content:", error);
          showAlert("Error removing content!", "danger");
        });
    });

  function toggleSaveRemoveButtons(isSaved) {
    const saveButton = document.getElementById("saveButton");
    const removeButton = document.getElementById("removeButton");

    if (isSaved) {
      saveButton.style.display = "none";
      removeButton.style.display = "inline";
    } else {
      saveButton.style.display = "inline";
      removeButton.style.display = "none";
    }
  }

  function checkIfContentSaved(url) {
    fetch(
      `http://localhost:3000/api/checkContent?url=${encodeURIComponent(url)}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.saved) {
          console.log("Content is already saved with ID:", data.content._id);
          savedContentId = data.content._id; // Save the content ID for removal
          toggleSaveRemoveButtons(true);
        } else {
          toggleSaveRemoveButtons(false);
        }
      })
      .catch((error) => {
        console.error("Error checking content:", error);
        showAlert("Error checking content!", "danger");
      });
  }

  function showSavingAnimation() {
    const dotsSpan = document.getElementById("dots");
    document.getElementById("savingStatus").style.display = "";
    let dotCount = 0;
    dotsSpan.intervalId = setInterval(() => {
      dotsSpan.textContent = ".".repeat((dotCount % 3) + 1);
      dotCount++;
    }, 500); // Change dots every 500ms
  }

  function hideSavingAnimation() {
    const minimumDisplayTime = 2000; // Minimum display time in milliseconds
    const displayedTime = Date.now() - savingStartTime;

    if (displayedTime < minimumDisplayTime) {
      setTimeout(() => {
        clearInterval(document.getElementById("dots").intervalId);
        document.getElementById("savingStatus").style.display = "none";
      }, minimumDisplayTime - displayedTime);
    } else {
      clearInterval(document.getElementById("dots").intervalId);
      document.getElementById("savingStatus").style.display = "none";
    }
  }

  function showAlert(message, type) {
    const alertPlaceholder = document.getElementById("alertPlaceholder");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    alertPlaceholder.append(wrapper);
  }
});
