"""
Oidar Suite (pytest-optimiert)
Tests für die Syntax aller HTMLwave - Syntax Test, JS, MD und CSS Dateien

Optimierungen:
- Parametrisierte Tests (DRY-Prinzip)
- Vorkompilierte Regex-Patterns
- Keine doppelten Datei-Lesevorgänge
- Typ-Annotationen
- Entfernt ungenutzte Parameter
"""
import os
import re
from typing import Callable, Final

import pytest


# Dynamische Ermittlung des Basis-Verzeichnisses
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Verzeichnisse, die ignoriert werden sollen
EXCLUDE_DIRS: Final[frozenset[str]] = frozenset({
    '.venv', 'node_modules', '__pycache__', '.git', 'dist', 'build', '.pytest_cache'
})

# Vorkompilierte Regex-Patterns für bessere Performance
_RE_HTML_TAGS: Final[dict[str, re.Pattern]] = {
    tag: re.compile(rf'<{tag}[^>]*>', re.IGNORECASE) for tag in ['div', 'span', 'nav', 'header', 'footer', 'main', 'section']
}
_RE_HTML_CLOSE: Final[dict[str, re.Pattern]] = {
    tag: re.compile(rf'</{tag}>', re.IGNORECASE) for tag in ['div', 'span', 'nav', 'header', 'footer', 'main', 'section']
}
_RE_SCRIPT_OPEN: Final[re.Pattern] = re.compile(r'<script', re.IGNORECASE)
_RE_SCRIPT_CLOSE: Final[re.Pattern] = re.compile(r'</script>', re.IGNORECASE)
_RE_STYLE_OPEN: Final[re.Pattern] = re.compile(r'<style', re.IGNORECASE)
_RE_STYLE_CLOSE: Final[re.Pattern] = re.compile(r'</style>', re.IGNORECASE)
_RE_DOUBLE_SEMICOLON: Final[re.Pattern] = re.compile(r';;')
_RE_CODE_FENCE: Final[re.Pattern] = re.compile(r'```')


# ============================================================================
# HELPER-FUNKTIONEN
# ============================================================================

def find_files_by_extension(extension: str, base_dir: str = BASE_DIR) -> list[str]:
    """
    Findet rekursiv alle Dateien mit der angegebenen Endung.
    
    Args:
        extension: Dateiendung (z.B. '.html')
        base_dir: Basis-Verzeichnis für die Suche
    
    Returns:
        Sorted list of relative file paths
    """
    files: list[str] = []
    for root, dirs, filenames in os.walk(base_dir):
        # Filtere auszuschließende Verzeichnisse in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for filename in filenames:
            if filename.endswith(extension):
                rel_path = os.path.relpath(os.path.join(root, filename), base_dir)
                files.append(rel_path)
    return sorted(files)


def check_balanced(
    content: str,
    open_char: str,
    close_char: str,
    char_name: str = "char"
) -> tuple[bool, str | None]:
    """
    Generalisierte Prüfung ob Klammern balanced sind.
    
    Args:
        content: Zu prüfender Inhalt
        open_char: Öffnende Klammer (z.B. '[', '{', '(')
        close_char: Schließende Klammer (z.B. ']', '}', ')')
        char_name: Name für Fehlermeldung
    
    Returns:
        tuple: (is_balanced, error_message or None)
    """
    stack: list[str] = []
    for i, char in enumerate(content):
        if char == open_char:
            stack.append(char)
        elif char == close_char:
            if not stack:
                return False, f"Unmatched closing '{close_char}' at position {i}"
            stack.pop()
    if stack:
        pos = content.rfind(open_char)
        return False, f"Unmatched opening '{open_char}' at position {pos}"
    return True, None


def check_balanced_brackets(content: str) -> tuple[bool, str | None]:
    """Prüft ob Klammern ([]) balanced sind."""
    return check_balanced(content, '[', ']', 'bracket')


