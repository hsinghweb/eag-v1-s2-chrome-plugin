// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    const apiKey = request.apiKey;
    const content = request.content;

    // Call the Gemini API to generate the summary
    generateSummary(content, apiKey)
      .then(summary => {
        sendResponse({ summary: summary });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });

    return true; // Required for async response
  }
});

async function generateSummary(content, apiKey) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please provide a concise summary of the following text:\n\n${content}`
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate summary');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error('Error generating summary: ' + error.message);
  }
}