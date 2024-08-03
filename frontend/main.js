// document.addEventListener("DOMContentLoaded", function () {
//   // Function to format date in relative terms
//   function formatRelativeDate(date) {
//     const now = moment();
//     const savedDate = moment(date);
//     const diff = now.diff(savedDate, "days");

//     if (diff < 1) return savedDate.fromNow(); // less than a day ago
//     if (diff < 30) return savedDate.fromNow(); // less than a month ago
//     if (diff < 90) return "more than a month ago";
//     if (diff < 180) return "more than three months ago";
//     return "more than 6 months ago";
//   }

//   // Function to create a content item
//   function createContentItem(item) {
//     const contentItem = document.createElement("div");
//     contentItem.classList.add("col-md-4", "grid-margin", "stretch-card");
//     const relativeDate = formatRelativeDate(item.date);
//     const exactDate = moment(item.date).format("MMMM Do YYYY, h:mm:ss a");
//     contentItem.innerHTML = `
//         <div class="card">
//             <div class="card-body">
//                 <div class="chartjs-size-monitor">
//                     <div class="chartjs-size-monitor-expand">
//                         <div class=""></div>
//                     </div>
//                     <div class="chartjs-size-monitor-shrink">
//                         <div class=""></div>
//                     </div>
//                 </div>
//                 <h5 class="card-title">${item.title || "Untitled"}</h5>

//                 <div class="card-tags">
//                     ${item.tags
//                       .split(",")
//                       .map(
//                         (tag) =>
//                           `<span class="badge bg-secondary me-1">${tag}</span>`
//                       )
//                       .join("")}
//                 </div>

//                 <div class="card-people mt-auto">
//                     <div class="image-wrapper">
//                         <img src="${
//                           item.imageUrl || "default-thumbnail.png"
//                         }" alt="${item.title}">
//                             <div class="overlay">
//                                 <div class="weather-info">
//                                           <div class="d-flex">
//                                                 <div class="ml-2">
//                                                     <h4 class="location font-weight-normal">${
//                                                       item.category ||
//                                                       "Uncategorized"
//                                                     }</h4>
//                                                     <small class="small-custom" title="${exactDate}">${relativeDate}</small>
//                                                 </div>
//                                           </div>
//                                 </div>
//                             </div>
//                     </div>
//                 </div>
//                 <div class="d-flex justify-content-center align-items-center mt-3">
//                     <div class="btn-group">
//                         <button type="button" class="btn btn-sm btn-outline-secondary view-button" data-id="${
//                           item._id
//                         }"><i class="ti-eye"></i></button>
//                         <button type="button" class="btn btn-sm btn-outline-secondary share-button" data-url="${
//                           item.url
//                         }"><i class="ti-clipboard"></i></button>
//                         <button type="button" class="btn btn-sm btn-outline-secondary remove-button" data-id="${
//                           item._id
//                         }"><i class="ti-trash"></i></button>
//                         <button type="button" class="btn btn-sm btn-outline-secondary more-button" data-id="${
//                           item._id
//                         }"><i class="icon-ellipsis"></i></button>
//                     </div>

//                 </div>
//             </div>
//         </div>
//     `;
//     return contentItem;
//   }

//   // Function to render content items
//   function renderContentItems(items) {
//     const contentList = document.getElementById("contentList");
//     // Clear any existing content
//     contentList.innerHTML = "";

//     // Add content items
//     items.forEach((item) => {
//       const contentItem = createContentItem(item);
//       contentList.appendChild(contentItem);
//     });

//     // Add event listeners for the view, share, remove, and more buttons
//     document.querySelectorAll(".view-button").forEach((button) => {
//       button.addEventListener("click", function () {
//         const contentId = this.getAttribute("data-id");
//         window.location.href = `viewer.html?id=${contentId}`;
//       });
//     });