def check_balanced_braces(content: str) -> tuple[bool, str | None]:
    """Prüft ob geschweifte Klammern ({}) balanced sind."""
    return check_balanced(content, '{', '}', 'brace')


def check_balanced_parens(content: str) -> tuple[bool, str | None]:
    """Prüft ob runde Klammern (()) balanced sind."""
    return check_balanced(content, '(', ')', 'paren')


def check_html_structure(content: str) -> list[str]:
    """
    Prüft grundlegende HTML-Struktur.
    
    Returns:
        Liste von gefundenen Problemen
    """
    issues: list[str] = []
    content_lower = content.lower()
    
    # Erforderliche HTML-Tags (mit any() effizienter geprüft)
    required_tags = {
        'doctype': lambda c: '<!doctype html>' in c.lower(),
        'html': lambda c: '<html' in c.lower(),
        'head': lambda c: '<head>' in c or '<head ' in c,
        'body': lambda c: '<body>' in c or '<body ' in c,
        'title': lambda c: '<title>' in c,
    }
    
    for tag_name, check_fn in required_tags.items():
        if not check_fn(content):
            issues.append(f"Fehlender <{tag_name}> Tag")
    
    #charset mit exists-Check
    if 'charset' not in content_lower:
        issues.append("Fehlender charset Meta-Tag")
    
    # Prüfe auf ungeschlossene Tags (nur häufige Tags)
    for tag in ['div', 'span', 'nav', 'header', 'footer', 'main', 'section']:
        open_count = len(_RE_HTML_TAGS[tag].findall(content))
        close_count = len(_RE_HTML_CLOSE[tag].findall(content))
        if open_count != close_count:
            issues.append(f"Ungleiche Anzahl {tag}-Tags: {open_count} offen, {close_count} geschlossen")
    
    # Spezielle Behandlung für script/style (können externe sein)
    for open_re, close_re, name in [
        (_RE_SCRIPT_OPEN, _RE_SCRIPT_CLOSE, 'script'),
        (_RE_STYLE_OPEN, _RE_STYLE_CLOSE, 'style')
    ]:
        opens = len(open_re.findall(content))
        closes = len(close_re.findall(content))
        if opens != closes and closes > opens:
            issues.append(f"Mehr </{name}> als <{name}>: {opens} offen, {closes} geschlossen")
    
    return issues


def check_js_syntax(content: str) -> list[str]:
    """
    Prüft grundlegende JavaScript-Syntax.
    
    Returns:
        Liste von gefundenen Problemen
    """
    issues: list[str] = []
    
    # 1. Klammerung in einem Durchlauf prüfen
    for check_fn in (check_balanced_braces, check_balanced_brackets, check_balanced_parens):
        balanced, error = check_fn(content)
        if not balanced and error:
            issues.append(error)
    
    # 2. Zähler für alle String-Suchen in einem Durchlauf
    backtick_count = content.count('`')
    comment_open = content.count('/*')
    comment_close = content.count('*/')
    
    # Template-Literals
    if backtick_count % 2 != 0:
        issues.append("Ungerade Backticks (Template-Literal nicht geschlossen)")
    
    # Multi-Line Kommentare
    if comment_open != comment_close:
        issues.append(f"Ungleiche Multi-Line-Kommentare: {comment_open} offen, {comment_close} geschlossen")
    
    # Doppelte Semikolons
    if _RE_DOUBLE_SEMICOLON.search(content):
        issues.append(f"Doppelte Semikolons gefunden")
    
    return issues


def check_css_syntax(content: str) -> list[str]:
    """
    Prüft grundlegende CSS-Syntax.
    
    Returns:
        Liste von gefundenen Problemen
    """
    issues: list[str] = []
    
    # 1. Prüfe geschweifte Klammern
    balanced, error = check_balanced_braces(content)
    if not balanced and error:
        issues.append(error)
    
    # 2. Prüfe Klammern in URLs (vereinfacht)
    balanced, error = check_balanced_parens(content)
    if not balanced and error:
        issues.append(error)
    
    return issues


