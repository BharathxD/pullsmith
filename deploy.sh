#!/bin/bash

# Pullsmith Fly.io Deployment Script
# Make sure to set your environment variables first!

set -e

echo "🚀 Starting Pullsmith deployment to Fly.io..."

# Check if required commands exist
command -v fly >/dev/null 2>&1 || {
    echo "❌ flyctl is required but not installed. Install from https://fly.io/docs/flyctl/install/"
    exit 1
}
command -v langgraph >/dev/null 2>&1 || {
    echo "❌ langgraph CLI is required. Install with: npm install -g @langchain/langgraph-cli"
    exit 1
}

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copy env.example to .env and fill in your values."
    exit 1
fi

# Build the LangGraph application
echo "🔨 Building LangGraph application..."
langgraph build -t pullsmith:latest

# Check if fly.toml exists
if [ ! -f fly.toml ]; then
    echo "❌ fly.toml not found. Make sure the file exists."
    exit 1
fi

# Login to Fly.io (if not already logged in)
echo "🔐 Checking Fly.io authentication..."
if ! fly auth whoami >/dev/null 2>&1; then
    echo "Please login to Fly.io..."
    fly auth login
fi

# Ask user if they want to set secrets
echo "🔑 Do you want to set environment secrets? (y/n)"
read -r set_secrets

if [ "$set_secrets" = "y" ] || [ "$set_secrets" = "Y" ]; then
    echo "Setting environment secrets..."
    echo "Please enter your environment variables (leave empty to skip):"

    read -p "DATABASE_URI: " -s database_url
    echo
    read -p "REDIS_URI: " -s redis_uri
    echo
    read -p "LANGSMITH_API_KEY: " -s langsmith_key
    echo
    read -p "OPENAI_API_KEY: " -s openai_key
    echo
    read -p "QDRANT_API_KEY: " -s qdrant_key
    echo
    read -p "QDRANT_URL: " qdrant_url
    read -p "GITHUB_CLIENT_ID: " github_client_id
    read -p "GITHUB_CLIENT_SECRET: " -s github_client_secret
    echo
    read -p "GITHUB_APP_ID: " github_app_id
    read -p "GITHUB_APP_PRIVATE_KEY: " -s github_private_key
    echo
    read -p "BETTER_AUTH_SECRET: " -s auth_secret
    echo
    read -p "VERCEL_OIDC_TOKEN: " -s vercel_token
    echo
    read -p "NEXT_PUBLIC_APP_URL: " app_url

    # Set secrets (only if provided)
    secrets_cmd="fly secrets set"
    [ -n "$database_url" ] && secrets_cmd="$secrets_cmd DATABASE_URL=\"$database_url\""
    [ -n "$redis_uri" ] && secrets_cmd="$secrets_cmd REDIS_URI=\"$redis_uri\""
    [ -n "$langsmith_key" ] && secrets_cmd="$secrets_cmd LANGSMITH_API_KEY=\"$langsmith_key\""
    [ -n "$openai_key" ] && secrets_cmd="$secrets_cmd OPENAI_API_KEY=\"$openai_key\""
    [ -n "$qdrant_key" ] && secrets_cmd="$secrets_cmd QDRANT_API_KEY=\"$qdrant_key\""
    [ -n "$qdrant_url" ] && secrets_cmd="$secrets_cmd QDRANT_URL=\"$qdrant_url\""
    [ -n "$github_client_id" ] && secrets_cmd="$secrets_cmd GITHUB_CLIENT_ID=\"$github_client_id\""
    [ -n "$github_client_secret" ] && secrets_cmd="$secrets_cmd GITHUB_CLIENT_SECRET=\"$github_client_secret\""
    [ -n "$github_app_id" ] && secrets_cmd="$secrets_cmd GITHUB_APP_ID=\"$github_app_id\""
    [ -n "$github_private_key" ] && secrets_cmd="$secrets_cmd GITHUB_APP_PRIVATE_KEY=\"$github_private_key\""
    [ -n "$auth_secret" ] && secrets_cmd="$secrets_cmd BETTER_AUTH_SECRET=\"$auth_secret\""
    [ -n "$vercel_token" ] && secrets_cmd="$secrets_cmd VERCEL_OIDC_TOKEN=\"$vercel_token\""
    [ -n "$app_url" ] && secrets_cmd="$secrets_cmd NEXT_PUBLIC_APP_URL=\"$app_url\""

    if [ "$secrets_cmd" != "fly secrets set" ]; then
        echo "🔐 Setting secrets..."
        eval "$secrets_cmd"
    fi
fi

# Deploy the application
echo "🚀 Deploying to Fly.io..."
fly deploy

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://$(fly info --name | grep Hostname | awk '{print $2}')"
echo "🔍 Check status: fly status"
echo "📊 View logs: fly logs"
