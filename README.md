# ai-bookmark

An AI-powered cross-platform smart bookmark system that collects, processes, and retrieves information via a WeChat bot. It unifies scattered content from browsers, Bilibili, Zhihu, and WeChat accounts, turning disorganized bookmarks into a personal, searchable knowledge base.

## Project Structure

```
ai-bookmark/
├── ai/                     # AI analysis module
│   └── analyze.py          # Text analysis using SiliconFlow API
├── app/                    # Android client application
├── backend/                # Backend services (alternative implementation)
├── bot/                    # WeChat bot integration
├── docs/                   # Documentation files
│   ├── API_ALIGNMENT_CHANGES.md
│   ├── BACKEND_CONFIGURATION.md
│   ├── DEVELOPMENT_GUIDE.md
│   ├── DEV_MODE_GUIDE.md
│   ├── GIT_PUSH_GUIDE.md
│   ├── INTEGRATION_TESTING_CHECKLIST.md
│   ├── PROGRESS_SUMMARY.md
│   ├── PROJECT_COMPLETE.md
│   ├── PROJECT_RENAME_NOTE.md
│   ├── api-contract-v1.1.md
│   └── 项目目标回顾.md
├── src/                    # Source code
├── Dockerfile              # Docker configuration for deployment
├── .dockerignore           # Files to ignore during Docker build
├── main.py                 # Main FastAPI application
├── requirements.txt        # Python dependencies
├── railway.json            # Railway deployment configuration
├── package.json            # Node.js dependencies (optional)
└── README.md               # Project documentation
```

## Features

- AI-powered content analysis and categorization
- Cross-platform bookmark management
- WeChat bot integration
- Content retrieval and search
- Smart tagging and organization

## Deployment

This project can be deployed using Docker:

```bash
# Build the Docker image
docker build -t ai-bookmark .

# Run the application
docker run -p 8000:8000 ai-bookmark
```

Or deploy directly to Railway using the provided configuration.