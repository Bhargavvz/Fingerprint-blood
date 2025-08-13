#!/usr/bin/env python3
"""
Setup script to create all necessary directories for BloodScan backend.
"""
import os
from pathlib import Path

def create_directories():
    """Create all necessary directories."""
    base_dir = Path(__file__).resolve().parent
    
    directories = [
        'logs',
        'media',
        'staticfiles', 
        'ml_models',
        'ml_models/trained_models',
    ]
    
    for directory in directories:
        dir_path = base_dir / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {dir_path}")
    
    # Create empty log files
    log_files = [
        'logs/django.log',
        'logs/training.log',
    ]
    
    for log_file in log_files:
        log_path = base_dir / log_file
        log_path.touch(exist_ok=True)
        print(f"✅ Created log file: {log_path}")
    
    print("\n🎉 All directories and files created successfully!")

if __name__ == '__main__':
    create_directories()
