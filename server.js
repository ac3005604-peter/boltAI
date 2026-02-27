const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = '88888888';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const safeFilename = `${timestamp}-${nameWithoutExt}${ext}`;
    cb(null, safeFilename);
  }
});

const upload = multer({ storage });

const db = new sqlite3.Database('./portfolio.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Database table initialized');
    }
  });
}

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional Portfolio - Home</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        nav {
          background: #2d3748;
          padding: 1rem 2rem;
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        nav a {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background 0.3s;
        }
        nav a:hover {
          background: #4a5568;
        }
        nav a.active {
          background: #667eea;
        }
        .content {
          padding: 3rem 2rem;
        }
        h1 {
          color: #2d3748;
          margin-bottom: 1.5rem;
          font-size: 2.5rem;
        }
        .welcome {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border-left: 4px solid #667eea;
        }
        .resume-viewer {
          margin-top: 2rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .pdf-container {
          display: flex;
          gap: 0;
          margin: 0;
          background: #525252;
          min-height: 600px;
          overflow-x: auto;
        }
        .pdf-page {
          flex: 1;
          min-width: 50%;
        }
        iframe {
          width: 100%;
          height: 800px;
          border: none;
          margin: 0;
          padding: 0;
        }
        .no-resume {
          text-align: center;
          padding: 3rem;
          color: #718096;
        }
        @media (max-width: 768px) {
          .pdf-container {
            flex-direction: column;
          }
          .pdf-page {
            min-width: 100%;
          }
          iframe {
            height: 500px;
          }
          h1 {
            font-size: 1.8rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <nav>
          <a href="/" class="active">Home/Resume</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/admin">Admin</a>
          <a href="/technical">Technical Info</a>
        </nav>
        <div class="content">
          <h1>Welcome, Interviewers!</h1>
          <div class="welcome">
            <p>Thank you for visiting my professional portfolio. Below you'll find my current resume. Feel free to explore my work samples in the Portfolio section.</p>
          </div>
          <div class="resume-viewer" id="resumeViewer">
            <div class="no-resume">Loading resume...</div>
          </div>
        </div>
      </div>
      <script>
        async function loadResume() {
          try {
            const response = await fetch('/api/resume');
            const data = await response.json();
            const viewer = document.getElementById('resumeViewer');

            if (data.resume) {
              const fileExt = data.resume.filename.toLowerCase().split('.').pop();
              if (fileExt === 'pdf') {
                viewer.innerHTML = \`
                  <div class="pdf-container">
                    <iframe src="/uploads/\${data.resume.filename}"></iframe>
                  </div>
                \`;
              } else {
                viewer.innerHTML = \`
                  <div style="text-align: center; padding: 2rem;">
                    <img src="/uploads/\${data.resume.filename}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="Resume">
                  </div>
                \`;
              }
            } else {
              viewer.innerHTML = '<div class="no-resume">No resume uploaded yet. Please contact the administrator.</div>';
            }
          } catch (error) {
            console.error('Error loading resume:', error);
            document.getElementById('resumeViewer').innerHTML = '<div class="no-resume">Error loading resume.</div>';
          }
        }
        loadResume();
      </script>
    </body>
    </html>
  `);
});

app.get('/portfolio', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional Portfolio - Work Samples</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        nav {
          background: #2d3748;
          padding: 1rem 2rem;
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        nav a {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background 0.3s;
        }
        nav a:hover {
          background: #4a5568;
        }
        nav a.active {
          background: #667eea;
        }
        .content {
          display: flex;
          height: calc(100vh - 200px);
          min-height: 600px;
        }
        .sidebar {
          width: 300px;
          background: #f7fafc;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
          padding: 1rem;
        }
        .sidebar h2 {
          padding: 1rem;
          color: #2d3748;
          font-size: 1.2rem;
          border-bottom: 2px solid #667eea;
          margin-bottom: 1rem;
        }
        .portfolio-item {
          padding: 1rem;
          margin-bottom: 0.5rem;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }
        .portfolio-item:hover {
          border-color: #667eea;
          transform: translateX(4px);
        }
        .portfolio-item.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        .portfolio-item-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .portfolio-item-date {
          font-size: 0.85rem;
          opacity: 0.7;
        }
        .viewer {
          flex: 1;
          background: #525252;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pdf-container {
          width: 100%;
          height: 100%;
          display: flex;
          gap: 0;
          margin: 0;
        }
        iframe {
          width: 100%;
          height: 100%;
          border: none;
          margin: 0;
          padding: 0;
        }
        .image-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
        }
        .no-items {
          text-align: center;
          padding: 3rem;
          color: #718096;
        }
        @media (max-width: 968px) {
          .content {
            flex-direction: column;
            height: auto;
          }
          .sidebar {
            width: 100%;
            max-height: 200px;
          }
          .viewer {
            min-height: 500px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <nav>
          <a href="/">Home/Resume</a>
          <a href="/portfolio" class="active">Portfolio</a>
          <a href="/admin">Admin</a>
          <a href="/technical">Technical Info</a>
        </nav>
        <div class="content">
          <div class="sidebar">
            <h2>Work Samples</h2>
            <div id="portfolioList"></div>
          </div>
          <div class="viewer" id="viewer">
            <div class="no-items">Select a portfolio item to view</div>
          </div>
        </div>
      </div>
      <script>
        let portfolios = [];

        async function loadPortfolios() {
          try {
            const response = await fetch('/api/portfolios');
            const data = await response.json();
            portfolios = data.portfolios;

            const listContainer = document.getElementById('portfolioList');

            if (portfolios.length === 0) {
              listContainer.innerHTML = '<div class="no-items">No portfolio items yet</div>';
              return;
            }

            listContainer.innerHTML = portfolios.map((item, index) => \`
              <div class="portfolio-item \${index === 0 ? 'active' : ''}" onclick="viewPortfolio(\${index})">
                <div class="portfolio-item-title">\${item.original_name}</div>
                <div class="portfolio-item-date">\${new Date(item.created_at).toLocaleDateString()}</div>
              </div>
            \`).join('');

            if (portfolios.length > 0) {
              viewPortfolio(0);
            }
          } catch (error) {
            console.error('Error loading portfolios:', error);
          }
        }

        function viewPortfolio(index) {
          const items = document.querySelectorAll('.portfolio-item');
          items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
          });

          const portfolio = portfolios[index];
          const viewer = document.getElementById('viewer');
          const fileExt = portfolio.filename.toLowerCase().split('.').pop();

          if (fileExt === 'pdf') {
            viewer.innerHTML = \`
              <div class="pdf-container">
                <iframe src="/uploads/\${portfolio.filename}"></iframe>
              </div>
            \`;
          } else {
            viewer.innerHTML = \`
              <div class="image-container">
                <img src="/uploads/\${portfolio.filename}" alt="\${portfolio.original_name}">
              </div>
            \`;
          }
        }

        loadPortfolios();
      </script>
    </body>
    </html>
  `);
});

app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional Portfolio - Admin</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        nav {
          background: #2d3748;
          padding: 1rem 2rem;
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        nav a {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background 0.3s;
        }
        nav a:hover {
          background: #4a5568;
        }
        nav a.active {
          background: #667eea;
        }
        .content {
          padding: 3rem 2rem;
        }
        h1 {
          color: #2d3748;
          margin-bottom: 2rem;
        }
        .section {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border-left: 4px solid #667eea;
        }
        .section h2 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #4a5568;
          font-weight: 600;
        }
        input[type="text"],
        input[type="password"],
        input[type="file"],
        select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        input:focus,
        select:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          background: #667eea;
          color: white;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover {
          background: #5568d3;
        }
        button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
        .message {
          padding: 1rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          display: none;
        }
        .message.success {
          background: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }
        .message.error {
          background: #fed7d7;
          color: #742a2a;
          border: 1px solid #fc8181;
        }
        .message.show {
          display: block;
        }
        .delete-list {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1rem;
          background: white;
        }
        .delete-item {
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: #f7fafc;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .delete-item input[type="checkbox"] {
          width: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <nav>
          <a href="/">Home/Resume</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/admin" class="active">Admin</a>
          <a href="/technical">Technical Info</a>
        </nav>
        <div class="content">
          <h1>Admin Panel</h1>

          <div class="section">
            <h2>Upload New Resume</h2>
            <div id="uploadResumeMessage" class="message"></div>
            <form id="uploadResumeForm">
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="resumePassword" required>
              </div>
              <div class="form-group">
                <label>Resume File (PDF or Image)</label>
                <input type="file" id="resumeFile" accept=".pdf,.jpg,.jpeg,.png" required>
              </div>
              <button type="submit">Upload Resume</button>
            </form>
          </div>

          <div class="section">
            <h2>Upload New Portfolio Work</h2>
            <div id="uploadPortfolioMessage" class="message"></div>
            <form id="uploadPortfolioForm">
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="portfolioPassword" required>
              </div>
              <div class="form-group">
                <label>Portfolio File (PDF or Image)</label>
                <input type="file" id="portfolioFile" accept=".pdf,.jpg,.jpeg,.png" required>
              </div>
              <button type="submit">Upload Portfolio</button>
            </form>
          </div>

          <div class="section">
            <h2>Delete Portfolio Items</h2>
            <div id="deleteMessage" class="message"></div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="deletePassword">
            </div>
            <div id="deleteList" class="delete-list">
              <p>Loading...</p>
            </div>
            <button onclick="deleteSelected()" style="margin-top: 1rem;">Delete Selected</button>
          </div>
        </div>
      </div>

      <script>
        function showMessage(elementId, message, isError = false) {
          const element = document.getElementById(elementId);
          element.textContent = message;
          element.className = 'message show ' + (isError ? 'error' : 'success');
          setTimeout(() => {
            element.className = 'message';
          }, 5000);
        }

        document.getElementById('uploadResumeForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('resumePassword').value;
          const file = document.getElementById('resumeFile').files[0];

          if (!file) {
            showMessage('uploadResumeMessage', 'Please select a file', true);
            return;
          }

          const formData = new FormData();
          formData.append('password', password);
          formData.append('type', 'resume');
          formData.append('file', file);

          try {
            const response = await fetch('/upload', {
              method: 'POST',
              body: formData
            });

            const data = await response.json();

            if (response.ok) {
              showMessage('uploadResumeMessage', data.message);
              document.getElementById('uploadResumeForm').reset();
            } else {
              showMessage('uploadResumeMessage', data.error, true);
            }
          } catch (error) {
            showMessage('uploadResumeMessage', 'Error uploading file', true);
          }
        });

        document.getElementById('uploadPortfolioForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('portfolioPassword').value;
          const file = document.getElementById('portfolioFile').files[0];

          if (!file) {
            showMessage('uploadPortfolioMessage', 'Please select a file', true);
            return;
          }

          const formData = new FormData();
          formData.append('password', password);
          formData.append('type', 'portfolio');
          formData.append('file', file);

          try {
            const response = await fetch('/upload', {
              method: 'POST',
              body: formData
            });

            const data = await response.json();

            if (response.ok) {
              showMessage('uploadPortfolioMessage', data.message);
              document.getElementById('uploadPortfolioForm').reset();
              loadDeleteList();
            } else {
              showMessage('uploadPortfolioMessage', data.error, true);
            }
          } catch (error) {
            showMessage('uploadPortfolioMessage', 'Error uploading file', true);
          }
        });

        async function loadDeleteList() {
          try {
            const response = await fetch('/api/portfolios');
            const data = await response.json();
            const deleteList = document.getElementById('deleteList');

            if (data.portfolios.length === 0) {
              deleteList.innerHTML = '<p>No portfolio items to delete</p>';
              return;
            }

            deleteList.innerHTML = data.portfolios.map(item => \`
              <div class="delete-item">
                <input type="checkbox" value="\${item.id}" id="delete-\${item.id}">
                <label for="delete-\${item.id}" style="margin: 0; cursor: pointer;">
                  \${item.original_name} - \${new Date(item.created_at).toLocaleDateString()}
                </label>
              </div>
            \`).join('');
          } catch (error) {
            console.error('Error loading delete list:', error);
          }
        }

        async function deleteSelected() {
          const password = document.getElementById('deletePassword').value;
          const checkboxes = document.querySelectorAll('#deleteList input[type="checkbox"]:checked');
          const ids = Array.from(checkboxes).map(cb => cb.value);

          if (ids.length === 0) {
            showMessage('deleteMessage', 'Please select items to delete', true);
            return;
          }

          if (!password) {
            showMessage('deleteMessage', 'Please enter password', true);
            return;
          }

          try {
            const response = await fetch('/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password, ids })
            });

            const data = await response.json();

            if (response.ok) {
              showMessage('deleteMessage', data.message);
              document.getElementById('deletePassword').value = '';
              loadDeleteList();
            } else {
              showMessage('deleteMessage', data.error, true);
            }
          } catch (error) {
            showMessage('deleteMessage', 'Error deleting items', true);
          }
        }

        loadDeleteList();
      </script>
    </body>
    </html>
  `);
});

app.get('/technical', (req, res) => {
  const prompt = "This website was built using a custom prompt for Node.js, Express, and SQLite, optimized for Render.com. The original prompt included requirements for dual-page portfolio display, automatic resume soft-delete, and Chinese filename support.";

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional Portfolio - Technical Info</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        nav {
          background: #2d3748;
          padding: 1rem 2rem;
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        nav a {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background 0.3s;
        }
        nav a:hover {
          background: #4a5568;
        }
        nav a.active {
          background: #667eea;
        }
        .content {
          padding: 3rem 2rem;
        }
        h1 {
          color: #2d3748;
          margin-bottom: 2rem;
        }
        .info-section {
          background: #f7fafc;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border-left: 4px solid #667eea;
        }
        .info-section h2 {
          color: #2d3748;
          margin-bottom: 1rem;
        }
        .tech-stack {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1rem;
        }
        .tech-badge {
          background: #667eea;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-weight: 600;
        }
        pre {
          background: #2d3748;
          color: #e2e8f0;
          padding: 2rem;
          border-radius: 8px;
          overflow-x: auto;
          line-height: 1.6;
          font-size: 0.9rem;
        }
        code {
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <nav>
          <a href="/">Home/Resume</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/admin">Admin</a>
          <a href="/technical" class="active">Technical Info</a>
        </nav>
        <div class="content">
          <h1>Technical Information</h1>

          <div class="info-section">
            <h2>Technology Stack</h2>
            <div class="tech-stack">
              <div class="tech-badge">Node.js</div>
              <div class="tech-badge">Express</div>
              <div class="tech-badge">SQLite</div>
              <div class="tech-badge">Multer</div>
              <div class="tech-badge">Render.com</div>
            </div>
          </div>

          <div class="info-section">
            <h2>Original Requirements</h2>
            <pre><code>${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/api/resume', (req, res) => {
  db.get(
    'SELECT * FROM portfolios WHERE type = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
    ['resume', 'active'],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ resume: row || null });
    }
  );
});

app.get('/api/portfolios', (req, res) => {
  db.all(
    'SELECT * FROM portfolios WHERE type = ? AND status = ? ORDER BY created_at DESC',
    ['portfolio', 'active'],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ portfolios: rows || [] });
    }
  );
});

app.post('/upload', upload.single('file'), (req, res) => {
  const { password, type } = req.body;

  if (password !== ADMIN_PASSWORD) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (type !== 'resume' && type !== 'portfolio') {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Invalid type' });
  }

  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

  if (type === 'resume') {
    db.run(
      'UPDATE portfolios SET status = ? WHERE type = ? AND status = ?',
      ['deleted', 'resume', 'active'],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        db.run(
          'INSERT INTO portfolios (filename, original_name, type, status) VALUES (?, ?, ?, ?)',
          [req.file.filename, originalName, type, 'active'],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Resume uploaded successfully' });
          }
        );
      }
    );
  } else {
    db.run(
      'INSERT INTO portfolios (filename, original_name, type, status) VALUES (?, ?, ?, ?)',
      [req.file.filename, originalName, type, 'active'],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Portfolio uploaded successfully' });
      }
    );
  }
});

app.post('/delete', (req, res) => {
  const { password, ids } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No items selected' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const query = \`UPDATE portfolios SET status = 'deleted' WHERE id IN (\${placeholders}) AND type = 'portfolio'\`;

  db.run(query, ids, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: \`\${this.changes} item(s) deleted successfully\` });
  });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
