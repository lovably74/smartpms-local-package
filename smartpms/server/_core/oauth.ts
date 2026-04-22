import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // --- 기존 Manus OAuth callback ---
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // --- 로컬 로그인: GET 요청으로 쿠키 설정 후 리다이렉트 ---
  app.get("/api/auth/local/login", async (req: Request, res: Response) => {
    if (ENV.appId !== "local" || !ENV.allowLocalLogin) {
      res.status(403).json({ error: "Local login is disabled" });
      return;
    }

    const openId = ENV.ownerOpenId || "local-owner-001";
    const name = ENV.ownerName || "local-admin";

    await db.upsertUser({
      openId,
      name,
      email: null,
      loginMethod: "local",
      role: "admin",
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(openId, {
      name,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  });

  // --- Google OAuth: 로그인 시작 ---
  app.get("/api/auth/google/login", (_req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "Google OAuth is not configured" });
      return;
    }
    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: ENV.googleCallbackUrl,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });
    res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // --- Google OAuth: 콜백 ---
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const error = getQueryParam(req, "error");

    if (error) {
      console.error("[Google OAuth] Error:", error);
      res.redirect(302, "/?login_error=google_denied");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // 1. code → access_token 교환
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: ENV.googleCallbackUrl,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[Google OAuth] Token exchange failed:", errText);
        res.redirect(302, "/?login_error=token_failed");
        return;
      }

      const tokenData = await tokenRes.json() as { access_token: string };

      // 2. access_token → 사용자 정보 조회
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userRes.ok) {
        console.error("[Google OAuth] User info failed");
        res.redirect(302, "/?login_error=userinfo_failed");
        return;
      }

      const googleUser = await userRes.json() as {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };

      console.log("[Google OAuth] User:", googleUser.email, googleUser.name);

      // 3. DB에서 기존 사용자 매칭 (openId 또는 email)
      const openId = googleUser.id;
      let existingUser = await db.getUserByOpenId(openId);

      if (!existingUser) {
        // email로 기존 사용자 검색
        const allUsers = await db.getAllUsers();
        existingUser = allUsers.find(u => u.email === googleUser.email) ?? undefined;
      }

      // 4. upsert: 기존 사용자면 업데이트, 없으면 신규 생성 (admin 역할 강제)
      const finalOpenId = existingUser?.openId ?? openId;
      await db.upsertUser({
        openId: finalOpenId,
        name: existingUser?.name ?? googleUser.name,
        email: googleUser.email,
        loginMethod: "google",
        role: "admin",
        lastSignedIn: new Date(),
      });

      // 5. 세션 토큰 발급
      const sessionToken = await sdk.createSessionToken(finalOpenId, {
        name: existingUser?.name ?? googleUser.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect(302, "/?login_error=google_failed");
    }
  });
}
