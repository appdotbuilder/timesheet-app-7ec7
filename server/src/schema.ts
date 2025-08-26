import { z } from 'zod';

// Timesheet entry schema
export const timesheetEntrySchema = z.object({
  id: z.number(),
  user_name: z.string(),
  project_name: z.string(),
  task_description: z.string(),
  hours_worked: z.number().positive(),
  entry_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TimesheetEntry = z.infer<typeof timesheetEntrySchema>;

// Input schema for creating timesheet entries
export const createTimesheetEntryInputSchema = z.object({
  user_name: z.string().min(1, "User name is required"),
  project_name: z.string().min(1, "Project name is required"),
  task_description: z.string().min(1, "Task description is required"),
  hours_worked: z.number().positive("Hours worked must be positive"),
  entry_date: z.coerce.date()
});

export type CreateTimesheetEntryInput = z.infer<typeof createTimesheetEntryInputSchema>;

// Input schema for updating timesheet entries
export const updateTimesheetEntryInputSchema = z.object({
  id: z.number(),
  user_name: z.string().min(1).optional(),
  project_name: z.string().min(1).optional(),
  task_description: z.string().min(1).optional(),
  hours_worked: z.number().positive().optional(),
  entry_date: z.coerce.date().optional()
});

export type UpdateTimesheetEntryInput = z.infer<typeof updateTimesheetEntryInputSchema>;

// Schema for filtering timesheet entries
export const timesheetFilterSchema = z.object({
  user_name: z.string().optional(),
  project_name: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type TimesheetFilter = z.infer<typeof timesheetFilterSchema>;

// Dashboard summary schema
export const dashboardSummarySchema = z.object({
  total_hours: z.number(),
  total_entries: z.number(),
  hours_by_project: z.array(z.object({
    project_name: z.string(),
    total_hours: z.number()
  })),
  hours_by_user: z.array(z.object({
    user_name: z.string(),
    total_hours: z.number()
  })),
  recent_entries: z.array(timesheetEntrySchema)
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// Report generation input schema
export const generateReportInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  user_name: z.string().optional(),
  project_name: z.string().optional()
});

export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;

// Report schema
export const reportSchema = z.object({
  period: z.object({
    start_date: z.coerce.date(),
    end_date: z.coerce.date()
  }),
  summary: z.object({
    total_hours: z.number(),
    total_entries: z.number(),
    average_hours_per_day: z.number()
  }),
  breakdown_by_project: z.array(z.object({
    project_name: z.string(),
    total_hours: z.number(),
    entry_count: z.number()
  })),
  breakdown_by_user: z.array(z.object({
    user_name: z.string(),
    total_hours: z.number(),
    entry_count: z.number()
  })),
  entries: z.array(timesheetEntrySchema)
});

export type Report = z.infer<typeof reportSchema>;