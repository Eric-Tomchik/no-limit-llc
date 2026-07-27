import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create or update an interview (upsert by bookingUid)
export const upsert = mutation({
  args: {
    bookingUid: v.string(),
    applicantEmail: v.string(),
    applicantName: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    zoomJoinUrl: v.optional(v.string()),
    zoomMeetingId: v.optional(v.string()),
    status: v.string(),
    submissionId: v.optional(v.string()),
    calEventTypeId: v.optional(v.number()),
    attendees: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("interviews")
      .withIndex("by_bookingUid", (q) => q.eq("bookingUid", args.bookingUid))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("interviews", args);
    }
  },
});

// List interviews (optionally filtered by date range)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("interviews")
      .withIndex("by_startTime")
      .order("desc")
      .collect();
  },
});

// Get upcoming interviews (from now forward)
export const upcoming = query({
  handler: async (ctx) => {
    const now = Date.now();
    const all = await ctx.db
      .query("interviews")
      .withIndex("by_startTime")
      .order("asc")
      .collect();
    return all.filter((i) => i.startTime >= now && i.status === "scheduled");
  },
});

// Get today's interviews
export const today = query({
  handler: async (ctx) => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const all = await ctx.db
      .query("interviews")
      .withIndex("by_startTime")
      .order("asc")
      .collect();

    return all.filter(
      (i) => i.startTime >= startOfDay && i.startTime < endOfDay
    );
  },
});

// Update interview status
export const updateStatus = mutation({
  args: {
    id: v.id("interviews"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };
    if (args.notes !== undefined) updates.notes = args.notes;
    await ctx.db.patch(args.id, updates);
  },
});

// Delete an interview
export const remove = mutation({
  args: { id: v.id("interviews") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Interview stats
export const stats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("interviews").collect();
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const thisWeek = all.filter((i) => now - i.startTime < oneWeek);
    const completed = all.filter((i) => i.status === "completed");
    const noShows = all.filter((i) => i.status === "no-show");
    const showRate =
      completed.length + noShows.length > 0
        ? Math.round(
            (completed.length / (completed.length + noShows.length)) * 100
          )
        : 100;

    return {
      total: all.length,
      scheduled: all.filter((i) => i.status === "scheduled").length,
      completed: completed.length,
      noShows: noShows.length,
      cancelled: all.filter((i) => i.status === "cancelled").length,
      thisWeek: thisWeek.length,
      showRate,
    };
  },
});

// Bulk upsert for sync operations
export const bulkUpsert = mutation({
  args: {
    interviews: v.array(
      v.object({
        bookingUid: v.string(),
        applicantEmail: v.string(),
        applicantName: v.string(),
        startTime: v.number(),
        endTime: v.number(),
        zoomJoinUrl: v.optional(v.string()),
        zoomMeetingId: v.optional(v.string()),
        status: v.string(),
        submissionId: v.optional(v.string()),
        calEventTypeId: v.optional(v.number()),
        attendees: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const interview of args.interviews) {
      const existing = await ctx.db
        .query("interviews")
        .withIndex("by_bookingUid", (q) =>
          q.eq("bookingUid", interview.bookingUid)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, interview);
        results.push({ id: existing._id, action: "updated" });
      } else {
        const id = await ctx.db.insert("interviews", interview);
        results.push({ id, action: "created" });
      }
    }
    return results;
  },
});
