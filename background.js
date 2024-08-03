chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ savedContent: [] }, () => {
    console.log("Initialized saved content storage.");
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "shareContent":
      chrome.storage.local.get(["savedContent"], function (result) {
        const savedContent = result.savedContent || [];
        fetch("http://localhost:3000/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.data),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Content saved successfully") {
              savedContent.push({ url: request.data.url, id: data.contentId });
              chrome.storage.local.set({ savedContent: savedContent }, () => {
                sendResponse({
                  success: true,
                  message: "Content shared successfully",
                  contentId: data.contentId,
                });
                // Broadcast WebSocket message
                const socket = new WebSocket("ws://localhost:3000");
                socket.addEventListener("open", () => {
                  socket.send(
                    JSON.stringify({
                      message: "Content saved",
                      content: { _id: data.contentId, ...request.data },
                    })
                  );
                });
              });
            } else {
              sendResponse({ success: false, error: data.message });
            }
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message });
          });
      });
      return true; // asynchronous response

    case "removeContent":
      chrome.storage.local.get(["savedContent"], function (result) {
        let savedContent = result.savedContent || [];
        const contentToRemove = savedContent.find(
          (c) => c.url === request.data.url
        );
        if (contentToRemove) {
          fetch("http://localhost:3000/api/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contentId: contentToRemove.id }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message === "Content removed successfully") {
                savedContent = savedContent.filter(
                  (c) => c.id !== contentToRemove.id
                );
                chrome.storage.local.set({ savedContent: savedContent }, () => {
                  sendResponse({
                    success: true,
                    message: "Content removed successfully",
                  });
                  // Broadcast WebSocket message
                  const socket = new WebSocket("ws://localhost:3000");
                  socket.addEventListener("open", () => {
                    socket.send(
                      JSON.stringify({
                        message: "Content removed",
                        contentId: contentToRemove.id,
                      })
                    );
                  });
                });
              } else {
                sendResponse({
                  success: false,
                  error: "Failed to remove content",
                });
              }
            })
            .catch((error) => {
              sendResponse({ success: false, error: "Network error" });
            });
          return true; // asynchronous response
        } else {
          sendResponse({ success: false, error: "Content not found locally" });
        }
        return true;
      });
      return true;

    case "checkContent":
      chrome.storage.local.get(["savedContent"], function (result) {
        const savedContent = result.savedContent || [];
        const isSaved = savedContent.some((c) => c.url === request.data.url);
        sendResponse({ saved: isSaved });
      });
      return true; // asynchronous response

    default:
      sendResponse({ success: false, error: "Invalid action" });
      return false;
  }
});
