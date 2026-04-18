"""
Oidar Suite - Syntax-Tests für HTML, JS, MD und CSS Dateien.
Strukturierte und einheitliche Testorganisation mit Fixtures und parametrisierten Tests.
"""
import json
import os
import re
from collections.abc import Callable
from functools import lru_cache
from typing import Final

import pytest


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXCLUDE_DIRS: Final[frozenset[str]] = frozenset({
    '.venv', 'node_modules', '__pycache__', '.git', 'dist', 'build', '.pytest_cache'
})

_RE_TAGS: Final[list[tuple[str, re.Pattern, re.Pattern]]] = [
    (tag, re.compile(rf'<{tag}[^>]*>', re.IGNORECASE), re.compile(rf'</{tag}>', re.IGNORECASE))
    for tag in ('div', 'span', 'nav', 'header', 'footer', 'main', 'section')
]
_RE_SCRIPT: Final[tuple[re.Pattern, re.Pattern]] = (
    re.compile(r'<script', re.IGNORECASE), re.compile(r'</script>', re.IGNORECASE))
_RE_STYLE: Final[tuple[re.Pattern, re.Pattern]] = (
    re.compile(r'<style', re.IGNORECASE), re.compile(r'</style>', re.IGNORECASE))
_RE_CODE_FENCE: Final[re.Pattern] = re.compile(r'```')
_RE_DOCTYPE: Final[re.Pattern] = re.compile(r'<!doctype', re.IGNORECASE)


def check_balanced(content: str, open_c: str, close_c: str) -> tuple[bool, str | None]:
    """Prüft ob Klammern balanced sind."""
    stack = []
    for i, char in enumerate(content):
        if char == open_c:
            stack.append(char)
        elif char == close_c:
            if not stack:
                return False, f"Unmatched '{close_c}' at position {i}"
            stack.pop()
    if stack:
        return False, f"Unmatched '{open_c}' at {content.rfind(open_c)}"
    return True, None


def check_html(content: str) -> list[str]:
    """Prüft grundlegende HTML-Struktur."""
    issues = []
    cl = content.lower()
    
    if not _RE_DOCTYPE.search(cl):
        issues.append("Fehlender <doctype>")
    
    required = ('html', 'head', 'body', 'title')
    for tag in required:
        if f'<{tag}' not in cl:
            issues.append(f"Fehlender <{tag}>")
    
    if 'charset' not in cl:
        issues.append("Fehlender charset")
    
    for _, open_re, close_re in _RE_TAGS:
        if open_re.search(content) and not close_re.search(content):
            issues.append(f"Ungeschlossener Tag")
            break
    
    s_open, s_close = _RE_SCRIPT
    if s_close.search(content) and not s_open.search(content):
        issues.append("Mehr </script> als <script>")
    
    st_open, st_close = _RE_STYLE
    if st_close.search(content) and not st_open.search(content):
        issues.append("Mehr </style> als <style>")
    
    return issues


def check_js(content: str) -> list[str]:
    """Prüft grundlegende JavaScript-Syntax."""
    issues = []
    
    for open_c, close_c in [('[', ']'), ('{', '}'), ('(', ')')]:
        balanced, error = check_balanced(content, open_c, close_c)
        if not balanced:
            issues.append(error)
    
    if content.count('`') % 2:
        issues.append("Ungerade Backticks")
    
    opens, closes = content.count('/*'), content.count('*/')
    if opens != closes:
        issues.append(f"Ungleiche Kommentare: {opens} vs {closes}")
    
    if ';;' in content:
        issues.append("Doppelte Semikolons")
    
    return issues


def check_css(content: str) -> list[str]:
    """Prüft grundlegende CSS-Syntax."""
    issues = []
    balanced, error = check_balanced(content, '{', '}')
    if not balanced:
        issues.append(error)
    balanced, error = check_balanced(content, '(', ')')
    if not balanced:
        issues.append(error)
    return issues