//     document.querySelectorAll(".share-button").forEach((button) => {
//       button.addEventListener("click", function () {
//         const url = this.getAttribute("data-url");
//         navigator.clipboard
//           .writeText(url)
//           .then(() => {
//             showToast("Link copied to clipboard!", "success");
//           })
//           .catch((err) => {
//             console.error("Error copying text: ", err);
//             showToast("Error copying link!", "danger");
//           });
//       });
//     });

//     document.querySelectorAll(".remove-button").forEach((button) => {
//       button.addEventListener("click", function () {
//         const contentId = this.getAttribute("data-id");
//         fetch("http://localhost:3000/api/remove", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ contentId }),
//         })
//           .then((response) => response.json())
//           .then((data) => {
//             if (data.message === "Content removed successfully") {
//               showToast(data.message, "success");
//               // Re-fetch content items
//               fetchContentItems();
//             } else {
//               showToast(data.message, "danger");
//             }
//           })
//           .catch((error) => {
//             console.error("Error removing content:", error);
//             showToast("Error removing content!", "danger");
//           });
//       });
//     });

//     document.querySelectorAll(".more-button").forEach((button) => {
//       button.addEventListener("click", function () {
//         const contentId = this.getAttribute("data-id");
//         const contentItem = items.find((item) => item._id === contentId);
//         document.getElementById("moreContentId").value = contentId;
//         document.getElementById("moreCategory").value =
//           contentItem.category || "";
//         moreTags = contentItem.tags ? contentItem.tags.split(",") : [];
//         updateMoreTagsDisplay();
//         moreContentModal.show();
//       });
//     });
//   }

//   // Function to show toast notification
//   function showToast(message, type) {
//     const toastPlaceholder = document.getElementById("alertPlaceholder");
//     const wrapper = document.createElement("div");
//     wrapper.className = `toast alert-${type} fade hide`;
//     wrapper.setAttribute("role", "alert");
//     wrapper.setAttribute("aria-live", "assertive");
//     wrapper.setAttribute("aria-atomic", "true");

//     wrapper.innerHTML = `
//     <div class="toast-header">
//       <strong class="mr-auto">Notification</strong>
//       <small class="text-muted">Just now</small>
//       <button type="button" class="ml-2 mb-1 close" data-bs-dismiss="toast" aria-label="Close">
//         <span aria-hidden="true">&times;</span>
//       </button>
//     </div>
//     <div class="toast-body">
//       ${message}
//     </div>
//   `;

//     toastPlaceholder.append(wrapper);

//     // Initialize and show the toast
//     $(wrapper).toast({ delay: 5000 });
//     $(wrapper).toast("show");
//   }

//   // Fetch content items from the backend
//   // Fetch all content items
//   function fetchContentItems() {
//     fetch("http://localhost:3000/api/content", {
//       credentials: "include", // Include credentials in the request
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         renderContentItems(data);
//       })
//       .catch((error) => console.error("Error fetching content:", error));
//   }

//   // Add Content Modal Logic
//   const addContentModal = new bootstrap.Modal(
//     document.getElementById("addContentModal")
//   );
//   const addContentForm = document.getElementById("addContentForm");
//   const addTagsInput = document.getElementById("addTags");
//   const addTagsContainer = document.getElementById("addTagsContainer");
//   let addTags = [];

//   addTagsInput.addEventListener("keydown", function (event) {
//     if (event.key === "Enter" && this.value.trim() !== "") {
//       event.preventDefault();
//       const tagValue = this.value.trim();
//       addTags.push(tagValue);
//       updateAddTagsDisplay();
//       this.value = "";
//     }
//   });

//   function updateAddTagsDisplay() {
//     addTagsContainer.innerHTML = "";
//     addTags.forEach((tag, index) => {
//       const tagSpan = document.createElement("span");
//       tagSpan.textContent = tag;
//       tagSpan.className = "badge bg-secondary me-1";
//       const closeBtn = document.createElement("span");
//       closeBtn.textContent = "×";
//       closeBtn.className = "ms-1";
//       closeBtn.style.cursor = "pointer";
//       closeBtn.onclick = function () {
//         addTags.splice(index, 1);
//         updateAddTagsDisplay();
//       };
//       tagSpan.appendChild(closeBtn);
//       addTagsContainer.appendChild(tagSpan);
//     });
//   }

