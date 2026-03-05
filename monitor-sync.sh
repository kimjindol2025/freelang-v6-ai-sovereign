#!/bin/bash

################################################################################
# Claude → Gogs 동기화 모니터
# 모든 프로젝트의 동기화 상태를 실시간으로 모니터링합니다
################################################################################

BASE_PATH="/home/kimjin"
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"
GOGS_API="https://gogs.dclub.kr/api/v1"

# 컬러
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

################################################################################
# 함수: 프로젝트 상태 확인
################################################################################
check_project_status() {
    local project_dir="$1"
    local project_name=$(basename "$project_dir")

    if [ ! -d "$project_dir/.git" ]; then
        return
    fi

    cd "$project_dir"

    # 미커밋 파일 수
    local unstaged=$(git status -s | wc -l)

    # 푸시 대기 커밋 수
    local unpushed=$(git log --oneline origin/master..HEAD 2>/dev/null | wc -l)

    # 최근 커밋
    local last_commit=$(git log -1 --pretty=format:"%h - %s (%ar)" 2>/dev/null || echo "없음")

    # 원격 상태
    local remote_status=$(git status -uno 2>/dev/null | grep -E "ahead|behind" | head -1 || echo "동기화됨")

    echo ""
    echo -e "${CYAN}📦 $project_name${NC}"
    echo "├─ 경로: $project_dir"

    if [ "$unstaged" -gt 0 ]; then
        echo -e "├─ ${RED}변경사항: $unstaged개${NC}"
    else
        echo -e "├─ ${GREEN}변경사항: 없음${NC}"
    fi

    if [ "$unpushed" -gt 0 ]; then
        echo -e "├─ ${YELLOW}푸시 대기: $unpushed개${NC}"
    else
        echo -e "├─ ${GREEN}푸시 완료${NC}"
    fi

    echo "├─ 최근 커밋: $last_commit"
    echo "└─ 상태: $remote_status"
}

################################################################################
# 함수: 모든 프로젝트 동기화
################################################################################
sync_all_projects() {
    echo -e "${BLUE}🔄 모든 프로젝트 동기화 시작${NC}"
    echo ""

    local synced=0
    local failed=0

    for dir in "$BASE_PATH"/*/; do
        if [ ! -d "$dir/.git" ]; then
            continue
        fi

        project_name=$(basename "$dir")

        cd "$dir"

        # 변경사항이 있는지 확인
        if git status -s | grep -q .; then
            echo -n "$project_name 동기화 중..."

            # Commit 및 Push
            git add . 2>/dev/null || true
            if git commit -m "auto: Claude 자동 동기화 $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null; then
                if git push origin master 2>/dev/null; then
                    echo -e " ${GREEN}✓${NC}"
                    ((synced++))
                else
                    echo -e " ${RED}✗ (푸시 실패)${NC}"
                    ((failed++))
                fi
            else
                echo -e " ${YELLOW}⊘${NC} (커밋할 내용 없음)"
            fi
        fi
    done

    echo ""
    echo -e "${BLUE}동기화 완료: ${GREEN}$synced개 성공${NC}, ${RED}$failed개 실패${NC}"
}

################################################################################
# 함수: Gogs 저장소 목록 조회
################################################################################
list_gogs_repos() {
    echo -e "${BLUE}🌐 Gogs 저장소 목록${NC}"
    echo ""

    # 간단한 요청 (인증 제외)
    local repos=$(curl -s "$GOGS_API/user/repos?limit=50" 2>/dev/null | jq -r '.[] | "\(.name) - \(.description // "설명 없음")"' 2>/dev/null)

    if [ -z "$repos" ]; then
        echo -e "${YELLOW}⚠️  저장소를 조회할 수 없습니다 (인증 필요)${NC}"
        echo ""
        echo "웹에서 확인: https://gogs.dclub.kr/kim"
    else
        echo "$repos" | nl
    fi
}

################################################################################
# 함수: 상세 대시보드
################################################################################
show_dashboard() {
    clear

    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}Claude Code → Gogs 자동 동기화 모니터${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""

    # 1. 로컬 프로젝트 상태
    echo -e "${YELLOW}📊 로컬 프로젝트 상태${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"

    local total=0
    local with_changes=0

    for dir in "$BASE_PATH"/*/; do
        if [ ! -d "$dir/.git" ]; then
            continue
        fi

        ((total++))
        check_project_status "$dir"

        if [ -d "$dir/.git" ]; then
            changes=$(cd "$dir" && git status -s | wc -l)
            if [ "$changes" -gt 0 ]; then
                ((with_changes++))
            fi
        fi
    done

    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}📈 요약${NC}"
    echo "  전체 프로젝트: $total개"
    echo -e "  변경사항 있음: ${RED}$with_changes개${NC}"
    echo ""

    # 2. 빠른 명령어
    echo -e "${YELLOW}⚡ 빠른 명령어${NC}"
    echo "  1) 모든 프로젝트 동기화"
    echo "  2) Gogs 저장소 목록"
    echo "  3) 특정 프로젝트 상태 (프로젝트명 입력)"
    echo "  4) 자동 모니터링 시작 (5초 간격)"
    echo "  5) 종료"
    echo ""
}

################################################################################
# 함수: 자동 모니터링
################################################################################
auto_monitor() {
    echo -e "${GREEN}✓ 자동 모니터링 시작 (5초 간격, Ctrl+C로 종료)${NC}"
    echo ""

    while true; do
        show_dashboard

        read -p "선택: " -t 5 choice || choice="auto"

        case "$choice" in
            1)
                sync_all_projects
                ;;
            2)
                list_gogs_repos
                ;;
            3)
                read -p "프로젝트명 입력: " pname
                if [ -d "$BASE_PATH/$pname/.git" ]; then
                    check_project_status "$BASE_PATH/$pname"
                else
                    echo -e "${RED}❌ 프로젝트를 찾을 수 없습니다: $pname${NC}"
                fi
                read -p "엔터를 누르세요..."
                ;;
            4)
                # 이미 실행 중
                ;;
            5)
                echo -e "${GREEN}모니터링 종료${NC}"
                exit 0
                ;;
        esac
    done
}

################################################################################
# Main
################################################################################
main() {
    if [ "$1" = "auto" ]; then
        auto_monitor
    elif [ "$1" = "sync" ]; then
        sync_all_projects
    elif [ "$1" = "list" ]; then
        list_gogs_repos
    elif [ -n "$1" ]; then
        if [ -d "$BASE_PATH/$1/.git" ]; then
            check_project_status "$BASE_PATH/$1"
        else
            echo -e "${RED}❌ 프로젝트를 찾을 수 없습니다: $1${NC}"
        fi
    else
        show_dashboard
    fi
}

main "$@"
