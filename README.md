# Pullsmith

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/BharathxD/ClaimeAI)

Pullsmith is an AI-powered coding assistant that automates code changes and pull request creation. Describe a task in plain English, and Pullsmith will analyze your codebase, plan the implementation, write the code, and open a PR.

## Demo

![pullsmith_compressed](https://github.com/user-attachments/assets/6abee4d0-70f0-4ed8-940a-5be9f86ba10d)

[Watch the full demo](https://cloud.imbharath.com/pullsmith.mp4)

## Tech Stack

- [Next.js](https://nextjs.org/) – React framework for web applications
- [LangGraph](https://langchain.com/langgraph) – Framework for building stateful, multi-actor applications with LLMs
- [Vercel AI SDK](https://sdk.vercel.ai/) – an open-source library for building AI-powered user interfaces
- [Better Auth](https://better-auth.dev/) – Authentication for Next.js
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework
- [Drizzle ORM](https://orm.drizzle.team/) – TypeScript ORM
- [PostgreSQL](https://www.postgresql.org/) – SQL database
- [Redis](https://redis.io/) – In-memory data store
- [Qdrant](httpsd://qdrant.tech/) - Vector database

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v22 or higher)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/pullsmith.git
cd pullsmith
```

### 2. Create a GitHub App

To use Pullsmith locally, you need to create a GitHub App with the following permissions:

- **Repository permissions:**
  - Contents: `Read & write`
  - Pull requests: `Read & write`

After creating the app, generate a private key and get the App ID, Client ID, Client Secret and Private Key. These values will be used in your `.env` file.

### 3. Set up environment variables

Copy the `.env.example` file to a new file named `.env` and add your environment variables.

```bash
cp .env.example .env
```

### 4. Install dependencies

```bash
pnpm install
```

### 5. Run the development server

To start the local development servers for the database and other services, run:

```bash
docker-compose up -d
```

Once the Docker containers are running, start the Next.js development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Usage

1.  Navigate to `http://localhost:3000`
2.  Log in with your GitHub account
3.  Select a repository
4.  Describe the changes you want to make
5.  Pullsmith will create a pull request with the changes

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
