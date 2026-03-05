#!/bin/bash

################################################################################
# Claude Automation - KPM 설치 스크립트
# 이 스크립트는 kpm install claude-automation으로 자동 실행됩니다
################################################################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 경로 설정
KPM_MODULES_PATH="${KPM_MODULES_PATH:-/home/kimjin/kim_modules}"
INSTALL_PATH="$KPM_MODULES_PATH/claude-automation"
GOGS_TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"

################################################################################
# 함수들
################################################################################

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_requirements() {
    log_info "필수 요구사항 확인 중..."

    local missing_reqs=()

    # git 확인
    if ! command -v git &> /dev/null; then
        missing_reqs+=("git")
    fi

    # bash 확인
    if [ -z "$BASH_VERSION" ]; then
        missing_reqs+=("bash")
    fi

    # curl 확인
    if ! command -v curl &> /dev/null; then
        missing_reqs+=("curl")
    fi

    if [ ${#missing_reqs[@]} -gt 0 ]; then
        log_error "다음 요구사항이 누락되었습니다: ${missing_reqs[*]}"
        exit 1
    fi

    log_success "모든 요구사항 확인 완료"
}

setup_install_path() {
    log_info "설치 경로 준비 중: $INSTALL_PATH"

    if [ ! -d "$INSTALL_PATH" ]; then
        mkdir -p "$INSTALL_PATH"
        log_success "설치 디렉토리 생성: $INSTALL_PATH"
    else
        log_warn "설치 디렉토리가 이미 존재합니다"
    fi
}

copy_files() {
    log_info "파일 복사 중..."

    local current_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # 주요 파일 복사
    cp "$current_dir/create-project.sh" "$INSTALL_PATH/" 2>/dev/null && \
        log_success "create-project.sh 복사"

    cp "$current_dir/monitor-sync.sh" "$INSTALL_PATH/" 2>/dev/null && \
        log_success "monitor-sync.sh 복사"

    cp "$current_dir/README.md" "$INSTALL_PATH/" 2>/dev/null && \
        log_success "README.md 복사"

    cp "$current_dir/package.json" "$INSTALL_PATH/" 2>/dev/null && \
        log_success "package.json 복사"

    # 문서 디렉토리 복사
    if [ -d "$current_dir/docs" ]; then
        cp -r "$current_dir/docs" "$INSTALL_PATH/" && \
            log_success "docs/ 디렉토리 복사"
    fi

    # .gitignore 복사
    if [ -f "$current_dir/.gitignore" ]; then
        cp "$current_dir/.gitignore" "$INSTALL_PATH/"
    fi
}

setup_symlinks() {
    log_info "명령어 심링크 설정 중..."

    local bin_path="/usr/local/bin"

    # create-project 심링크
    if [ -w "$bin_path" ]; then
        ln -sf "$INSTALL_PATH/create-project.sh" "$bin_path/claude-create" 2>/dev/null && \
            log_success "claude-create 명령어 등록"
    else
        log_warn "시스템 bin 경로 쓰기 권한 없음 (선택사항)"
    fi

    # monitor-sync 심링크
    if [ -w "$bin_path" ]; then
        ln -sf "$INSTALL_PATH/monitor-sync.sh" "$bin_path/claude-monitor" 2>/dev/null && \
            log_success "claude-monitor 명령어 등록"
    fi
}

setup_git_credentials() {
    log_info "Git 인증 설정 중..."

    # .git-credentials 확인 및 업데이트
    local credentials_file="$HOME/.git-credentials"

    if [ ! -f "$credentials_file" ]; then
        mkdir -p "$(dirname "$credentials_file")"
        cat > "$credentials_file" << 'EOF'
https://kim:241da0a03f3c50949c220b7b0174a70a07879a65@gogs.dclub.kr
EOF
        chmod 600 "$credentials_file"
        log_success "Git credentials 파일 생성"
    else
        if ! grep -q "gogs.dclub.kr" "$credentials_file"; then
            echo 'https://kim:241da0a03f3c50949c220b7b0174a70a07879a65@gogs.dclub.kr' >> "$credentials_file"
            log_success "Git credentials 업데이트"
        else
            log_success "Git credentials 이미 설정됨"
        fi
    fi

    # Git credential helper 설정
    git config --global credential.helper store 2>/dev/null && \
        log_success "Git credential helper 설정"
}

setup_project_base() {
    log_info "프로젝트 기본 경로 생성 중..."

    local project_base="/home/kimjin"

    if [ ! -d "$project_base" ]; then
        log_error "프로젝트 기본 경로 없음: $project_base"
        return 1
    fi

    log_success "프로젝트 기본 경로 준비: $project_base"
}

create_shell_alias() {
    log_info "Shell alias 설정 중..."

    local shell_rc="$HOME/.bashrc"

    # .bashrc가 없으면 .zshrc 시도
    if [ ! -f "$shell_rc" ]; then
        shell_rc="$HOME/.zshrc"
    fi

    # alias 추가 (중복 확인)
    if ! grep -q "claude-automation" "$shell_rc" 2>/dev/null; then
        cat >> "$shell_rc" << 'EOF'

# Claude Automation shortcuts
alias claude-create='$INSTALL_PATH/create-project.sh'
alias claude-monitor='$INSTALL_PATH/monitor-sync.sh'
alias cd-projects='cd /home/kimjin && ls -d */'
EOF
        log_success "Shell alias 등록"
        log_warn "변경사항을 적용하려면: source $shell_rc"
    else
        log_success "Shell alias 이미 등록됨"
    fi
}

verify_installation() {
    log_info "설치 검증 중..."

    local checks_passed=0
    local total_checks=4

    # 파일 확인
    if [ -f "$INSTALL_PATH/create-project.sh" ]; then
        log_success "create-project.sh 확인"
        ((checks_passed++))
    else
        log_error "create-project.sh 없음"
    fi

    if [ -f "$INSTALL_PATH/monitor-sync.sh" ]; then
        log_success "monitor-sync.sh 확인"
        ((checks_passed++))
    else
        log_error "monitor-sync.sh 없음"
    fi

    if [ -f "$INSTALL_PATH/README.md" ]; then
        log_success "README.md 확인"
        ((checks_passed++))
    else
        log_error "README.md 없음"
    fi

    if [ -f "$HOME/.git-credentials" ]; then
        log_success "Git credentials 확인"
        ((checks_passed++))
    else
        log_error "Git credentials 없음"
    fi

    echo ""
    if [ $checks_passed -eq $total_checks ]; then
        log_success "모든 검증 통과 ($checks_passed/$total_checks)"
        return 0
    else
        log_warn "일부 검증 실패 ($checks_passed/$total_checks)"
        return 1
    fi
}

show_usage() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Claude Automation 설치 완료!${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}📍 설치 경로:${NC}"
    echo "  $INSTALL_PATH"
    echo ""
    echo -e "${YELLOW}🚀 빠른 시작:${NC}"
    echo ""
    echo "  # 프로젝트 생성"
    echo "  cd $INSTALL_PATH"
    echo "  ./create-project.sh \"프로젝트명\" \"설명\" web"
    echo ""
    echo "  # 또는 (alias 사용)"
    echo "  source ~/.bashrc"
    echo "  claude-create \"프로젝트명\" \"설명\" web"
    echo ""
    echo -e "${YELLOW}📚 문서:${NC}"
    echo "  - README.md (개요)"
    echo "  - docs/QUICK-START.md (5분 시작)"
    echo "  - docs/USAGE.md (상세 가이드)"
    echo "  - docs/TROUBLESHOOTING.md (문제 해결)"
    echo ""
    echo -e "${YELLOW}🔗 Gogs:${NC}"
    echo "  https://gogs.dclub.kr/kim/claude-automation"
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""
}

################################################################################
# Main
################################################################################
main() {
    clear

    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Claude Automation - KPM 설치 중...${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""

    check_requirements
    echo ""

    setup_install_path
    echo ""

    copy_files
    echo ""

    setup_git_credentials
    echo ""

    setup_project_base
    echo ""

    # 심링크는 sudo 필요할 수 있으므로 선택사항
    setup_symlinks 2>/dev/null || true
    echo ""

    # Shell alias
    create_shell_alias 2>/dev/null || true
    echo ""

    verify_installation
    echo ""

    show_usage
}

main "$@"
