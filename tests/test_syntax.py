"""
Oidar Suite - Syntax-Tests für HTML, JS, MD und CSS Dateien
Optimiert mit parametrisierten Tests und Caching.
"""
import os
import re
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


def find_files(extension: str) -> list[str]:
    """Findet rekursiv alle Dateien mit der angegebenen Endung."""
    files = []
    for root, dirs, filenames in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for filename in filenames:
            if filename.endswith(extension):
                files.append(os.path.relpath(os.path.join(root, filename), BASE_DIR))
    return sorted(files)


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
    issues, cl = [], content.lower()
    
    # Check for doctype - might be <!DOCTYPE or <!doctype
    if '<!doctype' not in cl:
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


# Konfiguration für alle unterstützten Dateitypen
SYNTAX_CONFIGS = (
    ('.html', 'HTML'),
    ('.js', 'JavaScript'),
    ('.css', 'CSS'),
    ('.md', 'Markdown'),
)

CHECKER_BY_EXT = {
    '.html': check_html,
    '.js': check_js,
    '.css': check_css,
    '.md': check_md,
}


_file_cache: dict[str, dict[str, str]] = {}


def _get_contents(extension: str) -> dict[str, str]:
    """Gecachte Dateiinhalte abrufen."""
    if extension not in _file_cache:
        cache = {}
        for path in find_files(extension):
            full = os.path.join(BASE_DIR, path)
            if os.path.exists(full):
                with open(full, 'r', encoding='utf-8') as f:
                    cache[path] = f.read()
        _file_cache[extension] = cache
    return _file_cache[extension]


@pytest.mark.parametrize('ext,name', SYNTAX_CONFIGS, ids=lambda x: x[1])
class TestSyntax:
    """Parametrisierte Tests für alle Syntax-Prüfungen"""
    
    def test_files_exist(self, ext: str, name: str):
        """Test: Es gibt Dateien dieses Typs."""
        files = find_files(ext)
        assert files, f"Keine {name}-Dateien gefunden"
    
    def test_syntax(self, ext: str, name: str):
        """Test: Alle Dateien haben gültige Syntax."""
        contents = _get_contents(ext)
        files = find_files(ext)
        checker = CHECKER_BY_EXT[ext]
        
        errors = [
            f"{p}: {e}"
            for p in files
            if p in contents
            for e in checker(contents[p])
        ]
        
        assert not errors, f"{name} Fehler: {errors}"
