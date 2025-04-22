#!/bin/bash

# Configure Git locally (only need to run this once)
git config --local user.name "$GITHUB_USERNAME"
git config --local user.email "your-personal-email@example.com"  # Replace with your email

# Create GitHub repo URL with token
REPO_NAME="five-words-poetry-game"  # Replace with your repo name
GITHUB_URL="https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Check if remote exists
if git remote | grep -q "personal"; then
  git remote set-url personal "$GITHUB_URL"
else
  git remote add personal "$GITHUB_URL"
fi

# Push to GitHub
git push -u personal main

echo "Pushed to your personal GitHub repository at https://github.com/$GITHUB_USERNAME/$REPO_NAME"