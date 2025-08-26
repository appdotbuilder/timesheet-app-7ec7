import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type DashboardSummary } from '../schema';
import { sql, desc } from 'drizzle-orm';

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    // Get total hours and entries count
    const totalStats = await db.select({
      total_hours: sql<string>`COALESCE(SUM(${timesheetEntriesTable.hours_worked}), 0)`,
      total_entries: sql<string>`COUNT(*)`
    })
    .from(timesheetEntriesTable)
    .execute();

    // Get hours breakdown by project
    const projectHours = await db.select({
      project_name: timesheetEntriesTable.project_name,
      total_hours: sql<string>`SUM(${timesheetEntriesTable.hours_worked})`
    })
    .from(timesheetEntriesTable)
    .groupBy(timesheetEntriesTable.project_name)
    .orderBy(desc(sql`SUM(${timesheetEntriesTable.hours_worked})`))
    .execute();

    // Get hours breakdown by user
    const userHours = await db.select({
      user_name: timesheetEntriesTable.user_name,
      total_hours: sql<string>`SUM(${timesheetEntriesTable.hours_worked})`
    })
    .from(timesheetEntriesTable)
    .groupBy(timesheetEntriesTable.user_name)
    .orderBy(desc(sql`SUM(${timesheetEntriesTable.hours_worked})`))
    .execute();

    // Get recent entries (last 10 entries by created_at)
    const recentEntries = await db.select()
      .from(timesheetEntriesTable)
      .orderBy(desc(timesheetEntriesTable.created_at))
      .limit(10)
      .execute();

    // Convert numeric fields and prepare response
    const totalHours = parseFloat(totalStats[0].total_hours);
    const totalEntriesCount = parseInt(totalStats[0].total_entries);

    return {
      total_hours: totalHours,
      total_entries: totalEntriesCount,
      hours_by_project: projectHours.map(project => ({
        project_name: project.project_name,
        total_hours: parseFloat(project.total_hours)
      })),
      hours_by_user: userHours.map(user => ({
        user_name: user.user_name,
        total_hours: parseFloat(user.total_hours)
      })),
      recent_entries: recentEntries.map(entry => ({
        ...entry,
        hours_worked: parseFloat(entry.hours_worked), // Convert numeric field
        entry_date: new Date(entry.entry_date) // Convert date string to Date object
      }))
    };
  } catch (error) {
    console.error('Dashboard summary generation failed:', error);
    throw error;
  }
};