#!/usr/bin/env node

// Force Vercel Deployment Script
// This script ensures Vercel recognizes this as a new deployment

console.log('🚀 Forcing Vercel deployment for Ethereum Explorer');
console.log('📅 Build timestamp:', new Date().toISOString());
console.log('🎯 Purpose: Fix deployment showing Aptos content instead of Ethereum content');
console.log('✅ This should trigger a complete rebuild and cache clear');

// Exit successfully
process.exit(0);
