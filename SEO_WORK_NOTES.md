# 📚 SEO WORK NOTES — Ottolearn Blog Platform
> Last Updated: 2026-03-27
> Author: Engineering Session Log
> Purpose: Full context recovery document. Read this if starting fresh after a break.

---

## 🗺️ PROJECT OVERVIEW

- **Frontend:** React + Vite (TypeScript)
- **Backend:** Node.js + Express (TypeScript) + Prisma ORM
- **Database:** PostgreSQL
- **Deployment:** Nginx on Linux server
- **Live Domain:** `https://learn.ottobon.in`
- **Backend Port:** `4000`
- **Frontend Dev Port:** `5173` (Vite dev server)
- **Repo:** GitHub — `Ottobon-INC/Course_Platform_Test`

---

## ✅ WHAT HAS BEEN DONE (COMPLETED WORK)

---

### 1. DATABASE — Blog Slug Migration

**Problem:** Blog URLs were using raw UUIDs (e.g. `/blogs/123e4567-e89b-12d3...`).
These are unreadable for users and terrible for SEO.

**Solution:** Added a `slug` column to the `cp_blogs` table and a PostgreSQL trigger
that auto-generates a clean slug from the blog title on every INSERT.

**Files Created:**
```
backend/prisma/manual_migrations/20260325_add_blog_slug.sql
backend/prisma/manual_migrations/20260325_blog_slug_trigger.sql
```

**What the trigger does:**
- Converts `"Future of AI in Education"` → `"future-of-ai-in-education"`
- Strips special characters, replaces spaces with hyphens
- Handles collisions (if slug already exists, appends -1, -2, etc.)
- Runs automatically on every INSERT and UPDATE to `cp_blogs`

---

### 2. BACKEND — Unified Blog Route (Slug + UUID Fallback)

**File:** `backend/src/routes/blogs.ts`

**Problem:** Needed to support both new slug URLs AND old UUID URLs (for backward compatibility with already-indexed Google pages and shared links).

**Solution:** Single route `GET /blogs/:identifier` that auto-detects UUID vs slug:

```typescript
// backend/src/routes/blogs.ts

blogsRouter.get("/:identifier", asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  let blog: any[] = [];

  // Check if it looks like a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(identifier)) {
    // Legacy lookup by UUID
    blog = await prisma.$queryRaw`
      SELECT * FROM cp_blogs WHERE id = ${identifier}::uuid LIMIT 1
    `;
  } else {
    // New slug-based lookup
    blog = await prisma.$queryRaw`
      SELECT * FROM cp_blogs WHERE slug = ${identifier} LIMIT 1
    `;
  }

  if (!blog || blog.length === 0) {
    res.status(404).json({ message: "Blog not found" });
    return;
  }

  res.status(200).json(blog[0]);
}));
```

---

### 3. FRONTEND — Dynamic SEO Meta Tags (Blog Detail Page)

**File:** `frontend/src/pages/BlogDetailPage.tsx`

**Problem:** As a React SPA (Client-Side Rendered), every blog page defaulted
to the generic `index.html` meta tags — killing social sharing previews and
Google ability to read individual article titles/descriptions.

**Solution:** Custom React Hook `useBlogSEO(blog)` that fires after blog data loads
and dynamically injects into `<head>`:

