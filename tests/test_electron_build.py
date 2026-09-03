"""
Electron build configuration tests for Oidarwave.
"""
import json
from pathlib import Path

import pytest


@pytest.fixture(scope="session")
def base_dir() -> Path:
    return Path(__file__).resolve().parent.parent


@pytest.mark.unit
def test_electron_files_exist(base_dir: Path):
    """Test that Electron main file exists."""
    main_path = base_dir / "electron" / "main.js"
    assert main_path.exists(), f"Electron main file not found at {main_path}"


@pytest.mark.unit
def test_package_json_build_config(base_dir: Path):
    """Test that package.json has valid Electron builder configuration."""
    package_path = base_dir / "package.json"
    assert package_path.exists(), f"package.json not found at {package_path}"
    
    with open(package_path) as f:
        package_json = json.load(f)
    
    assert "build" in package_json, "package.json should have build configuration"
    
    build_config = package_json["build"]
    
    assert "appId" in build_config, "build.appId should be defined"
    assert "productName" in build_config, "build.productName should be defined"
    assert "directories" in build_config, "build.directories should be defined"
    assert "files" in build_config, "build.files should be defined"
    
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
def test_dev_dependencies(base_dir: Path):
    """Test that electron and electron-builder are in devDependencies."""
    package_path = base_dir / "package.json"
    
    with open(package_path) as f:
        package_json = json.load(f)
    
    dev_deps = package_json.get("devDependencies", {})
    
    assert "electron" in dev_deps, "devDependencies should include electron"
    assert "electron-builder" in dev_deps, "devDependencies should include electron-builder"