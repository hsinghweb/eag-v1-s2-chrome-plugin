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

const RETRY_DELAY_MS = 1000; // Initial retry delay of 1 second
const MAX_RETRIES = 3;

async function generateSummary(content, apiKey) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  let retries = 0;
  let delay = RETRY_DELAY_MS;

  while (retries <= MAX_RETRIES) {
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
        const errorMessage = errorData.error?.message || 'Failed to generate summary';
        
        // Check if it's a quota exceeded error
        if (errorMessage.includes('Quota exceeded')) {
          if (retries < MAX_RETRIES) {
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            retries++;
            continue;
          }
          throw new Error('API rate limit exceeded. Please try again in a few minutes.');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (retries === MAX_RETRIES || !error.message.includes('Quota exceeded')) {
        throw new Error('Error generating summary: ' + error.message);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      retries++;
    }
  }
}