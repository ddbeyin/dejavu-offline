import React from 'react';
import { LogRow } from './types';

interface DataTableProps {
  headers: string[];
  rows: LogRow[];
  maxDisplay?: number;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, rows, maxDisplay, className = "" }) => {
  const displayRows = maxDisplay ? rows.slice(0, maxDisplay) : rows;
  const isTruncated = maxDisplay && rows.length > maxDisplay;

  return (
    <div className={`flex-1 overflow-auto border-inset bg-white ${className}`}>
      <table className="win98 w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-[#c0c0c0]">
          <tr>
            <th style={{ width: '40px' }}>#</th>
            {headers.map(h => (
              <th key={h} className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className="hover:bg-[#e0e0e0]">
              <td className="bg-gray-100 text-gray-500 text-[10px] text-center">{i + 1}</td>
              {headers.map(h => (
                <td key={h} className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={row[h]}>
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
          {isTruncated && (
            <tr>
              <td colSpan={headers.length + 1} className="text-center italic text-gray-400 p-2">
                ... showing first {maxDisplay} of {rows.length} rows ...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};