//   addContentForm.addEventListener("submit", function (event) {
//     event.preventDefault();

//     const url = document.getElementById("addUrl").value.trim();
//     const category = document.getElementById("addCategory").value.trim();

//     let contentType = "Article";
//     if (url.includes("youtube.com/watch")) {
//       contentType = "YouTube";
//     }

//     const data = {
//       url,
//       category,
//       tags: addTags.length > 0 ? addTags.join(", ") : "No tags", // Set default tag
//       contentType,
//     };

//     fetch("http://localhost:3000/api/save", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.message === "Content saved successfully") {
//           showToast(data.message, "success");
//           addContentModal.hide();
//           fetchContentItems();
//         } else {
//           showToast(data.message, "danger");
//         }
//       })
//       .catch((error) => {
//         console.error("Error saving content:", error);
//         showToast("Error saving content!", "danger");
//       });
//   });

//   // Event listener for CTRL+V to add URL as content
//   document.addEventListener("paste", function (event) {
//     if (
//       !document.activeElement.classList.contains("form-control") &&
//       event.clipboardData
//     ) {
//       const pastedText = event.clipboardData.getData("text");
//       try {
//         const url = new URL(pastedText);
//         const contentType = url.hostname.includes("youtube.com")
//           ? "YouTube"
//           : "Article";
//         const data = {
//           url: pastedText,
//           category: "",
//           tags: "",
//           contentType,
//         };
//         fetch("http://localhost:3000/api/save", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(data),
//         })
//           .then((response) => response.json())
//           .then((data) => {
//             if (data.message === "Content saved successfully") {
//               showToast(data.message, "success");
//               fetchContentItems();
//             } else {
//               showToast(data.message, "danger");
//             }
//           })
//           .catch((error) => {
//             console.error("Error saving content:", error);
//             showToast("Error saving content!", "danger");
//           });
//       } catch (e) {
//         console.error("Invalid URL pasted");
//       }
//     }
//   });

//   // More Content Modal Logic
//   const moreContentModal = new bootstrap.Modal(
//     document.getElementById("moreContentModal")
//   );
//   const moreContentForm = document.getElementById("moreContentForm");
//   const moreTagsInput = document.getElementById("moreTags");
//   const moreTagsContainer = document.getElementById("moreTagsContainer");
//   let moreTags = [];

//   moreTagsInput.addEventListener("keydown", function (event) {
//     if (event.key === "Enter" && this.value.trim() !== "") {
//       event.preventDefault();
//       const tagValue = this.value.trim();
//       moreTags.push(tagValue);
//       updateMoreTagsDisplay();
//       this.value = "";
//     }
//   });

//   function updateMoreTagsDisplay() {
//     moreTagsContainer.innerHTML = "";
//     moreTags.forEach((tag, index) => {
//       const tagSpan = document.createElement("span");
//       tagSpan.textContent = tag;
//       tagSpan.className = "badge bg-secondary me-1";
//       const closeBtn = document.createElement("span");
//       closeBtn.textContent = "×";
//       closeBtn.className = "ms-1";
//       closeBtn.style.cursor = "pointer";
//       closeBtn.onclick = function () {
//         moreTags.splice(index, 1);
//         updateMoreTagsDisplay();
//       };
//       tagSpan.appendChild(closeBtn);
//       moreTagsContainer.appendChild(tagSpan);
//     });
//   }

//   moreContentForm.addEventListener("submit", function (event) {
//     event.preventDefault();

//     const contentId = document.getElementById("moreContentId").value;
//     const category = document.getElementById("moreCategory").value.trim();
//     const tags = moreTags.length > 0 ? moreTags.join(", ") : "No tags"; // Set default tag

