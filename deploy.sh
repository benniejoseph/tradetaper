#!/bin/bash

# 🚀 TradeTaper Production Deployment Script
# This script handles the complete deployment of the TradeTaper admin system

set -e  # Exit on any error

echo "🚀 Starting TradeTaper Production Deployment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required CLIs are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        sudo npm install -g vercel
    fi
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        curl -fsSL https://railway.app/install.sh | sh
    fi
    
    print_success "All dependencies are available!"
}

# Build and test all components
build_and_test() {
    print_status "Building and testing all components..."
    
    # Build backend
    print_status "Building backend..."
    cd tradetaper-backend
    npm install
    npm run build
    print_success "Backend built successfully!"
    
    # Build admin
    print_status "Building admin..."
    cd ../tradetaper-admin
    npm install
    npm run build
    print_success "Admin built successfully!"
    
    # Build frontend (if exists)
    if [ -d "../tradetaper-frontend" ]; then
        print_status "Building frontend..."
        cd ../tradetaper-frontend
        npm install
        npm run build
        print_success "Frontend built successfully!"
    fi
    
    cd ..
}

# Commit changes to git
commit_changes() {
    print_status "Committing changes to git..."
    
    # Check if there are changes to commit
    if [[ -n $(git status --porcelain) ]]; then
        git add .
        git commit -m "🚀 Production deployment: Enterprise admin system implementation

- Enhanced system management with API testing and database viewer
- Comprehensive testing suite for all endpoints and services
- Consolidated revenue management (removed redundant subscriptions)
- Real-time monitoring and logging system
- Advanced analytics and debugging tools
- Production-ready configuration for Railway and Vercel
- Security enhancements and performance optimizations

Ready for production deployment on Railway (backend) and Vercel (admin/frontend)"
        
        print_success "Changes committed to git!"
    else
        print_warning "No changes to commit."
    fi
}

# Deploy to Railway (Backend)
deploy_backend() {
    print_status "Deploying backend to Railway..."
    
    cd tradetaper-backend
    
    # Check if Railway is logged in
    if ! railway whoami &> /dev/null; then
        print_warning "Not logged in to Railway. Please run 'railway login' first."
        print_status "Opening Railway login..."
        railway login
    fi
    
    # Deploy to Railway
    print_status "Deploying to Railway..."
    railway up
    
    print_success "Backend deployed to Railway!"
    cd ..
}

# Deploy to Vercel (Admin)
deploy_admin() {
    print_status "Deploying admin to Vercel..."
    
    cd tradetaper-admin
    
    # Check if Vercel is logged in
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel. Please run 'vercel login' first."
        print_status "Opening Vercel login..."
        vercel login
    fi
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    vercel --prod
    
    print_success "Admin deployed to Vercel!"
    cd ..
}

# Deploy to Vercel (Frontend)
deploy_frontend() {
    if [ -d "tradetaper-frontend" ]; then
        print_status "Deploying frontend to Vercel..."
        
        cd tradetaper-frontend
        
        # Deploy to Vercel
        print_status "Deploying frontend to Vercel..."
        vercel --prod
        
        print_success "Frontend deployed to Vercel!"
        cd ..
    else
        print_warning "Frontend directory not found. Skipping frontend deployment."
    fi
}

# Verify deployments
verify_deployments() {
    print_status "Verifying deployments..."
    
    # Get Railway URL
    cd tradetaper-backend
    RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "")
    cd ..
    
    # Get Vercel URLs
    cd tradetaper-admin
    ADMIN_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")
    cd ..
    
    if [ -d "tradetaper-frontend" ]; then
        cd tradetaper-frontend
        FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "")
        cd ..
    fi
    
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    
    if [ -n "$RAILWAY_URL" ]; then
        echo "🔧 Backend (Railway): https://$RAILWAY_URL"
        echo "   Health Check: https://$RAILWAY_URL/api/v1/health"
    else
        echo "🔧 Backend: Check Railway dashboard for URL"
    fi
    
    if [ -n "$ADMIN_URL" ]; then
        echo "⚙️  Admin Panel: https://$ADMIN_URL"
    else
        echo "⚙️  Admin Panel: Check Vercel dashboard for URL"
    fi
    
    if [ -n "$FRONTEND_URL" ]; then
        echo "🌐 Frontend: https://$FRONTEND_URL"
    fi
    
    echo ""
    print_success "All deployments completed!"
}

# Main deployment flow
main() {
    echo "🎯 TradeTaper Enterprise Admin System Deployment"
    echo "==============================================="
    echo ""
    
    # Ask for confirmation
    read -p "Are you ready to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled."
        exit 0
    fi
    
    # Run deployment steps
    check_dependencies
    build_and_test
    commit_changes
    
    echo ""
    print_status "Ready to deploy to production platforms..."
    echo ""
    
    # Deploy backend
    read -p "Deploy backend to Railway? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_backend
    fi
    
    # Deploy admin
    read -p "Deploy admin to Vercel? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_admin
    fi
    
    # Deploy frontend
    if [ -d "tradetaper-frontend" ]; then
        read -p "Deploy frontend to Vercel? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            deploy_frontend
        fi
    fi
    
    verify_deployments
    
    echo ""
    echo "🎉 TradeTaper Production Deployment Complete!"
    echo "============================================="
    echo ""
    echo "Next Steps:"
    echo "1. Configure environment variables in Railway and Vercel dashboards"
    echo "2. Set up custom domains (if needed)"
    echo "3. Configure monitoring and alerts"
    echo "4. Test all admin features in production"
    echo ""
    echo "📚 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed configuration instructions."
    echo ""
}

# Run main function
main "$@" 