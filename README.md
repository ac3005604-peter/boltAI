# Professional Portfolio Website

A professional portfolio website built with Node.js, Express, and SQLite, optimized for deployment on Render.com.

## Features

- **Home/Resume Page**: Display your active resume with a professional welcome message
- **Portfolio Page**: Showcase your work samples with an intuitive dual-page PDF viewer
- **Admin Panel**: Secure upload and management system with password protection
- **Technical Info**: Display project documentation and tech stack
- **Dual-Page PDF Viewer**: Seamless side-by-side view for PDFs and images
- **Chinese Filename Support**: UTF-8 encoding prevents garbled text on Linux/Render
- **Soft Delete**: Auto-soft delete old resumes when uploading new ones
- **Mobile Responsive**: Works perfectly on all device sizes

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite
- **File Upload**: Multer
- **Deployment**: Render.com

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

The server will run on port 3000 by default (or `process.env.PORT` on Render).

## Database

The SQLite database is automatically initialized on first run with the following schema:

```sql
CREATE TABLE portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Admin Access

The admin panel is protected with password authentication. Use password: `88888888`

### Admin Features:
- Upload new resume (auto-deletes previous resume)
- Upload portfolio work samples
- Delete portfolio items (soft delete)

## Deployment on Render.com

1. Push your code to GitHub
2. Create a new Web Service on Render.com
3. Connect your GitHub repository
4. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy!

Render will automatically use `process.env.PORT` for the server.

## File Upload Support

Supported file formats:
- PDF (.pdf)
- Images (.jpg, .jpeg, .png)

## Pages

1. **/** - Home page with active resume
2. **/portfolio** - Portfolio work samples
3. **/admin** - Admin panel (password protected)
4. **/technical** - Technical information and documentation

## Security

- Password protection for all database operations
- Soft delete for data safety
- UTF-8 filename encoding for international character support

## License

ISC
