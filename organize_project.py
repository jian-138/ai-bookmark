#!/usr/bin/env python
"""
Project structure organizer for ai-bookmark repository
This script will reorganize the project structure to improve maintainability
"""
import os
import shutil
from pathlib import Path

def organize_project_structure():
    """
    Organizes the ai-bookmark project structure by:
    1. Creating a docs directory and moving documentation files
    2. Removing duplicate directories
    3. Cleaning up unnecessary files
    """
    print("Starting project structure organization...")
    
    # Define documentation files to move
    doc_files = [
        'API_ALIGNMENT_CHANGES.md',
        'BACKEND_CONFIGURATION.md', 
        'BUILD_FIX.md',
        'COMPILE_FIX_2.md',
        'COMPILE_FIX_API_ALIGNMENT.md',
        'DEVELOPMENT_GUIDE.md',
        'DEV_MODE_GUIDE.md',
        'FINAL_STATUS.md',
        'GIT_PUSH_GUIDE.md',
        'INTEGRATION_TESTING_CHECKLIST.md',
        'PROGRESS_SUMMARY.md',
        'PROJECT_COMPLETE.md',
        'PROJECT_RENAME_NOTE.md',
        'api-contract-v1.1.md',
        '项目目标回顾.md'
    ]
    
    # Create docs directory if it doesn't exist
    docs_dir = Path('docs')
    docs_dir.mkdir(exist_ok=True)
    print(f"Created directory: {docs_dir}")
    
    # Move documentation files
    moved_files = []
    for doc_file in doc_files:
        source = Path(doc_file)
        if source.exists():
            destination = docs_dir / source.name
            try:
                shutil.move(str(source), str(destination))
                moved_files.append(source.name)
                print(f"Moved {source} to {destination}")
            except Exception as e:
                print(f"Could not move {source}: {e}")
    
    # Remove duplicate directories
    dirs_to_remove = ['ai-bookmark', 'ai-bookmark-1', 'linkwarden']
    for dir_name in dirs_to_remove:
        dir_path = Path(dir_name)
        if dir_path.exists() and dir_path.is_dir():
            try:
                shutil.rmtree(dir_path)
                print(f"Removed directory: {dir_path}")
            except Exception as e:
                print(f"Could not remove directory {dir_path}: {e}")
    
    # Remove temporary test file created earlier
    test_file = Path('test_app.py')
    if test_file.exists():
        try:
            test_file.unlink()
            print(f"Removed temporary file: {test_file}")
        except Exception as e:
            print(f"Could not remove {test_file}: {e}")
    
    print("\nProject structure organization completed!")
    print(f"Moved {len(moved_files)} documentation files to docs/ directory")
    print("Removed duplicate directories")
    print("\nNew structure:")
    print("- Core application code in root directory")
    print("- Documentation files in docs/ directory") 
    print("- Clean directory structure without duplicates")

if __name__ == "__main__":
    organize_project_structure()