// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getPageContent') {
    // Get the main content of the page
    const content = document.body.innerText;
    
    // Check content length (assuming a reasonable limit of 30,000 characters)
    if (content.length > 30000) {
      sendResponse({
        error: 'Content length exceeds the supported limit. Please try with a shorter page.'
      });
    } else {
      sendResponse({
        content: content
      });
    }
  }
  return true; // Required for async response
});