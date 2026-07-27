import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Log an email
export const create = mutation({
  args: {
    submissionId: v.optional(v.string()),
    interviewId: v.optional(v.string()),
    trigger: v.string(),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailLog", {
      ...args,
      sentAt: Date.now(),
    });
  },
});

// List email log (most recent first)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("emailLog")
      .order("desc")
      .take(100);
  },
});

// List emails for a specific submission
export const bySubmission = query({
  args: { submissionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailLog")
      .withIndex("by_submissionId", (q) =>
        q.eq("submissionId", args.submissionId)
      )
      .order("desc")
      .collect();
  },
});

// Update email status
export const updateStatus = mutation({
  args: {
    id: v.id("emailLog"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// Get pending emails (for cron processing)
export const pending = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("emailLog")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .collect();
  },
});
