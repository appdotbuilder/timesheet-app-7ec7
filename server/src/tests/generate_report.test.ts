import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetEntriesTable } from '../db/schema';
import { type GenerateReportInput } from '../schema';
import { generateReport } from '../handlers/generate_report';

// Test data setup
const createTestEntry = async (entryData: {
  user_name: string;
  project_name: string;
  task_description: string;
  hours_worked: number;
  entry_date: string; // YYYY-MM-DD format
}) => {
  const result = await db.insert(timesheetEntriesTable)
    .values({
      ...entryData,
      hours_worked: entryData.hours_worked.toString() // Convert to string for numeric column
    })
    .returning()
    .execute();
  
  return {
    ...result[0],
    hours_worked: parseFloat(result[0].hours_worked) // Convert back to number
  };
};

describe('generateReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate report with no entries', async () => {
    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await generateReport(input);

    expect(result.period.start_date).toEqual(new Date('2024-01-01'));
    expect(result.period.end_date).toEqual(new Date('2024-01-31'));
    expect(result.summary.total_hours).toEqual(0);
    expect(result.summary.total_entries).toEqual(0);
    expect(result.summary.average_hours_per_day).toEqual(0);
    expect(result.breakdown_by_project).toHaveLength(0);
    expect(result.breakdown_by_user).toHaveLength(0);
    expect(result.entries).toHaveLength(0);
  });

  it('should generate report with single entry', async () => {
    // Create test entry
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 8.5,
      entry_date: '2024-01-15'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(8.5);
    expect(result.summary.total_entries).toEqual(1);
    expect(result.summary.average_hours_per_day).toEqual(0.27); // 8.5 hours over 31 days
    
    expect(result.breakdown_by_project).toHaveLength(1);
    expect(result.breakdown_by_project[0].project_name).toEqual('Project A');
    expect(result.breakdown_by_project[0].total_hours).toEqual(8.5);
    expect(result.breakdown_by_project[0].entry_count).toEqual(1);
    
    expect(result.breakdown_by_user).toHaveLength(1);
    expect(result.breakdown_by_user[0].user_name).toEqual('John Doe');
    expect(result.breakdown_by_user[0].total_hours).toEqual(8.5);
    expect(result.breakdown_by_user[0].entry_count).toEqual(1);
    
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].user_name).toEqual('John Doe');
    expect(result.entries[0].hours_worked).toEqual(8.5);
  });

  it('should generate report with multiple entries and aggregate correctly', async () => {
    // Create multiple test entries
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 8.0,
      entry_date: '2024-01-15'
    });

    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project B',
      task_description: 'Testing work',
      hours_worked: 4.5,
      entry_date: '2024-01-16'
    });

    await createTestEntry({
      user_name: 'Jane Smith',
      project_name: 'Project A',
      task_description: 'Design work',
      hours_worked: 6.0,
      entry_date: '2024-01-17'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(18.5);
    expect(result.summary.total_entries).toEqual(3);
    expect(result.summary.average_hours_per_day).toEqual(0.6); // 18.5 hours over 31 days

    // Project breakdown (sorted by total hours descending)
    expect(result.breakdown_by_project).toHaveLength(2);
    expect(result.breakdown_by_project[0].project_name).toEqual('Project A');
    expect(result.breakdown_by_project[0].total_hours).toEqual(14.0); // 8.0 + 6.0
    expect(result.breakdown_by_project[0].entry_count).toEqual(2);
    expect(result.breakdown_by_project[1].project_name).toEqual('Project B');
    expect(result.breakdown_by_project[1].total_hours).toEqual(4.5);
    expect(result.breakdown_by_project[1].entry_count).toEqual(1);

    // User breakdown (sorted by total hours descending)
    expect(result.breakdown_by_user).toHaveLength(2);
    expect(result.breakdown_by_user[0].user_name).toEqual('John Doe');
    expect(result.breakdown_by_user[0].total_hours).toEqual(12.5); // 8.0 + 4.5
    expect(result.breakdown_by_user[0].entry_count).toEqual(2);
    expect(result.breakdown_by_user[1].user_name).toEqual('Jane Smith');
    expect(result.breakdown_by_user[1].total_hours).toEqual(6.0);
    expect(result.breakdown_by_user[1].entry_count).toEqual(1);

    expect(result.entries).toHaveLength(3);
  });

  it('should filter by date range correctly', async () => {
    // Create entries on different dates
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 8.0,
      entry_date: '2024-01-10' // Before range
    });

    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 7.0,
      entry_date: '2024-01-15' // In range
    });

    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 6.0,
      entry_date: '2024-01-25' // After range
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-14'),
      end_date: new Date('2024-01-20')
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(7.0);
    expect(result.summary.total_entries).toEqual(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].entry_date).toEqual(new Date('2024-01-15T00:00:00.000Z'));
  });

  it('should filter by user_name when provided', async () => {
    // Create entries for different users
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 8.0,
      entry_date: '2024-01-15'
    });

    await createTestEntry({
      user_name: 'Jane Smith',
      project_name: 'Project A',
      task_description: 'Testing work',
      hours_worked: 6.0,
      entry_date: '2024-01-16'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      user_name: 'John Doe'
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(8.0);
    expect(result.summary.total_entries).toEqual(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].user_name).toEqual('John Doe');
    
    expect(result.breakdown_by_user).toHaveLength(1);
    expect(result.breakdown_by_user[0].user_name).toEqual('John Doe');
  });

  it('should filter by project_name when provided', async () => {
    // Create entries for different projects
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 8.0,
      entry_date: '2024-01-15'
    });

    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project B',
      task_description: 'Testing work',
      hours_worked: 6.0,
      entry_date: '2024-01-16'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      project_name: 'Project A'
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(8.0);
    expect(result.summary.total_entries).toEqual(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].project_name).toEqual('Project A');
    
    expect(result.breakdown_by_project).toHaveLength(1);
    expect(result.breakdown_by_project[0].project_name).toEqual('Project A');
  });

  it('should filter by both user_name and project_name when provided', async () => {
    // Create entries with different combinations
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 8.0,
      entry_date: '2024-01-15'
    });

    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project B',
      task_description: 'Testing work',
      hours_worked: 6.0,
      entry_date: '2024-01-16'
    });

    await createTestEntry({
      user_name: 'Jane Smith',
      project_name: 'Project A',
      task_description: 'Design work',
      hours_worked: 5.0,
      entry_date: '2024-01-17'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      user_name: 'John Doe',
      project_name: 'Project A'
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(8.0);
    expect(result.summary.total_entries).toEqual(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].user_name).toEqual('John Doe');
    expect(result.entries[0].project_name).toEqual('Project A');
  });

  it('should handle single day period correctly', async () => {
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 8.0,
      entry_date: '2024-01-15'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-15'),
      end_date: new Date('2024-01-15')
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(8.0);
    expect(result.summary.total_entries).toEqual(1);
    expect(result.summary.average_hours_per_day).toEqual(8.0); // 8 hours over 1 day
  });

  it('should round summary values to 2 decimal places', async () => {
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 7.333, // Will create fractional averages
      entry_date: '2024-01-15'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31') // 31 days
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(7.33); // Rounded to 2 decimal places
    expect(result.summary.average_hours_per_day).toEqual(0.24); // 7.333/31 = 0.2365... rounded to 0.24
  });

  it('should handle entries with decimal hours correctly', async () => {
    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Development work',
      hours_worked: 2.25,
      entry_date: '2024-01-15'
    });

    await createTestEntry({
      user_name: 'John Doe',
      project_name: 'Project A',
      task_description: 'Testing work',
      hours_worked: 1.75,
      entry_date: '2024-01-16'
    });

    const input: GenerateReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await generateReport(input);

    expect(result.summary.total_hours).toEqual(4.0);
    expect(result.entries[0].hours_worked).toEqual(2.25);
    expect(result.entries[1].hours_worked).toEqual(1.75);
    expect(result.breakdown_by_project[0].total_hours).toEqual(4.0);
  });
});