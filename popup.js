document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyButton = document.getElementById('saveKey');
  const summarizeButton = document.getElementById('summarize');
  const summaryDiv = document.getElementById('summary');
  const errorDiv = document.getElementById('error');
  const loadingDiv = document.getElementById('loading');

  // Load saved API key
  chrome.storage.local.get(['geminiApiKey'], function(result) {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  // Save API key
  saveKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ geminiApiKey: apiKey }, function() {
        alert('API key saved successfully!');
      });
    } else {
      showError('Please enter a valid API key');
    }
  });

  // Handle summarize button click
  summarizeButton.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showError('Please enter your Google Gemini API key');
      return;
    }

    showLoading();
    clearError();
    clearSummary();

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to get page content
      chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' }, async function(response) {
        if (chrome.runtime.lastError) {
          showError('Error accessing page content');
          hideLoading();
          return;
        }

        if (response && response.content) {
          // Send content to background script for summarization
          chrome.runtime.sendMessage({
            action: 'summarize',
            content: response.content,
            apiKey: apiKey
          }, function(response) {
            hideLoading();
            
            if (response.error) {
              showError(response.error);
            } else if (response.summary) {
              showSummary(response.summary);
            }
          });
        } else {
          hideLoading();
          showError('Could not extract page content');
        }
      });
    } catch (error) {
      hideLoading();
      showError('An error occurred: ' + error.message);
    }
  });

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    // Add a red border to make the error more noticeable
    errorDiv.style.border = '1px solid red';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.backgroundColor = '#fff2f2';
  }

  function clearError() {
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
    errorDiv.style.border = 'none';
    errorDiv.style.padding = '0';
    errorDiv.style.backgroundColor = 'transparent';
  }

  function showSummary(text) {
    summaryDiv.textContent = text;
  }

  function clearSummary() {
    summaryDiv.textContent = '';
  }

  function showLoading() {
    loadingDiv.style.display = 'block';
  }

  function hideLoading() {
    loadingDiv.style.display = 'none';
  }
});