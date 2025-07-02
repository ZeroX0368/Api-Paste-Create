
const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoint to create paste on sourcebin
app.get('/api/sourced', async (req, res) => {
  const prompt = req.query.prompt;
  const content = req.query.content;
  const description = req.query.description;
  const title = req.query.title || 'API Generated Paste';
  
  // Support multiple parameter names for content
  const finalContent = content || prompt || description;
  
  if (!finalContent) {
    return res.status(400).json({ 
      error: 'Missing content parameter. Use "content", "prompt", or "description"' 
    });
  }

  try {
    const pasteUrl = await createSourcebinPaste(finalContent, title);
    // Extract the paste key from the URL to create raw URL
    const pasteKey = pasteUrl.split('/').pop();
    const rawUrl = `https://cdn.sourceb.in/bins/${pasteKey}/0`;
    
    res.json({ 
      success: true,
      credits: 'bucu0368',
      url: pasteUrl,
      raw: rawUrl,
      content: finalContent,
      title: title
    });
  } catch (error) {
    console.error('Error creating paste:', error);
    res.status(500).json({ 
      error: 'Failed to create paste',
      message: error.message 
    });
  }
});

// Function to create paste on sourcebin
function createSourcebinPaste(content, title = "API Generated Paste") {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      files: [{
        name: "paste.txt",
        content: content,
        languageId: 1
      }],
      title: title,
      description: ""
    });

    const options = {
      hostname: 'sourceb.in',
      port: 443,
      path: '/api/bins',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'SourcebinAPI/1.0'
      }
    };

    const req = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        console.log('Response status:', response.statusCode);
        console.log('Response data:', data);
        
        try {
          if (response.statusCode === 200 || response.statusCode === 201) {
            const result = JSON.parse(data);
            if (result.key) {
              resolve(`https://sourceb.in/${result.key}`);
            } else {
              reject(new Error(`No key in response: ${data}`));
            }
          } else {
            reject(new Error(`HTTP ${response.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}



// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    success: 'true',
    message: 'Sourcebin API Server',
    usage: {
      endpoint: '/api/sourced',
      parameters: {
        'content (required)': 'Text content for the paste',
        'title (optional)': 'Title for the paste',
        'prompt (alternative)': 'Alternative to content parameter',
        'description (alternative)': 'Alternative to content parameter'
      },
      examples: [
        'GET /api/sourced?content=Hello World&title=My Paste',
        'GET /api/sourced?prompt=your_text_here'
      ]
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/sourced?prompt=test`);
});

