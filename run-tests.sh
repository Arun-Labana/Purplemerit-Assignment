#!/bin/bash
# Run all tests with Node.js 18.20.8

echo "Switching to Node.js 18.20.8..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18.20.8

echo ""
echo "Current Node version:"
node --version
echo ""

echo "Running all tests..."
npm test
