#!/bin/bash

# BloodScan Backend Setup Script
# This script sets up the development environment

set -e

echo "🩸 Setting up BloodScan Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python 3.11+ is installed
check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        if python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)'; then
            print_status "Python ${PYTHON_VERSION} found ✓"
        else
            print_error "Python 3.11+ required, found ${PYTHON_VERSION}"
            exit 1
        fi
    else
        print_error "Python 3 not found. Please install Python 3.11+"
        exit 1
    fi
}

# Check if PostgreSQL is installed
check_postgresql() {
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL found ✓"
    else
        print_warning "PostgreSQL not found. Installing via Docker..."
    fi
}

# Check if Redis is installed
check_redis() {
    if command -v redis-cli &> /dev/null; then
        print_status "Redis found ✓"
    else
        print_warning "Redis not found. Installing via Docker..."
    fi
}

# Create virtual environment
create_venv() {
    if [ ! -d "venv" ]; then
        print_status "Creating virtual environment..."
        python3 -m venv venv
    else
        print_status "Virtual environment already exists ✓"
    fi
}

# Activate virtual environment
activate_venv() {
    print_status "Activating virtual environment..."
    source venv/bin/activate
}

# Install Python dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
}

# Setup environment file
setup_env() {
    if [ ! -f ".env" ]; then
        print_status "Creating environment file..."
        cp .env.example .env
        print_warning "Please update .env file with your configuration"
    else
        print_status "Environment file already exists ✓"
    fi
}

# Create directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p logs
    mkdir -p media
    mkdir -p staticfiles
    mkdir -p ml_models/trained_models
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if Docker is available
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_status "Starting database with Docker..."
        docker-compose up -d db redis
        
        # Wait for database to be ready
        print_status "Waiting for database to be ready..."
        sleep 10
        
        # Run migrations
        print_status "Running database migrations..."
        python manage.py migrate
        
        # Create superuser
        print_status "Creating superuser..."
        python manage.py createsuperuser --noinput --username admin --email admin@bloodscan.com || true
        
    else
        print_warning "Docker not found. Please manually setup PostgreSQL and Redis"
        print_warning "Then run: python manage.py migrate"
    fi
}

# Collect static files
collect_static() {
    print_status "Collecting static files..."
    python manage.py collectstatic --noinput
}

# Test the setup
test_setup() {
    print_status "Testing setup..."
    python manage.py check
    
    # Test imports
    python -c "import torch; print(f'PyTorch: {torch.__version__}')"
    python -c "import tensorflow as tf; print(f'TensorFlow: {tf.__version__}')"
    python -c "import cv2; print(f'OpenCV: {cv2.__version__}')"
    
    print_status "Setup test completed ✓"
}

# Main setup function
main() {
    echo "🩸 BloodScan Backend Setup"
    echo "=========================="
    
    # Check system requirements
    check_python
    check_postgresql
    check_redis
    
    # Setup Python environment
    create_venv
    activate_venv
    install_dependencies
    
    # Setup project
    setup_env
    create_directories
    setup_database
    collect_static
    
    # Test everything
    test_setup
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your Firebase credentials"
    echo "2. Place your Firebase service account JSON in the project root"
    echo "3. Train the ML models: python train_models.py"
    echo "4. Start the development server: python manage.py runserver"
    echo "5. Start Celery worker: celery -A bloodscan worker --loglevel=info"
    echo ""
    echo "API Documentation: http://localhost:8000/api/docs/"
    echo "Admin Panel: http://localhost:8000/admin/"
    echo ""
}

# Run main function
main "$@"
