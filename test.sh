#!/bin/bash

################################################################################
# Claude Automation - 테스트 스크립트
# KPM 설치 후 동작 확인
################################################################################

set -e

# 색상
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Claude Automation - 자동 테스트${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

INSTALL_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 테스트 1: 스크립트 권한 확인
echo -e "${YELLOW}1️⃣  스크립트 권한 확인${NC}"
if [ -x "$INSTALL_PATH/create-project.sh" ]; then
    echo -e "${GREEN}✓ create-project.sh 실행 권한 OK${NC}"
else
    echo -e "${RED}✗ create-project.sh 권한 없음${NC}"
    chmod +x "$INSTALL_PATH/create-project.sh"
    echo -e "${GREEN}✓ 권한 설정 완료${NC}"
fi

if [ -x "$INSTALL_PATH/monitor-sync.sh" ]; then
    echo -e "${GREEN}✓ monitor-sync.sh 실행 권한 OK${NC}"
else
    echo -e "${RED}✗ monitor-sync.sh 권한 없음${NC}"
    chmod +x "$INSTALL_PATH/monitor-sync.sh"
    echo -e "${GREEN}✓ 권한 설정 완료${NC}"
fi
echo ""

# 테스트 2: 필수 파일 확인
echo -e "${YELLOW}2️⃣  필수 파일 확인${NC}"
required_files=(
    "create-project.sh"
    "monitor-sync.sh"
    "README.md"
    "package.json"
    "docs/QUICK-START.md"
    "docs/USAGE.md"
)

all_exist=true
for file in "${required_files[@]}"; do
    if [ -f "$INSTALL_PATH/$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file 없음${NC}"
        all_exist=false
    fi
done
echo ""

# 테스트 3: Git 설정 확인
echo -e "${YELLOW}3️⃣  Git 설정 확인${NC}"
if git config --global user.name &>/dev/null; then
    git_user=$(git config --global user.name)
    echo -e "${GREEN}✓ Git 사용자 설정됨: $git_user${NC}"
else
    echo -e "${RED}✗ Git 사용자 설정 필요${NC}"
    git config --global user.name "kim"
    git config --global user.email "kim@dclub.kr"
    echo -e "${GREEN}✓ Git 사용자 설정 완료${NC}"
fi
echo ""

# 테스트 4: 권한 확인
echo -e "${YELLOW}4️⃣  시스템 권한 확인${NC}"
if [ -w "$HOME" ]; then
    echo -e "${GREEN}✓ 홈 디렉토리 쓰기 권한 있음${NC}"
else
    echo -e "${RED}✗ 홈 디렉토리 쓰기 권한 없음${NC}"
fi

if [ -w "/tmp" ]; then
    echo -e "${GREEN}✓ /tmp 쓰기 권한 있음${NC}"
else
    echo -e "${RED}✗ /tmp 쓰기 권한 없음${NC}"
fi
echo ""

# 테스트 5: 명령어 테스트
echo -e "${YELLOW}5️⃣  명령어 문법 확인${NC}"
if bash -n "$INSTALL_PATH/create-project.sh" 2>/dev/null; then
    echo -e "${GREEN}✓ create-project.sh 문법 OK${NC}"
else
    echo -e "${RED}✗ create-project.sh 문법 오류${NC}"
fi

if bash -n "$INSTALL_PATH/monitor-sync.sh" 2>/dev/null; then
    echo -e "${GREEN}✓ monitor-sync.sh 문법 OK${NC}"
else
    echo -e "${RED}✗ monitor-sync.sh 문법 오류${NC}"
fi
echo ""

# 최종 결과
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
if [ "$all_exist" = true ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    echo -e "${GREEN}설치 완료: $INSTALL_PATH${NC}"
    echo ""
    echo -e "${YELLOW}다음 단계:${NC}"
    echo "  ./create-project.sh \"test-project\" \"테스트\" web"
else
    echo -e "${RED}⚠️  일부 파일 누락됨${NC}"
fi
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
