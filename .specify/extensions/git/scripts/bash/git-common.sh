#!/usr/bin/env bash
# Git-specific common functions for the git extension.
# Extracted from scripts/bash/common.sh — contains only git-specific
# branch validation and detection logic.

# Check if we have git available at the repo root
has_git() {
    local repo_root="${1:-$(pwd)}"
    { [ -d "$repo_root/.git" ] || [ -f "$repo_root/.git" ]; } && \
        command -v git >/dev/null 2>&1 && \
        git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1
}

# Strip a single optional path segment (e.g. gitflow "feat/004-name" -> "004-name").
# Only when the full name is exactly two slash-free segments; otherwise returns the raw name.
spec_kit_effective_branch_name() {
    local raw="$1"
    if [[ "$raw" =~ ^([^/]+)/([^/]+)$ ]]; then
        printf '%s\n' "${BASH_REMATCH[2]}"
    else
        printf '%s\n' "$raw"
    fi
}

# Validate that a branch name matches the expected feature branch pattern.
# Accepts sequential (###-* with >=3 digits) or timestamp (YYYYMMDD-HHMMSS-*) formats.
# Logic aligned with scripts/bash/common.sh check_feature_branch after effective-name normalization.
check_feature_branch() {
    local raw="$1"
    local has_git_repo="$2"

    # For non-git repos, we can't enforce branch naming but still provide output
    if [[ "$has_git_repo" != "true" ]]; then
        echo "[specify] Warning: Git repository not detected; skipped branch validation" >&2
        return 0
    fi

    local branch
    branch=$(spec_kit_effective_branch_name "$raw")

    # Accept sequential prefix (3+ digits) but exclude malformed timestamps
    # Malformed: 7-or-8 digit date + 6-digit time with no trailing slug (e.g. "2026031-143022" or "20260319-143022")
    local is_sequential=false
    if [[ "$branch" =~ ^[0-9]{3,}- ]] && [[ ! "$branch" =~ ^[0-9]{7}-[0-9]{6}- ]] && [[ ! "$branch" =~ ^[0-9]{7,8}-[0-9]{6}$ ]]; then
        is_sequential=true
    fi
    if [[ "$is_sequential" != "true" ]] && [[ ! "$branch" =~ ^[0-9]{8}-[0-9]{6}- ]]; then
        echo "ERROR: Not on a feature branch. Current branch: $raw" >&2
        echo "Feature branches should be named like: 001-feature-name, 1234-feature-name, or 20260319-143022-feature-name" >&2
        return 1
    fi

    return 0
}

# Read a top-level string value from git-config.yml (simple key: value parser).
read_git_config_value() {
    local key="$1"
    local default_value="${2:-}"
    local config_file="${3:-}"

    if [ -z "$config_file" ]; then
        local repo_root
        repo_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
        config_file="$repo_root/.specify/extensions/git/git-config.yml"
    fi

    if [ ! -f "$config_file" ]; then
        printf '%s\n' "$default_value"
        return 0
    fi

    local value
    value=$(grep -E "^${key}:" "$config_file" 2>/dev/null | head -1 | sed -E 's/^[^:]*:[[:space:]]*//' | sed -E 's/^["'\''"]|["'\''"]$//g')

    if [ -n "$value" ]; then
        printf '%s\n' "$value"
    else
        printf '%s\n' "$default_value"
    fi
}

# Checkout the configured base branch before creating a feature branch.
checkout_base_branch() {
    local base_branch
    base_branch=$(read_git_config_value "base_branch" "main")

    if git show-ref --verify --quiet "refs/heads/${base_branch}"; then
        git checkout -q "$base_branch"
        return 0
    fi

    if git remote | grep -q .; then
        git fetch --quiet origin "$base_branch" 2>/dev/null || true
    fi

    if git show-ref --verify --quiet "refs/remotes/origin/${base_branch}"; then
        git checkout -q -B "$base_branch" "origin/${base_branch}"
        return 0
    fi

    echo "[specify] Warning: Base branch '${base_branch}' not found; creating feature branch from current HEAD" >&2
    return 1
}