def check_markdown_structure(content: str) -> list[str]:
    """
    Prüft grundlegende Markdown-Struktur.
    
    Returns:
        Liste von gefundenen Problemen
    """
    issues: list[str] = []
    
    # Prüfe Code-Fences (```)
    code_fences = len(_RE_CODE_FENCE.findall(content))
    if code_fences % 2 != 0:
        issues.append(f"Ungleiche Code-Fences: {code_fences}")
    
    return issues


# ============================================================================
# TEST-KONFIGURATION
# ============================================================================

class SyntaxCheckConfig:
    """Konfiguration für einen Syntax-Test-Typ"""
    
    def __init__(
        self,
        extension: str,
        checker: Callable[[str], list[str]],
        file_type_name: str,
        critical_patterns: list[str] | None = None
    ) -> None:
        self.extension = extension
        self.checker = checker
        self.file_type_name = file_type_name
        self.critical_patterns = critical_patterns or []


# Konfiguration für alle unterstützten Dateitypen
SYNTAX_CONFIGS: list[SyntaxCheckConfig] = [
    SyntaxCheckConfig(
        extension='.html',
        checker=check_html_structure,
        file_type_name='HTML'
    ),
    SyntaxCheckConfig(
        extension='.js',
        checker=check_js_syntax,
        file_type_name='JavaScript'
    ),
    SyntaxCheckConfig(
        extension='.css',
        checker=check_css_syntax,
        file_type_name='CSS'
    ),
    SyntaxCheckConfig(
        extension='.md',
        checker=check_markdown_structure,
        file_type_name='Markdown',
        critical_patterns=['readme', 'changelog']
    ),
]


# ============================================================================
# PYTEST-TESTS (PARAMETRISIERT)
# ============================================================================

@pytest.mark.parametrize('config', SYNTAX_CONFIGS, ids=lambda c: c.extension)
class TestSyntax:
    """Parametrisierte Test-Klasse für alle Syntax-Prüfungen"""
    
    @pytest.fixture
    def files(self, config: SyntaxCheckConfig) -> list[str]:
        """Fixture: Liste aller Dateien für den aktuellen Typ"""
        return find_files_by_extension(config.extension)
    
    @pytest.fixture
    def file_content_cache(self, config: SyntaxCheckConfig) -> dict[str, str]:
        """Cache für Dateiinhalte - class-scoped für Effizienz"""
        files = find_files_by_extension(config.extension)
        cache: dict[str, str] = {}
        for filepath in files:
            full_path = os.path.join(BASE_DIR, filepath)
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8') as f:
                    cache[filepath] = f.read()
        return cache
    
    def test_files_exist(self, files: list[str], config: SyntaxCheckConfig):
        """Test: Es gibt Dateien dieses Typs im Projekt"""
        assert len(files) > 0, f"Keine {config.file_type_name}-Dateien gefunden"
    
    def test_syntax_all_files(
        self,
        files: list[str],
        file_content_cache: dict[str, str],
        config: SyntaxCheckConfig
    ):
        """Test: Alle Dateien haben gültige Syntax"""
        # Nutze List Comprehension für effizientere Sammlung
        errors = [
            f"{filepath}: {issue}"
            for filepath in files
            if filepath in file_content_cache
            for issue in config.checker(file_content_cache[filepath])
        ]
        
        # Für Markdown: Nur kritische Dateien (README, Changelog) sollten fehlschlagen
        if config.extension == '.md' and config.critical_patterns:
            critical_errors = [
                f"{filepath}: {issue}"
                for filepath in files
                if any(p in filepath.lower() for p in config.critical_patterns)
                for issue in config.checker(file_content_cache[filepath])
            ]
            if critical_errors:
                errors = critical_errors
        
        assert len(errors) == 0, f"{config.file_type_name}-Syntax Fehler: {errors}"