```typescript
// frontend/src/pages/BlogDetailPage.tsx

function useBlogSEO(blog: Blog | null) {
  useEffect(() => {
    if (!blog) return;

    const BASE_URL = 'https://learn.ottobon.in';
    const blogSlug = blog.slug || blog.id;
    const canonicalUrl = `${BASE_URL}/blogs/${blogSlug}`;
    const title = `${blog.title} | Ottolearn`;
    const description = blog.summary || blog.description || 'Read this insightful article on Ottolearn.';
    const image = blog.image_url || `${BASE_URL}/og-default.png`;

    // Helper to set/create a <meta> tag
    const setMeta = (selector: string, value: string, attr = 'content') => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const match = selector.match(/\[([^\]=]+)="([^"]+)"\]/);
        if (match) el.setAttribute(match[1], match[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Helper to set/create a <link> tag
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 1. Page title
    document.title = title;

    // 2. Standard SEO
    setMeta('meta[name="description"]', description);
    setMeta('meta[name="robots"]', 'index, follow');

    // 3. Canonical URL
    setLink('canonical', canonicalUrl);

    // 4. Open Graph (Facebook, WhatsApp, LinkedIn)
    setMeta('meta[property="og:type"]', 'article');
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[property="og:site_name"]', 'Ottolearn');
    setMeta('meta[property="og:locale"]', 'en_IN');

    // 5. Twitter Cards
    setMeta('meta[name="twitter:card"]', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', image);
    setMeta('meta[name="twitter:site"]', '@Ottolearn');

    // 6. JSON-LD Structured Data (for Google Rich Results)
    const existing = document.querySelector('#blog-jsonld');
    if (existing) existing.remove();

    const jsonLd = document.createElement('script');
    jsonLd.id = 'blog-jsonld';
    jsonLd.type = 'application/ld+json';
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.title,
      description,
      image,
      url: canonicalUrl,
      datePublished: blog.created_at || new Date().toISOString(),
      publisher: {
        '@type': 'Organization',
        name: 'Ottolearn',
        url: BASE_URL,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
      },
      keywords: blog.hashtags?.join(', ') || '',
    });
    document.head.appendChild(jsonLd);

    // Cleanup on unmount
    return () => {
      document.title = 'Ottolearn — AI-Native Learning Platform';
      document.querySelector('#blog-jsonld')?.remove();
    };
  }, [blog]);
}
```

---

### 4. FRONTEND — Blog Listing Page SEO

**File:** `frontend/src/pages/BlogsPage.tsx`

**Problem:** The `/blogs` listing page used the generic site-wide title/meta from `index.html`.

**Solution:** Added a lightweight hook `useBlogListingSEO()` at the top of the component:

```typescript
function useBlogListingSEO() {
  useEffect(() => {
    const title = 'Insights & Stories | Ottolearn Blogs';
    const description = 'Exploring the frontiers of AI, education, and the future of work. Read expert insights, tech career guidance, and more on the Ottolearn blog.';
    const canonicalUrl = 'https://learn.ottobon.in/blogs';

    document.title = title;
    // + sets og:title, og:description, og:url, og:type="website", twitter:title, twitter:description
    // + sets canonical link

    return () => {
      document.title = 'Ottolearn — AI-Native Learning Platform | Courses, Blogs & More';
    };
  }, []);
}
```

---

### 5. BACKEND — Dynamic Sitemap

**File:** `backend/src/routes/sitemap.ts`
**Registered in:** `backend/src/app.ts` → `app.use("/sitemap.xml", sitemapRouter)`

**What it does:** When any crawler (Google, Bing) hits `/sitemap.xml`, this route
fires a live Prisma DB query, fetches all blog slugs, and returns a perfectly
formatted XML sitemap on the fly. Zero manual effort ever needed.

```typescript
// backend/src/routes/sitemap.ts

sitemapRouter.get("/", asyncHandler(async (req, res) => {
  const blogs: any[] = await prisma.$queryRaw`
    SELECT slug, id, created_at
    FROM cp_blogs
    WHERE slug IS NOT NULL AND slug != ''
    ORDER BY created_at DESC
  `;

  const staticPages = [
    { url: "/",                     priority: "1.0", changefreq: "weekly"  },
    { url: "/blogs",                priority: "0.9", changefreq: "daily"   },
    { url: "/our-courses/cohort",   priority: "0.8", changefreq: "weekly"  },
    { url: "/our-courses/on-demand",priority: "0.8", changefreq: "weekly"  },
    { url: "/our-courses/workshops",priority: "0.8", changefreq: "weekly"  },
    { url: "/methodology",          priority: "0.7", changefreq: "monthly" },
    { url: "/become-a-tutor",       priority: "0.6", changefreq: "monthly" },
  ];

  const BASE_URL = "https://learn.ottobon.in";
  // ... builds XML and sends with Content-Type: application/xml
  res.header("Content-Type", "application/xml");
  res.header("Cache-Control", "public, max-age=3600");
  res.status(200).send(xml);
}));
```

---

### 6. BACKEND — robots.txt

**File:** `backend/src/app.ts` (inline route, no separate file needed)