def check_md(content: str) -> list[str]:
    """Prüft grundlegende Markdown-Struktur."""
    if len(_RE_CODE_FENCE.findall(content)) % 2:
        return ["Ungleiche Code-Fences"]
    return []


def check_json(content: str) -> list[str]:
    """Prüft grundlegende JSON-Syntax."""
    issues = []
    balanced, error = check_balanced(content, '{', '}')
    if not balanced:
        issues.append(error)
    balanced, error = check_balanced(content, '[', ']')
    if not balanced:
        issues.append(error)
    try:
        json.loads(content)
    except json.JSONDecodeError as e:
        issues.append(f"JSON-Fehler: {e}")
    return issues


def check_gitignore(content: str) -> list[str]:
    """Prüft grundlegende .gitignore-Struktur."""
    issues = []
    balanced, error = check_balanced(content, '[', ']')
    if not balanced:
        issues.append(error)
    balanced, error = check_balanced(content, '(', ')')
    if not balanced:
        issues.append(error)
    return issues


@lru_cache(maxsize=None)
def find_files(extension: str) -> tuple[str, ...]:
    """Findet rekursiv alle Dateien mit der angegebenen Endung (gecached)."""
    files = []
    for root, dirs, filenames in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for filename in filenames:
            if filename.endswith(extension):
                files.append(os.path.relpath(os.path.join(root, filename), BASE_DIR))
    return tuple(sorted(files))


FileTypeConfig = tuple[str, str, Callable[[str], list[str]]]

SYNTAX_CONFIGS: Final[list[FileTypeConfig]] = [
    ('.html', 'HTML', check_html),
    ('.js', 'JavaScript', check_js),
    ('.css', 'CSS', check_css),
    ('.md', 'Markdown', check_md),
    ('.json', 'JSON', check_json),
    ('.gitignore', 'Gitignore', check_gitignore),
]


@pytest.fixture(scope='session')
def all_files_by_extension() -> dict[str, tuple[str, ...]]:
    """Cached Dateien für alle unterstützten Extensions."""
    return {ext: find_files(ext) for ext, _, _ in SYNTAX_CONFIGS}


@pytest.fixture(scope='session')
def all_contents() -> dict[str, dict[str, str]]:
    """Cached Inhalte für alle Dateien."""
    contents = {}
    for ext, _, _ in SYNTAX_CONFIGS:
        ext_contents = {}
        for path in find_files(ext):
            full = os.path.join(BASE_DIR, path)
            if os.path.exists(full):
                with open(full, 'r', encoding='utf-8') as f:
                    ext_contents[path] = f.read()
        contents[ext] = ext_contents
    return contents


@pytest.mark.parametrize('ext,name,checker', SYNTAX_CONFIGS, ids=['HTML', 'JavaScript', 'CSS', 'Markdown', 'JSON', 'Gitignore'])
class TestFilesExist:
    """Test-Klasse: Prüft ob Dateien existieren."""
    
    def test_files_exist(self, ext, name, checker, all_files_by_extension):
        """Test: Es gibt Dateien für den angegebenen Dateityp."""
        files = all_files_by_extension.get(ext, ())
        
        assert files, f"Keine {name}-Dateien gefunden in {BASE_DIR}"
        assert len(files) > 0, f"Erwartet mindestens 1 {name}-Datei"


@pytest.mark.parametrize('ext,name,checker', SYNTAX_CONFIGS, ids=['HTML', 'JavaScript', 'CSS', 'Markdown', 'JSON', 'Gitignore'])
class TestSyntaxValidation:
    """Test-Klasse: Prüft Syntax validity aller Dateien."""
    
    def test_syntax_valid(self, ext, name, checker, all_files_by_extension, all_contents):
        """Test: Alle Dateien haben gültige Syntax."""
        files = all_files_by_extension.get(ext, ())
        contents = all_contents.get(ext, {})
        
        errors = []
        for path, content in contents.items():
            file_errors = checker(content)
            if file_errors:
                errors.extend(f"{path}: {e}" for e in file_errors)
        
        assert not errors, f"{name} Syntax-Fehler: {errors}"