//     fetch(`http://localhost:3000/api/content/${contentId}`, {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ category, tags }),
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.message === "Content updated successfully") {
//           showToast(data.message, "success");
//           moreContentModal.hide();
//           fetchContentItems();
//         } else {
//           showToast(data.message, "danger");
//         }
//       })
//       .catch((error) => {
//         console.error("Error updating content:", error);
//         showToast("Error updating content!", "danger");
//       });
//   });

//   fetchContentItems();

//   // WebSocket client setup
//   const socket = new WebSocket("ws://localhost:3000");

//   socket.addEventListener("message", function (event) {
//     const message = JSON.parse(event.data);
//     if (
//       message.message === "Content saved" ||
//       message.message === "Content removed"
//     ) {
//       fetchContentItems();
//     }
//   });

//   // Function to show loading message
//   function showLoadingMessage(message) {
//     const loadingMessage = document.createElement("div");
//     loadingMessage.id = "loadingMessage";
//     loadingMessage.style.position = "fixed";
//     loadingMessage.style.top = "50%";
//     loadingMessage.style.left = "50%";
//     loadingMessage.style.transform = "translate(-50%, -50%)";
//     loadingMessage.style.backgroundColor = "#fff";
//     loadingMessage.style.padding = "20px";
//     loadingMessage.style.border = "1px solid #ccc";
//     loadingMessage.style.zIndex = "1000";
//     loadingMessage.innerText = message;
//     document.body.appendChild(loadingMessage);
//   }

//   // Function to remove loading message
//   function removeLoadingMessage() {
//     const loadingMessage = document.getElementById("loadingMessage");
//     if (loadingMessage) {
//       document.body.removeChild(loadingMessage);
//     }
//   }

//   // Function to fetch Pocket items
//   function fetchPocketItems() {
//     showLoadingMessage("Content is syncing...");
//     fetch("http://localhost:3000/api/pocket/items", {
//       credentials: "include", // Include credentials in the request
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.error) {
//           console.error("Error fetching Pocket items:", data.error);
//         } else {
//           console.log("Pocket items fetched and saved:", data);
//           fetchContentItems(); // Re-fetch all content items including newly saved Pocket items
//         }
//         removeLoadingMessage();
//       })
//       .catch((error) => {
//         console.error("Error fetching Pocket items:", error);
//         removeLoadingMessage();
//       });
//   }

//   // Listen for Pocket authentication message
//   window.addEventListener("message", function (event) {
//     if (event.data === "pocket-authenticated") {
//       fetchPocketItems();
//     }
//   });

//   document
//     .getElementById("importPocket")
//     .addEventListener("click", function (event) {
//       event.preventDefault();
//       fetch("http://localhost:3000/api/pocket/start", {
//         credentials: "include", // Include credentials in the request
//       })
//         .then((response) => response.json())
//         .then((data) => {
//           console.log("Pocket authorization URL:", data.authorization_url);
//           if (data.authorization_url) {
//             window.open(
//               data.authorization_url,
//               "_blank",
//               "width=600,height=600"
//             );
//           } else {
//             console.error("No authorization URL received.");
//           }
//         })
//         .catch((error) => {
//           console.error("Error initiating Pocket integration:", error);
//         });
//     });

//   // Fetch all content items
//   function fetchContentItems() {
//     fetch("http://localhost:3000/api/content", {
//       credentials: "include", // Include credentials in the request
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         renderContentItems(data);
//       })
//       .catch((error) => console.error("Error fetching content:", error));
//   }
// });

document.addEventListener("DOMContentLoaded", function () {
  // Function to format date in relative terms
  function formatRelativeDate(date) {
    const now = moment();
    const savedDate = moment(date);
    const diff = now.diff(savedDate, "days");

    if (diff < 1) return savedDate.fromNow(); // less than a day ago
    if (diff < 30) return savedDate.fromNow(); // less than a month ago
    if (diff < 90) return "more than a month ago";
    if (diff < 180) return "more than three months ago";
    return "more than 6 months ago";
  }

  // Function to create a content item
  function createContentItem(item) {
    const contentItem = document.createElement("div");
    contentItem.classList.add("col-md-4", "grid-margin", "stretch-card");
    const relativeDate = formatRelativeDate(item.date);
    const exactDate = moment(item.date).format("MMMM Do YYYY, h:mm:ss a");
    contentItem.innerHTML = `
      <div class="card">
        <div class="card-body">
          <div class="chartjs-size-monitor">
            <div class="chartjs-size-monitor-expand">
              <div class=""></div>
            </div>
            <div class="chartjs-size-monitor-shrink">
              <div class=""></div>
            </div>
          </div>
          <h5 class="card-title truncate-title">${item.title || "Untitled"}</h5>
          <div class="card-tags">
            ${item.tags
              .split(",")
              .map(
                (tag) => `<span class="badge bg-secondary me-1">${tag}</span>`
              )
              .join("")}
          </div>
          <div class="card-people mt-auto">
            <div class="image-wrapper">
              <img src="${item.imageUrl || "default-thumbnail.png"}" alt="${
      item.title
    }">
              <div class="overlay">
                <div class="weather-info">
                  <div class="d-flex">
                    <div class="ml-2">
                      <h4 class="location font-weight-normal">${
                        item.category || "Uncategorized"
                      }</h4>
                      <small class="small-custom" title="${exactDate}">${relativeDate}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-center align-items-center mt-3">
            <div class="btn-group">
              <button type="button" class="btn btn-sm btn-outline-secondary view-button" data-id="${
                item._id
              }"><i class="ti-eye"></i></button>
              <button type="button" class="btn btn-sm btn-outline-secondary share-button" data-url="${
                item.url
              }"><i class="ti-clipboard"></i></button>
              <button type="button" class="btn btn-sm btn-outline-secondary remove-button" data-id="${
                item._id
              }"><i class="ti-trash"></i></button>
              <button type="button" class="btn btn-sm btn-outline-secondary more-button" data-id="${
                item._id
              }"><i class="icon-ellipsis"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
    return contentItem;
  }

  // Function to render content items
  function renderContentItems(items) {
    const contentList = document.getElementById("contentList");
    contentList.innerHTML = "";

    items.forEach((item) => {
      const contentItem = createContentItem(item);
      contentList.appendChild(contentItem);
    });

    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", function () {
        const contentId = this.getAttribute("data-id");
        window.location.href = `viewer.html?id=${contentId}`;
      });
    });

    document.querySelectorAll(".share-button").forEach((button) => {
      button.addEventListener("click", function () {
        const url = this.getAttribute("data-url");
        navigator.clipboard
          .writeText(url)
          .then(() => {
            showToast("Link copied to clipboard!", "success");
          })
          .catch((err) => {
            console.error("Error copying text: ", err);
            showToast("Error copying link!", "danger");
          });
      });
    });

    document.querySelectorAll(".remove-button").forEach((button) => {
      button.addEventListener("click", function () {
        const contentId = this.getAttribute("data-id");
        fetch("http://localhost:3000/api/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Content removed successfully") {
              showToast(data.message, "success");
              fetchContentItems();
            } else {
              showToast(data.message, "danger");
            }
          })
          .catch((error) => {
            console.error("Error removing content:", error);
            showToast("Error removing content!", "danger");
          });
      });
    });

    document.querySelectorAll(".more-button").forEach((button) => {
      button.addEventListener("click", function () {
        const contentId = this.getAttribute("data-id");
        const contentItem = items.find((item) => item._id === contentId);
        document.getElementById("moreContentId").value = contentId;
        document.getElementById("moreCategory").value =
          contentItem.category || "";
        moreTags = contentItem.tags ? contentItem.tags.split(",") : [];
        updateMoreTagsDisplay();
        moreContentModal.show();
      });
    });

    // Call truncateTitles after rendering content items
    if (typeof truncateTitles === "function") {
      truncateTitles();
    }
  }

  function showToast(message, type) {
    const toastPlaceholder = document.getElementById("alertPlaceholder");
    const wrapper = document.createElement("div");
    wrapper.className = `toast alert-${type} fade hide`;
    wrapper.setAttribute("role", "alert");
    wrapper.setAttribute("aria-live", "assertive");
    wrapper.setAttribute("aria-atomic", "true");

    wrapper.innerHTML = `
      <div class="toast-header">
        <strong class="mr-auto">Notification</strong>
        <small class="text-muted">Just now</small>
        <button type="button" class="ml-2 mb-1 close" data-bs-dismiss="toast" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;

    toastPlaceholder.append(wrapper);

    $(wrapper).toast({ delay: 5000 });
    $(wrapper).toast("show");
  }

  // Fetch all content items
  function fetchContentItems() {
    fetch("http://localhost:3000/api/content", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        renderContentItems(data);
      })
      .catch((error) => console.error("Error fetching content:", error));
  }

  // Add Content Modal Logic
  const addContentModal = new bootstrap.Modal(
    document.getElementById("addContentModal")
  );
  const addContentForm = document.getElementById("addContentForm");
  const addTagsInput = document.getElementById("addTags");
  const addTagsContainer = document.getElementById("addTagsContainer");
  let addTags = [];

  addTagsInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && this.value.trim() !== "") {
      event.preventDefault();
      const tagValue = this.value.trim();
      addTags.push(tagValue);
      updateAddTagsDisplay();
      this.value = "";
    }
  });

  function updateAddTagsDisplay() {
    addTagsContainer.innerHTML = "";
    addTags.forEach((tag, index) => {
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tag;
      tagSpan.className = "badge bg-secondary me-1";
      const closeBtn = document.createElement("span");
      closeBtn.textContent = "×";
      closeBtn.className = "ms-1";
      closeBtn.style.cursor = "pointer";
      closeBtn.onclick = function () {
        addTags.splice(index, 1);
        updateAddTagsDisplay();
      };
      tagSpan.appendChild(closeBtn);
      addTagsContainer.appendChild(tagSpan);
    });
  }

  addContentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const url = document.getElementById("addUrl").value.trim();
    const category = document.getElementById("addCategory").value.trim();

    let contentType = "Article";
    if (url.includes("youtube.com/watch")) {
      contentType = "YouTube";
    }

    const data = {
      url,
      category,
      tags: addTags.length > 0 ? addTags.join(", ") : "No tags",
      contentType,
    };

    fetch("http://localhost:3000/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Content saved successfully") {
          showToast(data.message, "success");
          addContentModal.hide();
          fetchContentItems();
        } else {
          showToast(data.message, "danger");
        }
      })
      .catch((error) => {
        console.error("Error saving content:", error);
        showToast("Error saving content!", "danger");
      });
  });

  document.addEventListener("paste", function (event) {
    if (
      !document.activeElement.classList.contains("form-control") &&
      event.clipboardData
    ) {
      const pastedText = event.clipboardData.getData("text");
      try {
        const url = new URL(pastedText);
        const contentType = url.hostname.includes("youtube.com")
          ? "YouTube"
          : "Article";
        const data = { url: pastedText, category: "", tags: "", contentType };
        fetch("http://localhost:3000/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Content saved successfully") {
              showToast(data.message, "success");
              fetchContentItems();
            } else {
              showToast(data.message, "danger");
            }
          })
          .catch((error) => {
            console.error("Error saving content:", error);
            showToast("Error saving content!", "danger");
          });
      } catch (e) {
        console.error("Invalid URL pasted");
      }
    }
  });

  // More Content Modal Logic
  const moreContentModal = new bootstrap.Modal(
    document.getElementById("moreContentModal")
  );
  const moreContentForm = document.getElementById("moreContentForm");
  const moreTagsInput = document.getElementById("moreTags");
  const moreTagsContainer = document.getElementById("moreTagsContainer");
  let moreTags = [];

  moreTagsInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && this.value.trim() !== "") {
      event.preventDefault();
      const tagValue = this.value.trim();
      moreTags.push(tagValue);
      updateMoreTagsDisplay();
      this.value = "";
    }
  });

  function updateMoreTagsDisplay() {
    moreTagsContainer.innerHTML = "";
    moreTags.forEach((tag, index) => {
      const tagSpan = document.createElement("span");
      tagSpan.textContent = tag;
      tagSpan.className = "badge bg-secondary me-1";
      const closeBtn = document.createElement("span");
      closeBtn.textContent = "×";
      closeBtn.className = "ms-1";
      closeBtn.style.cursor = "pointer";
      closeBtn.onclick = function () {
        moreTags.splice(index, 1);
        updateMoreTagsDisplay();
      };
      tagSpan.appendChild(closeBtn);
      moreTagsContainer.appendChild(tagSpan);
    });
  }

  moreContentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const contentId = document.getElementById("moreContentId").value;
    const category = document.getElementById("moreCategory").value.trim();
    const tags = moreTags.length > 0 ? moreTags.join(", ") : "No tags";

    fetch(`http://localhost:3000/api/content/${contentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, tags }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Content updated successfully") {
          showToast(data.message, "success");
          moreContentModal.hide();
          fetchContentItems();
        } else {
          showToast(data.message, "danger");
        }
      })
      .catch((error) => {
        console.error("Error updating content:", error);
        showToast("Error updating content!", "danger");
      });
  });

  fetchContentItems();

  const socket = new WebSocket("ws://localhost:3000");

  socket.addEventListener("message", function (event) {
    const message = JSON.parse(event.data);
    if (
      message.message === "Content saved" ||
      message.message === "Content removed"
    ) {
      fetchContentItems();
    }
  });

  function showLoadingMessage(message) {
    const loadingMessage = document.createElement("div");
    loadingMessage.id = "loadingMessage";
    loadingMessage.style.position = "fixed";
    loadingMessage.style.top = "50%";
    loadingMessage.style.left = "50%";
    loadingMessage.style.transform = "translate(-50%, -50%)";
    loadingMessage.style.backgroundColor = "#fff";
    loadingMessage.style.padding = "20px";
    loadingMessage.style.border = "1px solid #ccc";
    loadingMessage.style.zIndex = "1000";
    loadingMessage.innerText = message;
    document.body.appendChild(loadingMessage);
  }

  function removeLoadingMessage() {
    const loadingMessage = document.getElementById("loadingMessage");
    if (loadingMessage) {
      document.body.removeChild(loadingMessage);
    }
  }

  function fetchPocketItems() {
    showLoadingMessage("Content is syncing...");
    fetch("http://localhost:3000/api/pocket/items", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error fetching Pocket items:", data.error);
        } else {
          fetchContentItems();
        }
        removeLoadingMessage();
      })
      .catch((error) => {
        console.error("Error fetching Pocket items:", error);
        removeLoadingMessage();
      });
  }

  window.addEventListener("message", function (event) {
    if (event.data === "pocket-authenticated") {
      fetchPocketItems();
    }
  });

  document
    .getElementById("importPocket")
    .addEventListener("click", function (event) {
      event.preventDefault();
      fetch("http://localhost:3000/api/pocket/start", {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.authorization_url) {
            window.open(
              data.authorization_url,
              "_blank",
              "width=600,height=600"
            );
          } else {
            console.error("No authorization URL received.");
          }
        })
        .catch((error) => {
          console.error("Error initiating Pocket integration:", error);
        });
    });

  fetchContentItems();
});
