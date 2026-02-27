# Professional Portfolio Website

A professional portfolio website built with Node.js, Express, and Supabase (PostgreSQL), optimized for deployment on Render.com.

## Features

- **Home/Resume Page**: Display your active resume with a professional welcome message
- **Portfolio Page**: Showcase work samples with intuitive side-by-side PDF viewer using pdf.js
- **Admin Panel**: Secure upload and management system with password protection
- **Technical Info**: Display project documentation and tech stack
- **Supabase Integration**: Cloud-based PostgreSQL database with secure storage
- **Dual-Page PDF Viewer**: Seamless side-by-side view with pdf.js (gap: 0, margin: 0)
- **Cloud Storage**: Supabase Storage for file hosting
- **Chinese Filename Support**: UTF-8 encoding prevents garbled text on Linux/Render
- **Soft Delete**: Auto-soft delete old resumes when uploading new ones
- **Mobile Responsive**: Works perfectly on all device sizes

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **PDF Viewer**: pdf.js
- **File Upload**: Multer
- **Deployment**: Render.com

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```
   PORT=3000
   SUPABASE_URL=https://zmfluvivuotxdofagfvu.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_3xWUC61Q0M9n4dQesQpT8w_znaMBROj
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
4. Start the server:
   ```bash
   npm start
   ```

The server will run on port 3000 by default (or `process.env.PORT` on Render).

## Database Setup

The application connects to your Supabase project. The `portfolios` table with the following schema should be created:

```sql
CREATE TABLE portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL UNIQUE,
  original_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('resume', 'portfolio')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## Storage Setup

Create a Supabase Storage bucket named `portfolio-files` with the following configuration:
- Bucket name: `portfolio-files`
- File size limit: Configure as needed
- Allowed MIME types: `application/pdf`, `image/jpeg`, `image/png`

## Admin Access

The admin panel is protected with password authentication. Use password: `88888888`

### Admin Features:
- Upload new resume (auto-soft deletes previous resume)
- Upload portfolio work samples
- Delete portfolio items (soft delete)

## Deployment on Render.com

1. Push your code to GitHub
2. Create a new Web Service on Render.com
3. Connect your GitHub repository
4. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT=3000`
     - `SUPABASE_URL=<your_supabase_url>`
     - `SUPABASE_ANON_KEY=<your_anon_key>`
     - `SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>`
5. Deploy!

Render will automatically use `process.env.PORT` for the server.

## File Upload Support

Supported file formats:
- PDF (.pdf)
- Images (.jpg, .jpeg, .png)

## Pages

1. **/** - Home page with active resume (side-by-side PDF pages)
2. **/portfolio** - Portfolio work samples with list selector
3. **/admin** - Admin panel (password protected)
4. **/technical** - Technical information and documentation

## API Endpoints

### Public Endpoints
- `GET /` - Home page
- `GET /portfolio` - Portfolio page
- `GET /technical` - Technical info page
- `GET /api/resume` - Get active resume metadata and URL
- `GET /api/portfolios` - Get all active portfolio items with URLs

### Protected Endpoints (Require Password)
- `POST /upload` - Upload resume or portfolio file
- `POST /delete` - Soft delete portfolio items

## Security

- Password protection (`88888888`) for all database operations
- Supabase Row Level Security (RLS) policies for data access control
- Soft delete for data safety and audit trails
- UTF-8 filename encoding for international character support
- File validation for allowed formats
- CORS-friendly API design

## Environment Variables

Required `.env` variables:
- `PORT` - Server port (default: 3000)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key for client operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for administrative operations

## License

ISC
