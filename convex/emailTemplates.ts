import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all email templates
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("emailTemplates").collect();
  },
});

// Get template by trigger
export const getByTrigger = query({
  args: { trigger: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailTemplates")
      .withIndex("by_trigger", (q) => q.eq("trigger", args.trigger))
      .first();
  },
});

// Create or update a template (upsert by trigger)
export const upsert = mutation({
  args: {
    trigger: v.string(),
    subject: v.string(),
    body: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_trigger", (q) => q.eq("trigger", args.trigger))
      .first();

    const data = { ...args, lastModified: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("emailTemplates", data);
    }
  },
});

// Toggle template enabled/disabled
export const toggleEnabled = mutation({
  args: {
    id: v.id("emailTemplates"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      enabled: args.enabled,
      lastModified: Date.now(),
    });
  },
});

// Delete a template
export const remove = mutation({
  args: { id: v.id("emailTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Seed default templates
export const seedDefaults = mutation({
  handler: async (ctx) => {
    const defaults = [
      {
        trigger: "new",
        subject: "Application Received — No Limit LLC",
        body: `<p>Hi {{firstName}},</p>
<p>Thank you for applying to No Limit LLC! We've received your application and our team is reviewing it now.</p>
<p>We'll be in touch within the next 24–48 hours to discuss the next steps.</p>
<p>In the meantime, feel free to check out our website at <a href="https://www.no-limit-llc.com">no-limit-llc.com</a> to learn more about our team and culture.</p>
<p>Best regards,<br>The No Limit LLC Team</p>`,
        enabled: true,
      },
      {
        trigger: "contacted",
        subject: "Next Steps — No Limit LLC",
        body: `<p>Hi {{firstName}},</p>
<p>Thanks for your interest in joining No Limit LLC! We've reviewed your application and would love to learn more about you.</p>
<p>Please schedule a quick 15-minute interview at your convenience:</p>
<p><a href="https://cal.com/angel-molina-hdwyb9/15min" style="display:inline-block;padding:10px 24px;background:#00d4aa;color:#000;text-decoration:none;border-radius:6px;font-weight:bold;">Schedule Interview</a></p>
<p>Looking forward to connecting!</p>
<p>Best,<br>The No Limit LLC Team</p>`,
        enabled: true,
      },
      {
        trigger: "hired",
        subject: "Welcome to No Limit LLC! 🎉",
        body: `<p>Hi {{firstName}},</p>
<p>Congratulations — we're thrilled to welcome you to the No Limit LLC team!</p>
<p>Your drive and experience stood out, and we're excited to have you on board. Here's what happens next:</p>
<ul>
<li>You'll receive onboarding materials within the next 24 hours</li>
<li>Your team lead will reach out to schedule your first training session</li>
<li>We'll get you set up with all the tools you need to hit the ground running</li>
</ul>
<p>Welcome aboard — let's make it happen!</p>
<p>Best,<br>The No Limit LLC Team</p>`,
        enabled: true,
      },
      {
        trigger: "rejected",
        subject: "Update on Your Application — No Limit LLC",
        body: `<p>Hi {{firstName}},</p>
<p>Thank you for taking the time to apply to No Limit LLC. We appreciate your interest in joining our team.</p>
<p>After careful consideration, we've decided to move forward with other candidates at this time. This doesn't reflect on your abilities — we simply had a very competitive applicant pool.</p>
<p>We encourage you to apply again in the future as new opportunities arise. We'll keep your information on file.</p>
<p>Wishing you all the best,<br>The No Limit LLC Team</p>`,
        enabled: true,
      },
      {
        trigger: "no_show",
        subject: "Missed Interview — Let's Reschedule",
        body: `<p>Hi {{firstName}},</p>
<p>It looks like we missed you at your scheduled interview today. No worries — things come up!</p>
<p>If you're still interested in joining No Limit LLC, please reschedule at a time that works better:</p>
<p><a href="https://cal.com/angel-molina-hdwyb9/15min" style="display:inline-block;padding:10px 24px;background:#00d4aa;color:#000;text-decoration:none;border-radius:6px;font-weight:bold;">Reschedule Interview</a></p>
<p>We'd love to connect with you!</p>
<p>Best,<br>The No Limit LLC Team</p>`,
        enabled: true,
      },
    ];

    for (const tmpl of defaults) {
      const existing = await ctx.db
        .query("emailTemplates")
        .withIndex("by_trigger", (q) => q.eq("trigger", tmpl.trigger))
        .first();
      if (!existing) {
        await ctx.db.insert("emailTemplates", {
          ...tmpl,
          lastModified: Date.now(),
        });
      }
    }

    return { seeded: true };
  },
});
