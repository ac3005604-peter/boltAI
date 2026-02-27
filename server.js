require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = '88888888';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function initSupabase() {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error checking portfolios table:', error);
    } else {
      console.log('Connected to Supabase database');
    }
  } catch (err) {
    console.error('Error initializing Supabase:', err);
  }
}

initSupabase();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Professional Portfolio - Home</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
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
        .pdf-viewer {
          margin-top: 2rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .pdf-pages {
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
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pdf-page canvas {
          max-width: 100%;
          max-height: 800px;
        }
        .image-container {
          text-align: center;
          padding: 2rem;
        }
        .image-container img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        .no-resume {
          text-align: center;
          padding: 3rem;
          color: #718096;
        }
        .controls {
          padding: 1rem;
          background: #f7fafc;
          text-align: center;
          display: none;
        }
        .controls.show {
          display: block;
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          margin: 0 0.25rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.3s;
        }
        button:hover {
          background: #5568d3;
        }
        @media (max-width: 768px) {
          .pdf-pages {
            flex-direction: column;
          }
          .pdf-page {
            min-width: 100%;
          }
          .pdf-page canvas {
            max-height: 500px;
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
          <div class="pdf-viewer" id="resumeViewer">
            <div class="no-resume">Loading resume...</div>
          </div>
        </div>
      </div>
      <script>
        let resumePdf = null;

        async function loadResume() {
          try {
            const response = await fetch('/api/resume');
            const data = await response.json();
            const viewer = document.getElementById('resumeViewer');

            if (data.resume) {
              const fileExt = data.resume.split('.').pop().toLowerCase();
              const fileUrl = data.resumeUrl;

              if (fileExt === 'pdf') {
                pdfjsLib.getDocument(fileUrl).promise.then(pdf => {
                  resumePdf = pdf;
                  renderPdfPages(1, 2, 'resumeViewer', pdf);
                }).catch(err => {
                  viewer.innerHTML = '<div class="no-resume">Error loading PDF</div>';
                  console.error('PDF loading error:', err);
                });
              } else {
                viewer.innerHTML = \`
                  <div class="image-container">
                    <img src="\${fileUrl}" alt="Resume">
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

        async function renderPdfPages(startPage, endPage, containerId, pdf) {
          const container = document.getElementById(containerId);
          const pagesHtml = [];

          for (let pageNum = startPage; pageNum <= Math.min(endPage, pdf.numPages); pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 1.5;
            const viewport = page.getViewport({ scale });

            const canvasDiv = document.createElement('div');
            canvasDiv.className = 'pdf-page';
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const context = canvas.getContext('2d');
            await page.render({ canvasContext: context, viewport }).promise;

            canvasDiv.appendChild(canvas);
            pagesHtml.push(canvasDiv);
          }

          container.innerHTML = '';
          const pagesContainer = document.createElement('div');
          pagesContainer.className = 'pdf-pages';
          pagesHtml.forEach(page => pagesContainer.appendChild(page));
          container.appendChild(pagesContainer);
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
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
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
        .pdf-pages {
          width: 100%;
          display: flex;
          gap: 0;
          margin: 0;
        }
        .pdf-page {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .pdf-page canvas {
          max-width: 100%;
          max-height: 100%;
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

        async function viewPortfolio(index) {
          const items = document.querySelectorAll('.portfolio-item');
          items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
          });

          const portfolio = portfolios[index];
          const viewer = document.getElementById('viewer');
          const fileExt = portfolio.filename.split('.').pop().toLowerCase();
          const fileUrl = portfolio.url;

          if (fileExt === 'pdf') {
            pdfjsLib.getDocument(fileUrl).promise.then(pdf => {
              renderPdfPages(1, 2, 'viewer', pdf);
            }).catch(err => {
              viewer.innerHTML = '<div class="no-items">Error loading PDF</div>';
              console.error('PDF loading error:', err);
            });
          } else {
            viewer.innerHTML = \`
              <div class="image-container">
                <img src="\${fileUrl}" alt="\${portfolio.original_name}">
              </div>
            \`;
          }
        }

        async function renderPdfPages(startPage, endPage, containerId, pdf) {
          const container = document.getElementById(containerId);
          const pagesHtml = [];

          for (let pageNum = startPage; pageNum <= Math.min(endPage, pdf.numPages); pageNum++) {
            const page = await pdf.getPage(pageNum);
            const scale = 1.5;
            const viewport = page.getViewport({ scale });

            const pageDiv = document.createElement('div');
            pageDiv.className = 'pdf-page';
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const context = canvas.getContext('2d');
            await page.render({ canvasContext: context, viewport }).promise;

            pageDiv.appendChild(canvas);
            pagesHtml.push(pageDiv);
          }

          container.innerHTML = '';
          const pagesContainer = document.createElement('div');
          pagesContainer.className = 'pdf-pages';
          pagesHtml.forEach(page => pagesContainer.appendChild(page));
          container.appendChild(pagesContainer);
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

            deleteList.innerHTML = data.portfolios
              .filter(item => item.type === 'portfolio')
              .map(item => \`
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
  const prompt = `Build a professional portfolio website using Node.js (Express) and Supabase (PostgreSQL), optimized for Render.com.

### Supabase Configuration:
- Project URL: https://zmfluvivuotxdofagfvu.supabase.co
- Anon Key: sb_publishable_3xWUC61Q0M9n4dQesQpT8w_znaMBROj
- Table Name: "portfolios" (Columns: id, filename, original_name, type, status, created_at)

### Core Logic & Pages:
1. **Page 1 (Home/Resume)**: Welcome message. Fetch the latest active resume from Supabase.
2. **Page 2 (Portfolio)**: List work samples from Supabase. Default to the first item.
   - **Crucial UI**: Use pdf.js for side-by-side PDF page display with gap: 0 and margin: 0.
3. **Page 3 (Admin/Upload)**:
   - Password "88888888" required for all DB actions.
   - Upload integrated with Supabase Storage (Bucket: "portfolio-files").
   - Auto-soft delete of previous resumes when new resume uploaded.
   - Chinese filename support with UTF-8 encoding.
4. **Page 4 (Technical Info)**: Display this Prompt and tech stack.

### Technical Requirements:
- Use @supabase/supabase-js for database and storage.
- Bind to process.env.PORT for Render deployment.
- Startup script checks if portfolios table exists.

### Tech Stack:
- Node.js, Express, Supabase (PostgreSQL), pdf.js, Render.com`;

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
              <div class="tech-badge">Supabase</div>
              <div class="tech-badge">PostgreSQL</div>
              <div class="tech-badge">pdf.js</div>
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

app.get('/api/resume', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('type', 'resume')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (data) {
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-files')
        .getPublicUrl(data.filename);

      res.json({
        resume: data.original_name,
        resumeUrl: publicUrl
      });
    } else {
      res.json({ resume: null, resumeUrl: null });
    }
  } catch (err) {
    console.error('Error fetching resume:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/portfolios', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('type', 'portfolio')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    const portfoliosWithUrls = data.map(item => {
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-files')
        .getPublicUrl(item.filename);

      return {
        ...item,
        url: publicUrl
      };
    });

    res.json({ portfolios: portfoliosWithUrls || [] });
  } catch (err) {
    console.error('Error fetching portfolios:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const { password, type } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (type !== 'resume' && type !== 'portfolio') {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const fileExt = path.extname(originalName);
    const timestamp = Date.now();
    const storagePath = `${timestamp}-${originalName}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-files')
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }

    if (type === 'resume') {
      const { error: updateError } = await supabase
        .from('portfolios')
        .update({ status: 'deleted' })
        .eq('type', 'resume')
        .eq('status', 'active');

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Database error' });
      }
    }

    const { error: insertError } = await supabase
      .from('portfolios')
      .insert([{
        filename: storagePath,
        original_name: originalName,
        type: type,
        status: 'active'
      }]);

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save to database' });
    }

    res.json({ message: `${type === 'resume' ? 'Resume' : 'Portfolio'} uploaded successfully` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

app.post('/delete', async (req, res) => {
  const { password, ids } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No items selected' });
  }

  try {
    const { error } = await supabase
      .from('portfolios')
      .update({ status: 'deleted' })
      .in('id', ids)
      .eq('type', 'portfolio');

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: `${ids.length} item(s) deleted successfully` });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