```typescript
app.get("/robots.txt", (_req, res) => {
  res.header("Content-Type", "text/plain");
  res.send(
    `User-agent: *\nAllow: /\nDisallow: /auth/\nDisallow: /student-dashboard\nDisallow: /admin/\n\nSitemap: https://learn.ottobon.in/sitemap.xml`
  );
});
```

---

### 7. FRONTEND — Google Site Verification Tag

**File:** `frontend/index.html`

Added right before `</head>` tag:
```html
<meta name="google-site-verification" content="qHbOxRgOzbWbmCtZhLEjYHoaTwae3_GLXiB3nft6GAw" />
```

**Purpose:** Proves ownership of `learn.ottobon.in` to Google Search Console.
**Next Step:** Log into Google Search Console and click "Verify" button.

---

### 8. FRONTEND — Static Sitemap Fallback

**File:** `frontend/public/sitemap.xml`

**Why it exists:** A static fallback was created because Nginx was returning 404 on
`/sitemap.xml` (React catch-all was overriding the backend route).
Once the Nginx fix below is applied, this file becomes redundant (but harmless).

**⚠️ IMPORTANT:** This static file does NOT auto-update with new blogs.
If relying on this, you must manually add new blog slugs here.

---

## 🔧 PENDING WORK — NOT YET IMPLEMENTED

---

### PENDING TASK 1: Create `.env.production` for Frontend ← 🔴 CRITICAL

**Problem:** `frontend/src/lib/api.ts` line 1:
```typescript
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
```

In the production Vite build, if `VITE_API_BASE_URL` is not set, the fallback
`http://localhost:4000` gets **baked permanently** into the compiled JavaScript bundle.
When users visit the live site, their browser tries calling `http://localhost:4000`
which resolves to their own machine — not your server. Every API call fails silently,
blog pages show a blank screen, and Google marks them as Soft 404.

**Fix:** Create this file:
```
frontend/.env.production
```
With this content:
```
VITE_API_BASE_URL=https://learn.ottobon.in/api
```

**After creating this file**, run a fresh production build:
```bash
cd frontend
npm run build
# This creates frontend/dist/ — deploy this to /var/www/frontend/dist on server
```

**Risk:** Zero. Dev environment is completely unaffected (Vite only reads `.env.production` during build).

---

### PENDING TASK 2: Nginx Configuration Update ← 🔴 CRITICAL

**Current Problem:** Nginx is routing ALL traffic (including `/sitemap.xml` and `/api/*`)
to the React frontend, meaning the backend never gets called in production.

**File to edit on server:** `/etc/nginx/sites-available/default`
(or whatever your domain config file is named, e.g. `learn.ottobon.in`)

**Command to open it on server:**
```bash
sudo nano /etc/nginx/sites-available/default
```

**Replace your existing Nginx config with this complete block:**
```nginx
server {
    listen 80;
    server_name learn.ottobon.in;

    # ✅ 1. SITEMAP — proxy to Node.js backend (must be FIRST, exact match)
    location = /sitemap.xml {
        proxy_pass http://localhost:4000/sitemap.xml;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # ✅ 2. ROBOTS.TXT — proxy to Node.js backend
    location = /robots.txt {
        proxy_pass http://localhost:4000/robots.txt;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # ✅ 3. ALL API ROUTES — proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ✅ 4. REACT FRONTEND — serve from compiled dist folder (MUST BE LAST)
    location / {
        root /var/www/frontend/dist;
        index index.html;
        try_files $uri /index.html;
    }
}
```

**After editing, validate and reload Nginx:**
```bash
sudo nginx -t           # Test config for syntax errors
sudo systemctl reload nginx   # Apply changes (zero-downtime reload)
```

**Also verify your dist folder is at the correct path:**
```bash
ls /var/www/frontend/dist
# Should list: index.html, assets/, etc.
```

**Risk:** Medium. If the Nginx syntax is wrong, `sudo nginx -t` will catch it BEFORE
applying. Never run `sudo nginx -s reload` without running `-t` first.

---

### PENDING TASK 3: Verify Backend CORS Allows Production Domain

**File:** `backend/.env`

Make sure this variable includes your production domain:
```
FRONTEND_APP_URLS=https://learn.ottobon.in
```

If it is still set to `http://localhost:5173`, the browser will block all API responses
on the live site due to CORS policy violations.

