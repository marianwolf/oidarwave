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
from typing import Callable, Final, Protocol

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


def check_balanced_brackets(content: str) -> tuple[bool, str | None]:
    """
    Prüft ob Klammern ([]) balanced sind.
    
    Returns:
        tuple: (is_balanced, error_message or None)
    """
    stack: list[str] = []
    for i, char in enumerate(content):
        if char == '[':
            stack.append('[')
        elif char == ']':
            if not stack:
                return False, f"Unmatched closing ']' at position {i}"
            stack.pop()
    if stack:
        return False, f"Unmatched opening '[' at position {content.rfind('[')}"
    return True, None


def check_balanced_braces(content: str) -> tuple[bool, str | None]:
    """
    Prüft ob geschweifte Klammern ({}) balanced sind.
    
    Returns:
        tuple: (is_balanced, error_message or None)
    """
    stack: list[str] = []
    for i, char in enumerate(content):
        if char == '{':
            stack.append('{')
        elif char == '}':
            if not stack:
                return False, f"Unmatched closing '}}' at position {i}"
            stack.pop()
    if stack:
        return False, f"Unmatched opening '{{' at position {content.rfind('{{')}"
    return True, None


def check_balanced_parens(content: str) -> tuple[bool, str | None]:
    """
    Prüft ob runde Klammern (()) balanced sind.
    
    Returns:
        tuple: (is_balanced, error_message or None)
    """
    stack: list[str] = []
    for i, char in enumerate(content):
        if char == '(':
            stack.append('(')
        elif char == ')':
            if not stack:
                return False, f"Unmatched closing ')' at position {i}"
            stack.pop()
    if stack:
        return False, f"Unmatched opening '(' at position {content.rfind('(')}"
    return True, None


def check_html_structure(content: str) -> list[str]:
    """
    Prüft grundlegende HTML-Struktur.
    
    Returns:
        Liste von gefundenen Problemen
    """
    issues: list[str] = []
    content_lower = content.lower()
    
    # 1. Prüfe DOCTYPE
    if '<!DOCTYPE html>' not in content and '<!doctype html>' not in content_lower:
        issues.append("Fehlender DOCTYPE")
    
    # 2. Prüfe html-Tag
    if '<html' not in content_lower:
        issues.append("Fehlender <html> Tag")
    
    # 3. Prüfe head-Tag
    if '<head>' not in content and '<head ' not in content:
        issues.append("Fehlender <head> Tag")
    
    # 4. Prüfe body-Tag
    if '<body>' not in content and '<body ' not in content:
        issues.append("Fehlender <body> Tag")
    
    # 5. Prüfe Title-Tag
    if '<title>' not in content:
        issues.append("Fehlender <title> Tag")
    
    # 6. Prüfe Meta-Charset
    if 'charset' not in content_lower:
        issues.append("Fehlender charset Meta-Tag")
    
    # 7. Prüfe auf ungeschlossene Tags (nur häufige Tags)
    for tag in ['div', 'span', 'nav', 'header', 'footer', 'main', 'section']:
        open_count = len(_RE_HTML_TAGS[tag].findall(content))
        close_count = len(_RE_HTML_CLOSE[tag].findall(content))
        if open_count != close_count:
            issues.append(f"Ungleiche Anzahl {tag}-Tags: {open_count} offen, {close_count} geschlossen")
    
    # Spezielle Behandlung für script/style (können externe sein)
    script_opens = len(_RE_SCRIPT_OPEN.findall(content))
    script_closes = len(_RE_SCRIPT_CLOSE.findall(content))
    if script_opens != script_closes:
        if script_closes > script_opens:
            issues.append(f"Mehr </script> als <script>: {script_opens} offen, {script_closes} geschlossen")
    
    style_opens = len(_RE_STYLE_OPEN.findall(content))
    style_closes = len(_RE_STYLE_CLOSE.findall(content))
    if style_opens != style_closes:
        if style_closes > style_opens:
            issues.append(f"Mehr </style> als <style>: {style_opens} offen, {style_closes} geschlossen")
    
    return issues


def check_js_syntax(content: str) -> list[str]:
    """
    Prüft grundlegende JavaScript-Syntax.
    
    Returns:
        Liste von gefundenen Problemen
    """
    issues: list[str] = []
    
    # 1. Prüfe Klammerung
    balanced, error = check_balanced_braces(content)
    if not balanced and error:
        issues.append(error)
    
    balanced, error = check_balanced_brackets(content)
    if not balanced and error:
        issues.append(error)
    
    balanced, error = check_balanced_parens(content)
    if not balanced and error:
        issues.append(error)
    
    # 2. Prüfe Template-Literals (vereinfacht)
    template_opens = content.count('`')
    if template_opens % 2 != 0:
        issues.append("Ungerade Backticks (Template-Literal nicht geschlossen)")
    
    # 3. Prüfe Multi-Line Kommentare
    multi_line_comment_opens = content.count('/*')
    multi_line_comment_closes = content.count('*/')
    if multi_line_comment_opens != multi_line_comment_closes:
        issues.append(f"Ungleiche Multi-Line-Kommentare: {multi_line_comment_opens} offen, {multi_line_comment_closes} geschlossen")
    
    # 4. Prüfe Doppelte Semikolons
    double_semicolons = len(_RE_DOUBLE_SEMICOLON.findall(content))
    if double_semicolons > 0:
        issues.append(f"Doppelte Semikolons gefunden: {double_semicolons}")
    
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
        """Cache für Dateiinhalte um doppeltes Lesen zu vermeiden"""
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
        errors: list[str] = []
        
        # Prüfe alle Dateien
        for filepath in files:
            if filepath not in file_content_cache:
                errors.append(f"{filepath}: Datei nicht gefunden")
                continue
            
            content = file_content_cache[filepath]
            issues = config.checker(content)
            
            for issue in issues:
                errors.append(f"{filepath}: {issue}")
        
        # Für Markdown: Nur kritische Dateien (README, Changelog) sollten fehlschlagen
        if config.extension == '.md' and config.critical_patterns:
            critical_errors: list[str] = []
            for filepath in files:
                # Prüfe ob Datei kritisch ist
                is_critical = any(
                    pattern in filepath.lower() 
                    for pattern in config.critical_patterns
                )
                if not is_critical:
                    continue
                
                if filepath not in file_content_cache:
                    critical_errors.append(f"{filepath}: Datei nicht gefunden")
                    continue
                
                content = file_content_cache[filepath]
                md_issues = config.checker(content)
                for issue in md_issues:
                    critical_errors.append(f"{filepath}: {issue}")
            
            # Nur kritische Fehler sollten zum Test-Failure führen
            if critical_errors:
                errors = critical_errors
        
        assert len(errors) == 0, f"{config.file_type_name}-Syntax Fehler: {errors}"
