// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getPageContent') {
    // Get the selected text or inform user to select text
    const selectedText = window.getSelection().toString().trim();
    
    if (!selectedText) {
      sendResponse({
        error: 'Please select some text on the page to summarize.'
      });
      return true;
    }
    
    // Check content length (assuming a reasonable limit of 30,000 characters)
    if (selectedText.length > 30000) {
      sendResponse({
        error: 'Selected text length exceeds the supported limit. Please select less text.'
      });
    } else {
      sendResponse({
        content: selectedText
      });
    }
  }
  return true; // Required for async response
});