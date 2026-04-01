import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { recordAuditLog } from "@/lib/auditLogger";
import { RowDataPacket } from "mysql2";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Upstash Rate Limiter (5 attempts per 15 minutes)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Rate Limiting by IP Address
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(`login_ratelimit_${ip}`);
    
    if (!success) {
      await recordAuditLog({
        action: 'FAILED_LOGIN',
        resource: 'User',
        resourceId: 0,
        userName: 'Unknown',
        details: `Rate limit exceeded for IP ${ip} targeting email ${email}.`
      });
      return NextResponse.json(
        { error: "Too many login requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }

    const query = `
      SELECT u.UserID, u.FirstName, u.LastName, u.Email, u.Password, u.RoleID, r.RoleName 
      FROM M_Users u 
      LEFT JOIN M_Roles r ON u.RoleID = r.RoleID 
      WHERE u.Email = ? AND u.IsDeleted = FALSE
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [email]);
    const user = rows[0];

    if (!user) {
      await recordAuditLog({
        action: 'FAILED_LOGIN',
        resource: 'User',
        resourceId: 0,
        userName: 'Unknown',
        details: `Failed login attempt. No user found with email ${email}. IP: ${ip}`
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.Password);
    
    if (!isValidPassword) {
      await recordAuditLog({
        action: 'FAILED_LOGIN',
        resource: 'User',
        resourceId: user.UserID,
        userId: user.UserID,
        userName: `${user.FirstName} ${user.LastName}`,
        details: `Failed login attempt. Invalid password for ${email}. IP: ${ip}`
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession({
      userId: user.UserID,
      email: user.Email,
      roleId: user.RoleID,
      roleName: user.RoleName,
      firstName: user.FirstName,
      lastName: user.LastName,
    });

    // Record Audit Log
    await recordAuditLog({
      action: 'LOGIN',
      resource: 'User',
      resourceId: user.UserID,
      userId: user.UserID,
      userName: `${user.FirstName} ${user.LastName}`,
      details: `User ${user.FirstName} ${user.LastName} (${user.Email}) logged in successfully.`
    });

    return NextResponse.json({ success: true, redirect: "/dashboard" }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
