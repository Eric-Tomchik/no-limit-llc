import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new submission from the public form
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    salesExperience: v.string(),
    message: v.optional(v.string()),
    agentReferral: v.optional(v.string()),
    source: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("submissions", {
      ...args,
      status: "new",
      submittedAt: Date.now(),
    });
    return id;
  },
});

// List all submissions (most recent first)
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("submissions").order("desc").collect();
  },
});

// Get stats (counts by status)
export const stats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("submissions").collect();
    return {
      total: all.length,
      new: all.filter((s) => s.status === "new").length,
      contacted: all.filter((s) => s.status === "contacted").length,
      hired: all.filter((s) => s.status === "hired").length,
      rejected: all.filter((s) => s.status === "rejected").length,
    };
  },
});

// Growth metrics — week-over-week comparisons
export const growthMetrics = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("submissions").collect();
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const twoWeeks = 14 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    // This week vs last week
    const thisWeek = all.filter((s) => now - s.submittedAt < oneWeek);
    const lastWeek = all.filter(
      (s) => now - s.submittedAt >= oneWeek && now - s.submittedAt < twoWeeks
    );

    // Hire rate
    const hired = all.filter((s) => s.status === "hired");
    const hireRate = all.length > 0 ? (hired.length / all.length) * 100 : 0;

    // Average days to hire (for those with hiredAt)
    const hiredWithTime = all.filter((s) => s.status === "hired" && s.hiredAt);
    let avgDaysToHire = 0;
    if (hiredWithTime.length > 0) {
      const totalDays = hiredWithTime.reduce((sum, s) => {
        return sum + (s.hiredAt! - s.submittedAt) / (24 * 60 * 60 * 1000);
      }, 0);
      avgDaysToHire = Math.round((totalDays / hiredWithTime.length) * 10) / 10;
    }

    // Average days to contact
    const contactedWithTime = all.filter(
      (s) => s.contactedAt && s.contactedAt > 0
    );
    let avgDaysToContact = 0;
    if (contactedWithTime.length > 0) {
      const totalDays = contactedWithTime.reduce((sum, s) => {
        return sum + (s.contactedAt! - s.submittedAt) / (24 * 60 * 60 * 1000);
      }, 0);
      avgDaysToContact =
        Math.round((totalDays / contactedWithTime.length) * 10) / 10;
    }

    // Daily submission counts (last 30 days) for sparkline
    const dailyCounts: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
      const dayEnd = now - i * 24 * 60 * 60 * 1000;
      dailyCounts.push(
        all.filter((s) => s.submittedAt >= dayStart && s.submittedAt < dayEnd)
          .length
      );
    }

    // Weekly hire counts (last 8 weeks) for trend
    const weeklyHires: number[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = now - (i + 1) * oneWeek;
      const weekEnd = now - i * oneWeek;
      weeklyHires.push(
        all.filter(
          (s) =>
            s.status === "hired" &&
            s.hiredAt &&
            s.hiredAt >= weekStart &&
            s.hiredAt < weekEnd
        ).length
      );
    }

    // Conversion funnel
    const contacted = all.filter(
      (s) =>
        s.status === "contacted" ||
        s.status === "hired" ||
        s.status === "rejected"
    );
    const funnel = {
      applied: all.length,
      contacted: contacted.length,
      hired: hired.length,
    };

    // Pipeline velocity — submissions stuck in each status > 3 days
    const stale = {
      newStale: all.filter(
        (s) => s.status === "new" && now - s.submittedAt > 3 * 24 * 60 * 60 * 1000
      ).length,
      contactedStale: all.filter(
        (s) =>
          s.status === "contacted" &&
          s.contactedAt &&
          now - s.contactedAt > 5 * 24 * 60 * 60 * 1000
      ).length,
    };

    return {
      thisWeekApps: thisWeek.length,
      lastWeekApps: lastWeek.length,
      weekOverWeekChange:
        lastWeek.length > 0
          ? Math.round(
              ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100
            )
          : thisWeek.length > 0
            ? 100
            : 0,
      hireRate: Math.round(hireRate * 10) / 10,
      avgDaysToHire,
      avgDaysToContact,
      dailyCounts,
      weeklyHires,
      funnel,
      stale,
      totalAllTime: all.length,
      hiredAllTime: hired.length,
    };
  },
});

// Update submission status with timestamp tracking
export const updateStatus = mutation({
  args: {
    id: v.id("submissions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };
    const now = Date.now();

    if (args.status === "contacted") {
      updates.contactedAt = now;
    } else if (args.status === "hired") {
      updates.hiredAt = now;
    } else if (args.status === "rejected") {
      updates.rejectedAt = now;
    }

    await ctx.db.patch(args.id, updates);

    // Return the updated submission for email triggering
    return await ctx.db.get(args.id);
  },
});

// Update submission notes
export const updateNotes = mutation({
  args: {
    id: v.id("submissions"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { notes: args.notes });
  },
});

// Update submission assignment
export const updateAssignment = mutation({
  args: {
    id: v.id("submissions"),
    assignedTo: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { assignedTo: args.assignedTo });
  },
});

// Delete a submission
export const remove = mutation({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get a single submission by ID
export const get = query({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
