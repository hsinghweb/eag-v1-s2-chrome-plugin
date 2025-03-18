// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    const apiKey = request.apiKey;
    const content = request.content;

    // Call the DeepSeek API to generate the summary
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
  const apiUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';
  let retries = 0;
  let delay = RETRY_DELAY_MS;

  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `[INST]Summarize:\n\n${content}[/INST]`,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.15
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to generate summary';
        
        // Check if it's a rate limit error
        if (response.status === 429) {
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
      return data[0].generated_text.trim();
    } catch (error) {
      // Check if we've hit max retries or if it's not a rate limit error
      if (retries === MAX_RETRIES || (error.name !== 'TypeError' && error.message !== 'Failed to fetch')) {
        throw new Error('Error generating summary: ' + error.message);
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      retries++;
    }
  }
}