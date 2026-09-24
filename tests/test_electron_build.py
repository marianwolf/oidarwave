"""
Electron build configuration tests for Oidarwave.
"""
from pathlib import Path

import pytest


@pytest.mark.unit
def test_electron_files_exist(base_dir: Path):
    """Test that Electron main file exists."""
    main_path = base_dir / "electron" / "main.js"
    assert main_path.exists(), f"Electron main file not found at {main_path}"


@pytest.mark.unit
def test_package_json_build_config(package_json: dict):
    """Test that package.json has valid Electron builder configuration."""
    assert "build" in package_json, "package.json should have build configuration"

    build_config = package_json["build"]

    for key in ("appId", "productName", "directories", "files"):
        assert key in build_config, f"build.{key} should be defined"

    files = build_config["files"]
    required_patterns = [
        "electron/**/*",
        "src/**/*",
        "index.html",
        "favicon/**/*",
        "manifest.json",
        "video/**/*",
        "impressum/**/*"
    ]

    for pattern in required_patterns:
        assert pattern in files, f"build.files should include {pattern}"


@pytest.mark.unit
def test_dev_dependencies(package_json: dict):
    """Test that electron and electron-builder are in devDependencies."""
    dev_deps = package_json.get("devDependencies", {})

    assert "electron" in dev_deps, "devDependencies should include electron"
    assert "electron-builder" in dev_deps, "devDependencies should include electron-builder"
