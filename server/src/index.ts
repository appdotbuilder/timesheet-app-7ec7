import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createTimesheetEntryInputSchema,
  updateTimesheetEntryInputSchema,
  timesheetFilterSchema,
  generateReportInputSchema
} from './schema';

// Import handlers
import { createTimesheetEntry } from './handlers/create_timesheet_entry';
import { getTimesheetEntries } from './handlers/get_timesheet_entries';
import { updateTimesheetEntry } from './handlers/update_timesheet_entry';
import { deleteTimesheetEntry } from './handlers/delete_timesheet_entry';
import { getDashboardSummary } from './handlers/get_dashboard_summary';
import { generateReport } from './handlers/generate_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new timesheet entry
  createTimesheetEntry: publicProcedure
    .input(createTimesheetEntryInputSchema)
    .mutation(({ input }) => createTimesheetEntry(input)),

  // Get timesheet entries with optional filtering
  getTimesheetEntries: publicProcedure
    .input(timesheetFilterSchema.optional())
    .query(({ input }) => getTimesheetEntries(input)),

  // Update an existing timesheet entry
  updateTimesheetEntry: publicProcedure
    .input(updateTimesheetEntryInputSchema)
    .mutation(({ input }) => updateTimesheetEntry(input)),

  // Delete a timesheet entry by ID
  deleteTimesheetEntry: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteTimesheetEntry(input)),

  // Get dashboard summary with key metrics
  getDashboardSummary: publicProcedure
    .query(() => getDashboardSummary()),

  // Generate timesheet report for a date range
  generateReport: publicProcedure
    .input(generateReportInputSchema)
    .query(({ input }) => generateReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();