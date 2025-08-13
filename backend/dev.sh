#!/bin/bash

# BloodScan Backend Development Server
# This script starts all necessary services for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if virtual environment is activated
check_venv() {
    if [[ "$VIRTUAL_ENV" != "" ]]; then
        print_status "Virtual environment is active ✓"
    else
        print_warning "Virtual environment not active. Activating..."
        source venv/bin/activate
    fi
}

# Start background services
start_services() {
    print_header "🚀 Starting BloodScan Services..."
    
    # Check if Docker is available
    if command -v docker-compose &> /dev/null; then
        print_status "Starting database and Redis..."
        docker-compose up -d db redis
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 5
        
        # Check database connection
        python manage.py check --database default
        
    else
        print_warning "Docker not available. Make sure PostgreSQL and Redis are running manually."
    fi
}

# Run migrations
run_migrations() {
    print_status "Running database migrations..."
    python manage.py migrate
}

# Start Celery worker in background
start_celery() {
    print_status "Starting Celery worker..."
    
    # Kill existing celery processes
    pkill -f "celery worker" || true
    
    # Start new celery worker in background
    celery -A bloodscan worker --loglevel=info --detach
    
    print_status "Celery worker started in background"
}

# Start Django development server
start_django() {
    print_status "Starting Django development server..."
    print_status "API will be available at: http://localhost:8000"
    print_status "API Documentation: http://localhost:8000/api/docs/"
    print_status "Admin Panel: http://localhost:8000/admin/"
    print_status ""
    print_status "Press Ctrl+C to stop all services"
    
    # Trap SIGINT to cleanup processes
    trap cleanup_and_exit INT
    
    python manage.py runserver 0.0.0.0:8000
}

# Cleanup function
cleanup_and_exit() {
    print_status ""
    print_status "Shutting down services..."
    
    # Kill celery workers
    pkill -f "celery worker" || true
    
    # Stop Docker services
    if command -v docker-compose &> /dev/null; then
        docker-compose stop
    fi
    
    print_status "All services stopped. Goodbye! 👋"
    exit 0
}

# Show system status
show_status() {
    print_header "📊 System Status"
    echo "=================="
    
    # Check Python environment
    python --version
    
    # Check database connection
    if python manage.py check --database default &> /dev/null; then
        print_status "Database connection: ✓"
    else
        print_error "Database connection: ✗"
    fi
    
    # Check Redis connection
    if python -c "import redis; r = redis.Redis(); r.ping()" &> /dev/null; then
        print_status "Redis connection: ✓"
    else
        print_error "Redis connection: ✗"
    fi
    
    # Check ML models
    if [ -f "ml_models/trained_models/fingerprint_cnn.pth" ]; then
        print_status "CNN Model: ✓"
    else
        print_warning "CNN Model: ✗ (Run train_models.py to train)"
    fi
    
    echo ""
}

# Main function
main() {
    case "${1:-start}" in
        "start")
            print_header "🩸 BloodScan Development Server"
            print_header "================================"
            
            check_venv
            show_status
            start_services
            run_migrations
            start_celery
            start_django
            ;;
        
        "stop")
            print_status "Stopping all services..."
            pkill -f "celery worker" || true
            docker-compose stop || true
            print_status "Services stopped ✓"
            ;;
        
        "restart")
            $0 stop
            sleep 2
            $0 start
            ;;
        
        "status")
            show_status
            ;;
        
        "logs")
            print_status "Showing recent logs..."
            docker-compose logs --tail=50 -f
            ;;
        
        "shell")
            print_status "Starting Django shell..."
            python manage.py shell
            ;;
        
        "train")
            print_status "Starting model training..."
            python train_models.py "$@"
            ;;
        
        "help"|"-h"|"--help")
            echo "BloodScan Development Server"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  start    Start all services (default)"
            echo "  stop     Stop all services"
            echo "  restart  Restart all services"
            echo "  status   Show system status"
            echo "  logs     Show service logs"
            echo "  shell    Open Django shell"
            echo "  train    Start model training"
            echo "  help     Show this help message"
            ;;
        
        *)
            print_error "Unknown command: $1"
            print_status "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
