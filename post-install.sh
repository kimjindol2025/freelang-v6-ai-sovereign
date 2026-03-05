#!/bin/bash

################################################################################
# Claude Automation - Post Install Hook
# KPM 설치 후 자동으로 실행되는 스크립트
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Claude Automation 사후 설치 완료${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo ""

# 설치 경로
INSTALL_PATH="${1:-.}"

echo -e "${GREEN}✓ 설치 완료!${NC}"
echo ""
echo -e "${BLUE}다음 단계:${NC}"
echo ""
echo "1️⃣  첫 번째 프로젝트 생성:"
echo "   cd $INSTALL_PATH"
echo "   ./create-project.sh \"my-project\" \"My Project\" web"
echo ""
echo "2️⃣  또는 바로 사용:"
echo "   claude-create \"my-project\" \"My Project\" api"
echo ""
echo "3️⃣  모니터링:"
echo "   claude-monitor"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
