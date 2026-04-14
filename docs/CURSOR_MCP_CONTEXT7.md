# Cursor: Context7 MCP 및 전역 MCP 설정

## 목적

- 외부 라이브러리·프레임워크 작업 시 **최신 공식 문서**를 Context7 MCP로 확인한 뒤 구현한다.
- 등록된 MCP(GitHub, Puppeteer, Playwright, Context7 등)를 작업 유형에 맞게 사용한다.

## 전역 MCP 설정 파일

| 항목 | 경로 (Windows) |
|------|----------------|
| 사용자 MCP | `%USERPROFILE%\.cursor\mcp.json` |

변경 후 **Cursor 재시작**이 필요할 수 있다.

### 현재 구성 요약

- **context7**: 원격 엔드포인트 `https://mcp.context7.com/mcp` (API 키는 헤더로 설정)
- **github**: `npx @modelcontextprotocol/server-github` + `GITHUB_TOKEN`
- **puppeteer**: `npx @modelcontextprotocol/server-puppeteer`
- **playwright**: `npx -y @playwright/mcp@latest`

비밀 값(GitHub PAT, Context7 API 키)은 **저장소에 커밋하지 말 것**. 사용자 프로필의 `mcp.json`에만 둔다. 키가 유출 의심되면 각 서비스에서 **재발급**한다.

## 전역 에이전트 규칙 (모든 프로젝트)

Cursor는 **User rules**를 UI에 저장하는 방식이 가장 확실하게 전 프로젝트에 적용된다.

1. **Cursor** → **Settings** → **Cursor Settings** → **Rules** (또는 `Ctrl+Shift+P` → Cursor Settings).
2. 아래 파일 내용을 복사해 **User rules**에 붙여넣는다.  
   - `C:\Users\lovab\.cursor\GLOBAL_USER_RULE_SNIPPET.txt`

추가로, 일부 Cursor 버전에서는 `C:\Users\lovab\.cursor\rules\global-context7-mcp.mdc`가 전역으로 로드될 수 있다. 적용 여부는 에이전트 동작으로 확인한다.

## 이 저장소의 프로젝트 규칙

- `.cursor/rules/context7-mcp-workflow.mdc` (`alwaysApply: true`)  
  버전 관리되며, 이 프로젝트에서 에이전트에게 동일한 원칙을 강제한다.

## Context7 사용 팁

- 프롬프트에 `use context7`과 라이브러리명·목적을 명시하면 검색 품질이 좋아진다.
- 라이브러리 ID를 알면 `owner/repo` 형식으로 범위를 좁힌다.
- 초기 설정·키 발급은 공식 안내에 따른다: [Context7 — Cursor](https://context7.com/docs/clients/cursor)

## 확장 MCP

Figma·GitLens 등 Cursor 확장이 제공하는 MCP는 확장 활성화 시 목록에 나타난다. UI/브라우저/저장소 작업 성격에 맞게 선택한다.
