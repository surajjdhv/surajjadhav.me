#!/bin/bash

# Define the branch to compare (you can modify this if needed)
BRANCH="main"

# Fetch updates from the remote
git fetch origin $BRANCH

# Check if local branch is behind the remote
LOCAL=$(git rev-parse $BRANCH)
REMOTE=$(git rev-parse origin/$BRANCH)

if [ $LOCAL = $REMOTE ]; then
    echo "No new changes in the remote branch."
else
    echo "New changes found in the remote branch. Pulling the latest changes..."
    git pull origin $BRANCH
    
    if [ $? -eq 0 ]; then
        echo "Successfully pulled changes. Running Eleventy build..."
        npx @11ty/eleventy
        
        if [ $? -eq 0 ]; then
            echo "Eleventy site build completed successfully."
        else
            echo "Eleventy build failed."
        fi
    else
        echo "Failed to pull changes from the remote branch."
    fi
fi
