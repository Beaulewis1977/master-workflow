"""
Python Language Support Template
For MASTER-WORKFLOW v3.0
"""

LANGUAGE_CONFIG = {
    'language': 'python',
    'extensions': ['.py', '.pyw', '.pyx', '.pyi'],
    
    # Package management
    'package_management': {
        'primary': 'pip',
        'alternatives': ['poetry', 'pipenv', 'conda'],
        'requirements_file': 'requirements.txt',
        'lock_files': ['Pipfile.lock', 'poetry.lock']
    },
    
    # Common frameworks
    'frameworks': {
        'web': ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Tornado'],
        'data_science': ['NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow', 'PyTorch'],
        'testing': ['pytest', 'unittest', 'nose2', 'doctest'],
        'async': ['asyncio', 'aiohttp', 'Twisted']
    },
    
    # Development tools
    'tools': {
        'linter': 'pylint',
        'formatter': 'black',
        'type_checker': 'mypy',
        'security': 'bandit',
        'complexity': 'radon'
    },
    
    # Testing configuration
    'testing': {
        'framework': 'pytest',
        'coverage': 'coverage',
        'config_file': 'pytest.ini',
        'test_directory': 'tests/',
        'conventions': 'test_*.py or *_test.py'
    },
    
    # Virtual environment
    'virtual_env': {
        'tool': 'venv',
        'alternatives': ['virtualenv', 'conda', 'pyenv'],
        'activation': {
            'unix': 'source venv/bin/activate',
            'windows': 'venv\\Scripts\\activate'
        }
    },
    
    # Code style
    'style': {
        'guide': 'PEP 8',
        'line_length': 88,  # Black default
        'naming': {
            'functions': 'snake_case',
            'classes': 'PascalCase',
            'constants': 'UPPER_SNAKE_CASE',
            'modules': 'snake_case'
        }
    },
    
    # Type hints
    'typing': {
        'supported': True,
        'version': '3.9+',
        'imports': 'from typing import ...',
        'checker': 'mypy'
    },
    
    # Deployment
    'deployment': {
        'platforms': ['Heroku', 'AWS Lambda', 'Google Cloud', 'Azure'],
        'containerization': 'Docker',
        'wsgi': ['Gunicorn', 'uWSGI', 'Waitress'],
        'asgi': ['Uvicorn', 'Hypercorn', 'Daphne']
    },
    
    # Common patterns
    'patterns': {
        'dependency_injection': True,
        'decorators': True,
        'context_managers': True,
        'generators': True,
        'async_await': True,
        'dataclasses': True
    }
}

def get_config():
    """Return the Python language configuration."""
    return LANGUAGE_CONFIG

if __name__ == "__main__":
    import json
    print(json.dumps(LANGUAGE_CONFIG, indent=2))