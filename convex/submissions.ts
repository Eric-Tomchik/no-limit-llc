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
    return await ctx.db
      .query("submissions")
      .order("desc")
      .collect();
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

// Update submission status
export const updateStatus = mutation({
  args: {
    id: v.id("submissions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
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
  args: {
    id: v.id("submissions"),
  },
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
