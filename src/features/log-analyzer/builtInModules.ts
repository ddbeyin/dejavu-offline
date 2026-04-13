import { ModuleDefinition, ModuleResult } from '../../shared/types';

export const BUILT_IN_MODULES: ModuleDefinition[] = [
  {
    id: 'core-column-stats',
    name: 'Column Stats',
    version: '1.0.0',
    description: 'Calculates sum, average, min, and max for a selected numeric column.',
    category: 'Built-in',
    parameters: [
      {
        name: 'targetCol',
        label: 'Target Column',
        type: 'columnSelect',
        required: true,
        description: 'The column containing numeric data to analyze.'
      }
    ],
    run: async (ctx, params): Promise<ModuleResult> => {
      const col = params.targetCol;
      if (!col) throw new Error("Target column is required");

      const values: number[] = [];
      let skipped = 0;
      let empty = 0;

      ctx.dataset.rows.forEach(row => {
        const val = row[col];
        if (val === undefined || val === null || val.trim() === '') {
          empty++;
          return;
        }
        const num = parseFloat(val);
        if (isNaN(num)) {
          skipped++;
        } else {
          values.push(num);
        }
      });

      if (values.length === 0) {
        return {
          sections: [
            {
              type: 'text',
              title: 'No Data',
              data: 'No valid numeric values found in this column.'
            }
          ]
        };
      }

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      return {
        sections: [
          {
            type: 'summary',
            title: 'Statistics',
            data: {
              'Total Rows Scanned': ctx.dataset.rows.length,
              'Valid Numeric Rows': values.length,
              'Empty Rows': empty,
              'Non-Numeric (Skipped)': skipped,
              'Sum': sum.toFixed(2),
              'Average': avg.toFixed(2),
              'Min': min,
              'Max': max
            }
          }
        ],
        logs: [`Analyzed ${values.length} numbers.`]
      };
    }
  },
  {
    id: 'core-empty-rows',
    name: 'Empty Row Detector',
    version: '1.0.0',
    description: 'Finds rows that have missing values in a specific critical column.',
    category: 'Built-in',
    parameters: [
      {
        name: 'criticalCol',
        label: 'Critical Column',
        type: 'columnSelect',
        required: true,
        description: 'This column must have a value.'
      }
    ],
    run: async (ctx, params): Promise<ModuleResult> => {
      const col = params.criticalCol;
      const badRows: any[] = [];

      ctx.dataset.rows.forEach((row, idx) => {
        if (!row[col] || row[col].trim() === '') {
          badRows.push({
            'Row Index': idx + 1,
            'Issue': 'Missing Value',
            'Full Row Data': JSON.stringify(row)
          });
        }
      });

      if (badRows.length === 0) {
        return {
          sections: [
            { type: 'text', title: 'Result', data: 'All rows have a value in this column. Good job!' }
          ]
        };
      }

      return {
        sections: [
          {
            type: 'summary',
            title: 'Overview',
            data: {
              'Total Rows': ctx.dataset.rows.length,
              'Bad Rows Found': badRows.length
            }
          },
          {
            type: 'table',
            title: 'Rows with Missing Data',
            data: badRows
          }
        ]
      };
    }
  }
];