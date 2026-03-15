#!/bin/sh

# shellcheck disable=SC2034 # Explains why variables are unused for readability
DEFAULT_BRANCH=develop

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# Disable colors if terminal doesn't support them
if [ ! -t 1 ]; then
  RED='' GREEN='' YELLOW='' BLUE='' BOLD='' RESET=''
fi

info()    { printf "${BLUE}ℹ ${BOLD}%s${RESET}\n" "$1"; }
success() { printf "${GREEN}✔ ${BOLD}%s${RESET}\n" "$1"; }
warn()    { printf "${YELLOW}⚠ ${BOLD}%s${RESET}\n" "$1"; }
error()   { printf "${RED}✖ ${BOLD}%s${RESET}\n" "$1"; }
separator()   { printf "\n"; }

run_step() {
  description="$1"
  shift
  info "$description"
  if "$@"; then
    success "$description complete"
  else
    error "$description failed"
    exit 1
  fi
}
