"""
Startup script to start Django development server
"""
import subprocess
import sys
import os

def start_server():
    print("=" * 60)
    print("🚀 Starting BloodScan Backend Server")
    print("=" * 60)
    
    # Check if virtual environment is activated
    venv_python = os.path.join('venv', 'Scripts', 'python.exe')
    
    if not os.path.exists(venv_python):
        print("❌ Virtual environment not found!")
        print("Please run setup first.")
        return 1
    
    print("\n✅ Virtual environment found")
    print("📡 Starting Django development server...")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/api/docs/")
    print("\n⚠️  Press Ctrl+C to stop the server\n")
    
    try:
        # Start Django server
        subprocess.run([
            venv_python,
            'manage.py',
            'runserver',
            '0.0.0.0:8000'
        ])
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped!")
        return 0
    except Exception as e:
        print(f"\n❌ Error starting server: {str(e)}")
        return 1

if __name__ == '__main__':
    sys.exit(start_server())
