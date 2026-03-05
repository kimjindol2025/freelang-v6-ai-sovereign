#!/bin/bash

################################################################################
# Claude Code → Gogs 자동 동기화 파이프라인
# 사용: ./create-project.sh "프로젝트명" "설명" [프로젝트_타입]
################################################################################

set -e

# 컬러 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
TOKEN="241da0a03f3c50949c220b7b0174a70a07879a65"
GOGS_API="https://gogs.dclub.kr/api/v1"
GOGS_USER="kim"
BASE_PATH="/home/kimjin"
PROJECT_TYPES=("web" "api" "cli" "library" "service" "daemon")

################################################################################
# Step 1: 입력 검증
################################################################################
validate_input() {
    if [ $# -lt 2 ]; then
        echo -e "${RED}❌ 사용법: $0 \"프로젝트명\" \"설명\" [타입]${NC}"
        echo ""
        echo "예제:"
        echo "  $0 \"my-api\" \"REST API 서버\" api"
        echo "  $0 \"claude-tools\" \"Claude Code 도구\" library"
        echo ""
        echo "지원 타입: ${PROJECT_TYPES[@]}"
        exit 1
    fi

    PROJECT_NAME="$1"
    PROJECT_DESC="$2"
    PROJECT_TYPE="${3:-service}"

    # 프로젝트명 유효성 검증 (영문, 숫자, - 만 허용)
    if ! [[ "$PROJECT_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo -e "${RED}❌ 프로젝트명은 영문, 숫자, -, _ 만 사용 가능합니다${NC}"
        exit 1
    fi

    # 타입 검증
    if [[ ! " ${PROJECT_TYPES[@]} " =~ " ${PROJECT_TYPE} " ]]; then
        echo -e "${RED}❌ 지원하지 않는 타입: $PROJECT_TYPE${NC}"
        echo "지원 타입: ${PROJECT_TYPES[@]}"
        exit 1
    fi
}

################################################################################
# Step 2: 프로젝트 폴더 생성
################################################################################
create_project_folder() {
    echo -e "${BLUE}📁 Step 1: 프로젝트 폴더 생성${NC}"

    PROJECT_PATH="$BASE_PATH/$PROJECT_NAME"

    if [ -d "$PROJECT_PATH" ]; then
        echo -e "${YELLOW}⚠️  폴더가 이미 존재합니다: $PROJECT_PATH${NC}"
        read -p "기존 폴더를 사용하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        mkdir -p "$PROJECT_PATH"
        echo -e "${GREEN}✓ 폴더 생성: $PROJECT_PATH${NC}"
    fi
}

################################################################################
# Step 3: Git 저장소 초기화
################################################################################
init_git_repo() {
    echo -e "${BLUE}🔧 Step 2: Git 저장소 초기화${NC}"

    cd "$PROJECT_PATH"

    if [ ! -d ".git" ]; then
        git init
        git config user.name "kim"
        git config user.email "kim@dclub.kr"
        echo -e "${GREEN}✓ Git 저장소 초기화 완료${NC}"
    else
        echo -e "${YELLOW}⚠️  이미 Git 저장소입니다${NC}"
    fi

    # 프로젝트 정보 파일 생성
    cat > .project-info << EOF
# 프로젝트 정보
프로젝트명: $PROJECT_NAME
설명: $PROJECT_DESC
타입: $PROJECT_TYPE
생성일: $(date '+%Y-%m-%d %H:%M:%S')
동기화: Gogs (자동)
EOF

    # README 생성
    if [ ! -f "README.md" ]; then
        cat > README.md << EOF
# $PROJECT_NAME

**설명**: $PROJECT_DESC

**타입**: $PROJECT_TYPE

**생성**: $(date '+%Y-%m-%d')

## 🚀 시작하기

\`\`\`bash
# 저장소 클론
git clone https://gogs.dclub.kr/kim/$PROJECT_NAME.git
cd $PROJECT_NAME
\`\`\`

## 📋 구조

\`\`\`
$PROJECT_NAME/
├── README.md
├── .project-info
├── .gitignore
└── src/
\`\`\`

## 🔄 자동 동기화

이 저장소는 Claude Code에서 자동으로 Gogs와 동기화됩니다.

- **Gogs URL**: https://gogs.dclub.kr/kim/$PROJECT_NAME
- **로컬 경로**: $PROJECT_PATH
- **브랜치**: master

## 📝 노트

자동 커밋/푸시는 다음 명령으로 트리거됩니다:

\`\`\`bash
# 수동 푸시
cd $PROJECT_PATH
git add .
git commit -m "메시지"
git push origin master
\`\`\`
EOF
        git add README.md .project-info
        git commit -m "docs: 프로젝트 초기화 - $PROJECT_NAME"
        echo -e "${GREEN}✓ README.md 및 프로젝트 정보 파일 생성${NC}"
    fi
}

################################################################################
# Step 4: Gogs 저장소 생성
################################################################################
create_gogs_repo() {
    echo -e "${BLUE}📦 Step 3: Gogs 저장소 생성${NC}"

    RESPONSE=$(curl -s -X POST "$GOGS_API/user/repos" \
        -H "Authorization: token $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$PROJECT_NAME\",
            \"description\": \"$PROJECT_DESC\",
            \"private\": false
        }")

    REPO_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
    REPO_URL=$(echo "$RESPONSE" | jq -r '.html_url // empty')
    ERROR=$(echo "$RESPONSE" | jq -r '.message // empty')

    if [ -z "$REPO_ID" ]; then
        if [ -n "$ERROR" ] && [[ "$ERROR" != "null" ]]; then
            echo -e "${YELLOW}⚠️  Gogs 저장소 생성: $ERROR${NC}"
            if [[ "$ERROR" == *"already exists"* ]]; then
                REPO_URL="https://gogs.dclub.kr/kim/$PROJECT_NAME"
                echo -e "${YELLOW}기존 저장소 사용: $REPO_URL${NC}"
            fi
        else
            echo -e "${RED}❌ Gogs 저장소 생성 실패${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Gogs 저장소 생성: $REPO_URL${NC}"
    fi
}

################################################################################
# Step 5: Remote 설정 및 푸시
################################################################################
sync_with_gogs() {
    echo -e "${BLUE}🔄 Step 4: Gogs와 동기화${NC}"

    cd "$PROJECT_PATH"

    # Remote 설정
    if git remote | grep -q "^origin$"; then
        git remote remove origin
    fi

    GOGS_REPO_URL="https://kim:${TOKEN}@gogs.dclub.kr/kim/$PROJECT_NAME.git"
    git remote add origin "$GOGS_REPO_URL"
    echo -e "${GREEN}✓ Remote 설정: origin${NC}"

    # 초기 푸시
    if [ "$(git rev-list --count HEAD)" -gt 0 ]; then
        git push -u origin master
        echo -e "${GREEN}✓ Gogs로 푸시 완료${NC}"
    fi
}

################################################################################
# Step 6: 자동 동기화 설정
################################################################################
setup_auto_sync() {
    echo -e "${BLUE}⚙️  Step 5: 자동 동기화 설정${NC}"

    cd "$PROJECT_PATH"

    # Git hook 설정 (post-commit)
    mkdir -p .git/hooks

    cat > .git/hooks/post-commit << 'HOOK_EOF'
#!/bin/bash
# 자동 푸시 hook
git push origin master 2>/dev/null || true
HOOK_EOF

    chmod +x .git/hooks/post-commit
    echo -e "${GREEN}✓ Post-commit hook 설정 (자동 푸시)${NC}"
}

################################################################################
# Step 7: 최종 보고
################################################################################
print_summary() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ 프로젝트 생성 완료!${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}📋 프로젝트 정보:${NC}"
    echo "  이름: $PROJECT_NAME"
    echo "  설명: $PROJECT_DESC"
    echo "  타입: $PROJECT_TYPE"
    echo ""
    echo -e "${YELLOW}📂 로컬 경로:${NC}"
    echo "  $PROJECT_PATH"
    echo ""
    echo -e "${YELLOW}🌐 Gogs URL:${NC}"
    echo "  $REPO_URL"
    echo ""
    echo -e "${YELLOW}🔗 Git Clone:${NC}"
    echo "  git clone $REPO_URL"
    echo ""
    echo -e "${YELLOW}📝 다음 단계:${NC}"
    echo "  1. cd $PROJECT_PATH"
    echo "  2. 파일 생성/수정"
    echo "  3. git add . && git commit -m \"메시지\""
    echo "  4. git push (자동 실행됨)"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
}

################################################################################
# Main
################################################################################
main() {
    validate_input "$@"
    create_project_folder
    init_git_repo
    create_gogs_repo
    sync_with_gogs
    setup_auto_sync
    print_summary
}

main "$@"
