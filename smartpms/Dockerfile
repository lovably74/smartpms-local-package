# ─────────────────────────────────────────────
# SmartPMS Dockerfile
# Node.js 22 기반 멀티스테이지 빌드
# ─────────────────────────────────────────────

# 1단계: 빌드
FROM node:22-alpine AS builder

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 복사 및 프론트엔드 빌드
COPY . .
RUN pnpm build

# 2단계: 실행
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

# 프로덕션 의존성만 설치
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 빌드 결과물 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
