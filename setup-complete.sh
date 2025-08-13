#!/bin/bash

# 🚀 BloodScan Complete Setup Script
# This script sets up the complete production-ready BloodScan system

set -e

echo "🩸 BloodScan Complete Setup - Frontend & Backend Integration"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the FingerPrint project root directory"
    exit 1
fi

print_info "Starting complete BloodScan setup..."

# Step 1: Backend Setup
echo ""
echo "📦 Setting up Django Backend..."
echo "==============================="

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_info "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
print_info "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    print_warning "requirements.txt not found, installing basic dependencies..."
    pip install django djangorestframework django-cors-headers python-decouple psycopg2-binary redis celery firebase-admin google-cloud-firestore torch torchvision opencv-python pillow scikit-learn
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please update .env file with your Firebase credentials!"
fi

# Run Django setup
print_info "Running Django migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
print_info "Creating Django superuser (optional)..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@bloodscan.app', 'admin123')" | python manage.py shell

print_status "Backend setup completed!"

# Step 2: Frontend Setup
echo ""
echo "📱 Setting up React Native Frontend..."
echo "======================================"

cd ../frontend

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install

# Install Firebase SDK
print_info "Installing Firebase SDK..."
npm install firebase

# Update Firebase configuration
print_warning "Please update config/firebase.ts with your Firebase project configuration!"

print_status "Frontend setup completed!"

# Step 3: Firebase Setup Instructions
echo ""
echo "🔥 Firebase Setup Instructions"
echo "=============================="

print_info "1. Go to https://console.firebase.google.com/"
print_info "2. Create a new project: 'bloodscan-production'"
print_info "3. Enable Authentication (Email/Password)"
print_info "4. Enable Firestore Database"
print_info "5. Download service account JSON to backend/"
print_info "6. Update frontend/config/firebase.ts with your web config"
print_info "7. Update backend/.env with your Firebase project ID"

# Step 4: Start Services
echo ""
echo "🚀 Starting Services"
echo "===================="

# Start backend in background
cd ../backend
print_info "Starting Django development server..."
python manage.py runserver 8000 &
BACKEND_PID=$!

print_status "Backend started on http://localhost:8000"

# Start frontend
cd ../frontend
print_info "Starting React Native development server..."
print_warning "Run 'npm run dev' in the frontend directory to start the mobile app"

echo ""
echo "🎉 Setup Complete!"
echo "=================="

print_status "Backend API: http://localhost:8000"
print_status "API Documentation: http://localhost:8000/api/docs/"
print_status "Django Admin: http://localhost:8000/admin/"
print_status "Frontend: Run 'npm run dev' in frontend directory"

echo ""
print_info "Next Steps:"
echo "1. Configure Firebase credentials"
echo "2. Train ML models: python train_models.py"
echo "3. Test the complete system"
echo "4. Deploy to production"

echo ""
print_warning "To stop the backend server: kill $BACKEND_PID"

echo ""
echo "📚 Documentation:"
echo "- Complete Setup Guide: COMPLETE_SETUP_GUIDE.md"
echo "- Backend README: backend/README.md"
echo "- Frontend README: frontend/README.md"

echo ""
print_status "BloodScan is ready for development! 🩸📱🧠"
