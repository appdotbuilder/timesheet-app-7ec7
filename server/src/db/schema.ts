import { serial, text, pgTable, timestamp, numeric, date } from 'drizzle-orm/pg-core';

export const timesheetEntriesTable = pgTable('timesheet_entries', {
  id: serial('id').primaryKey(),
  user_name: text('user_name').notNull(),
  project_name: text('project_name').notNull(),
  task_description: text('task_description').notNull(),
  hours_worked: numeric('hours_worked', { precision: 5, scale: 2 }).notNull(), // Use numeric for precise hour tracking
  entry_date: date('entry_date').notNull(), // Date when the work was performed
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type TimesheetEntry = typeof timesheetEntriesTable.$inferSelect; // For SELECT operations
export type NewTimesheetEntry = typeof timesheetEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  timesheetEntries: timesheetEntriesTable 
};