---

### PENDING TASK 4: Deploy New Frontend Build to Server

After creating `.env.production` and running `npm run build` locally:

```bash
# On your local machine — build the frontend
cd frontend
npm run build
# Output: frontend/dist/

# Copy the dist folder to your server (adjust path/user/IP as needed)
scp -r dist/ ubuntu@your-server-ip:/var/www/frontend/dist
```

Or if you use GitHub Actions / CI-CD, ensure the build step runs AFTER the
`.env.production` file is present.

---

## ⚠️ KNOWN ISSUES & HOW TO MITIGATE

| Issue | Symptom | Fix |
|---|---|---|
| Blank blog pages in production | Google Soft 404, blank screen | Create `.env.production` + rebuild |
| Sitemap 404 in production | `/sitemap.xml` returns React 404 page | Apply Nginx config (Task 2 above) |
| Social sharing shows wrong image | WhatsApp/LinkedIn preview shows generic Ottolearn banner | CSR limitation — needs SSR or Prerender.io to fully fix |
| Old dist build cached | Fix deployed but pages still blank | Hard reload server, clear CDN cache if any |
| CORS block in production | Browser console shows CORS error | Update `FRONTEND_APP_URLS` in `backend/.env` |

---

## 💡 HOW SEO WORKS IN THIS PROJECT (SUMMARY)

```
User/Googlebot visits https://learn.ottobon.in/blogs/my-blog-slug
         │
         ▼
   Nginx receives request
         │
         ├── /sitemap.xml  ──────────────────→ Proxied to Node.js :4000
         ├── /robots.txt   ──────────────────→ Proxied to Node.js :4000
         ├── /api/*        ──────────────────→ Proxied to Node.js :4000
         │
         └── Everything else ───────────────→ Serves frontend/dist/index.html
                                                        │
                                                        ▼
                                              React SPA loads in browser
                                                        │
                                                        ▼
                                              React Router reads /blogs/my-blog-slug
                                                        │
                                                        ▼
                                              BlogDetailPage.tsx mounts
                                                        │
                                                        ▼
                                              fetch(https://learn.ottobon.in/api/blogs/my-blog-slug)
                                                        │
                                                        ▼
                                              ✅ Blog data loads → useBlogSEO() injects <head> tags
```

---

## 📁 KEY FILES REFERENCE

| File | Purpose |
|---|---|
| `frontend/src/lib/api.ts` | API base URL configuration |
| `frontend/src/pages/BlogDetailPage.tsx` | Blog detail page + useBlogSEO hook |
| `frontend/src/pages/BlogsPage.tsx` | Blog listing page + useBlogListingSEO hook |
| `frontend/index.html` | Global SEO meta tags + Google verification tag |
| `frontend/public/sitemap.xml` | Static sitemap fallback (redundant once Nginx fixed) |
| `backend/src/routes/blogs.ts` | Blog API routes (slug + UUID lookup) |
| `backend/src/routes/sitemap.ts` | Dynamic sitemap generator |
| `backend/src/app.ts` | Express app setup, robots.txt route |
| `backend/prisma/manual_migrations/20260325_add_blog_slug.sql` | Adds slug column to DB |
| `backend/prisma/manual_migrations/20260325_blog_slug_trigger.sql` | Auto-generates slugs on INSERT |

---

## 🚀 WHEN YOU RETURN — DO THESE IN ORDER

1. ✅ Create `frontend/.env.production` with `VITE_API_BASE_URL=https://learn.ottobon.in/api`
2. ✅ Run `npm run build` in the `frontend/` directory
3. ✅ SSH into server and update the Nginx config (copy block from Task 2 above)
4. ✅ Run `sudo nginx -t` then `sudo systemctl reload nginx`
5. ✅ Deploy the new `frontend/dist/` folder to `/var/www/frontend/dist` on the server
6. ✅ Confirm `backend/.env` has `FRONTEND_APP_URLS=https://learn.ottobon.in`
7. ✅ Visit `https://learn.ottobon.in/blogs/any-blog-slug` — should show full content
8. ✅ Visit `https://learn.ottobon.in/sitemap.xml` — should show XML with all blogs
9. ✅ Go to Google Search Console → Verify ownership → Submit sitemap URL
