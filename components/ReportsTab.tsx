
import React, { useState, useMemo } from 'react';
import { LayoutGrid, ArrowLeft, Info, Package, Layers } from 'lucide-react';
import { Employee, Assignment, Cut } from '../types';

interface ReportsTabProps {
  employees: Employee[];
  assignments: Assignment[];
  cuts: Cut[];
  categories: string[];
}

export default function ReportsTab({ employees, assignments, cuts, categories }: ReportsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null);
  const [viewingDate, setViewingDate] = useState<string | null>(null);

  /**
   * Main Production Matrix Logic
   * Groups by Cut Name + Operation Name + Price
   */
  const { columns, rows, grandTotalPay, grandTotalPieces } = useMemo(() => {
    // Map to group columns by CutName + OpName + Price
    const colMap = new Map<string, { cutName: string; opName: string; price: number }>();
    const empMap = new Map<string, { employee: Employee; opCounts: Record<string, number>; totalPieces: number; totalPay: number }>();

    assignments.forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId);
      const cut = cuts.find(c => c.id === a.cutId);
      const op = cut?.operations.find(o => o.id === a.operationId);
      
      if (!emp || !cut || !op) return;

      if (selectedCategory !== 'all' && emp.role !== selectedCategory) return;

      // Group key: Name, Department, and Price
      const groupKey = `${cut.cutName || 'Unknown'}|${op.name}|${op.price}`;
      
      if (!colMap.has(groupKey)) {
        colMap.set(groupKey, { 
          cutName: cut.cutName || 'N/A', 
          opName: op.name, 
          price: op.price 
        });
      }

      if (!empMap.has(emp.id)) {
        empMap.set(emp.id, { employee: emp, opCounts: {}, totalPieces: 0, totalPay: 0 });
      }

      const pieces = a.endPiece - a.startPiece + 1;
      const pay = pieces * op.price;
      const empData = empMap.get(emp.id)!;

      empData.opCounts[groupKey] = (empData.opCounts[groupKey] || 0) + pieces;
      empData.totalPieces += pieces;
      empData.totalPay += pay;
    });

    const sortedColumns = Array.from(colMap.entries()).map(([key, val]) => ({ key, ...val }));
    const sortedRows = Array.from(empMap.values()).sort((a, b) => a.employee.name.localeCompare(b.employee.name));

    return { 
      columns: sortedColumns, 
      rows: sortedRows, 
      grandTotalPieces: sortedRows.reduce((a, r) => a + r.totalPieces, 0),
      grandTotalPay: sortedRows.reduce((a, r) => a + r.totalPay, 0)
    };
  }, [employees, assignments, cuts, selectedCategory]);

  /**
   * Individual Employee History Detail
   * Also grouped by Cut Name + Price
   */
  const employeeDetail = useMemo(() => {
    if (!viewingEmployeeId) return null;
    const emp = employees.find(e => e.id === viewingEmployeeId);
    if (!emp) return null;

    const dailyMap = new Map<string, { date: string; items: Record<string, { pieces: number; rate: number; cutName: string; opName: string }>; dailyTotal: number; dailyPay: number }>();
    const uniqueColsMap = new Map<string, { cutName: string; rate: number; opName: string }>();

    assignments.filter(a => a.employeeId === viewingEmployeeId).forEach(a => {
      const cut = cuts.find(c => c.id === a.cutId);
      const op = cut?.operations.find(o => o.id === a.operationId);
      if (!cut || !op) return;

      const dateKey = new Date(a.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const groupKey = `${cut.cutName || 'Unknown'}|${op.name}|${op.price}`;
      
      if (!uniqueColsMap.has(groupKey)) {
        uniqueColsMap.set(groupKey, { 
          cutName: cut.cutName || 'N/A', 
          rate: op.price,
          opName: op.name
        });
      }

      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { date: dateKey, items: {}, dailyTotal: 0, dailyPay: 0 });
      
      const dayData = dailyMap.get(dateKey)!;
      const pieces = a.endPiece - a.startPiece + 1;
      const rate = op.price;
      
      if (!dayData.items[groupKey]) {
        dayData.items[groupKey] = {
          pieces: 0,
          rate: rate,
          cutName: cut.cutName || 'N/A',
          opName: op.name
        };
      }
      
      dayData.items[groupKey].pieces += pieces;
      dayData.dailyTotal += pieces;
      dayData.dailyPay += pieces * rate;
    });

    return { 
      employee: emp, 
      dates: Array.from(dailyMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
      cols: Array.from(uniqueColsMap.entries()).map(([key, info]) => ({ key, ...info })),
      totalPieces: Array.from(dailyMap.values()).reduce((a, d) => a + d.dailyTotal, 0),
      totalPay: Array.from(dailyMap.values()).reduce((a, d) => a + d.dailyPay, 0)
    };
  }, [viewingEmployeeId, assignments, cuts, employees]);

  // Hierarchical Breakdown for a specific day and employee (Keeps Cut Numbers for verification)
  const groupedBreakdown = useMemo(() => {
    if (!viewingEmployeeId || !viewingDate) return null;
    
    const rawItems = assignments.filter(a => {
      const d = new Date(a.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      return a.employeeId === viewingEmployeeId && d === viewingDate;
    }).map(a => {
      const cut = cuts.find(c => c.id === a.cutId);
      const op = cut?.operations.find(o => o.id === a.operationId);
      const bundle = cut?.bundles.find(b => b.id === a.bundleId);
      const pcs = a.endPiece - a.startPiece + 1;
      return { 
        cutNumber: cut?.cutNumber || 'Unknown', 
        cutName: cut?.cutName || 'Unnamed Product',
        op: op?.name, 
        bundle: bundle?.bundleNumber, 
        range: `${a.startPiece} - ${a.endPiece}`, 
        pcs, 
        rate: op?.price || 0, 
        total: pcs * (op?.price || 0) 
      };
    });

    const hierarchy: Record<string, Record<string, any[]>> = {};
    rawItems.forEach(item => {
      if (!hierarchy[item.cutName]) hierarchy[item.cutName] = {};
      if (!hierarchy[item.cutName][item.cutNumber]) hierarchy[item.cutName][item.cutNumber] = [];
      hierarchy[item.cutName][item.cutNumber].push(item);
    });

    return { 
      date: viewingDate, 
      products: hierarchy, 
      totalP: rawItems.reduce((a, i) => a + i.pcs, 0), 
      totalM: rawItems.reduce((a, i) => a + i.total, 0) 
    };
  }, [viewingEmployeeId, viewingDate, assignments, cuts]);

  // 1. Render Daily Breakdown (Hierarchical)
  if (viewingDate && groupedBreakdown) {
    return (
      <div className="space-y-6 animate-in zoom-in-95">
        <button onClick={() => setViewingDate(null)} className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-md transition-colors"><ArrowLeft /> Back to History</button>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2 text-gray-900">Work Breakdown</h2>
              <p className="text-indigo-600 font-bold text-sm">Date: {groupedBreakdown.date}</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded flex flex-col items-center">
                  <span className="text-[10px] uppercase font-black text-indigo-400">Total Pieces</span>
                  <span className="text-xl font-black text-indigo-900">{groupedBreakdown.totalP}</span>
               </div>
               <div className="bg-green-50 border border-green-100 px-4 py-2 rounded flex flex-col items-center">
                  <span className="text-[10px] uppercase font-black text-green-400">Total Amount</span>
                  <span className="text-xl font-black text-green-800">Rs. {groupedBreakdown.totalM.toFixed(2)}</span>
               </div>
            </div>
          </div>
        </div>

        {Object.entries(groupedBreakdown.products).map(([productName, cutNumbers]) => (
          <div key={productName} className="bg-white rounded-xl shadow-md border-t-4 border-indigo-600 overflow-hidden">
            <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Package size={20} />
                <h3 className="text-lg font-black uppercase tracking-widest">{productName}</h3>
              </div>
              <div className="text-[10px] text-indigo-100 font-bold uppercase bg-indigo-500/30 px-3 py-1 rounded-full border border-indigo-400/50">
                Product Group
              </div>
            </div>

            <div className="p-4 space-y-8">
              {Object.entries(cutNumbers).map(([cutNumber, bundles]) => {
                const cutPieces = bundles.reduce((a, b) => a + b.pcs, 0);
                const cutTotal = bundles.reduce((a, b) => a + b.total, 0);

                return (
                  <div key={cutNumber} className="border rounded-lg overflow-hidden border-gray-100 shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-indigo-600" />
                        <span className="text-sm font-black text-gray-900">CUT #{cutNumber}</span>
                      </div>
                      <div className="flex gap-4 text-[11px] font-bold">
                        <span className="text-gray-500">Pcs: <span className="text-gray-900">{cutPieces}</span></span>
                        <span className="text-gray-500">Amount: <span className="text-green-700">Rs {cutTotal.toFixed(2)}</span></span>
                      </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-white text-[10px] font-black uppercase text-gray-400 tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-center">Bundle Number</th>
                          <th className="px-4 py-3 text-center">Piece Range</th>
                          <th className="px-4 py-3 text-center">Rate</th>
                          <th className="px-4 py-3 text-center">Total Pcs</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bundles.map((b, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-center">
                              <span className="bg-gray-900 text-white px-3 py-0.5 rounded-full font-mono text-xs font-bold">
                                #{b.bundle}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-600 text-xs">
                              {b.range}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-500 text-xs">
                              Rs {b.rate.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center font-black text-gray-900">
                              {b.pcs}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-green-700">
                              Rs {b.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Render Employee Personal History
  if (viewingEmployeeId && employeeDetail) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right">
        <button onClick={() => setViewingEmployeeId(null)} className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-3 py-1 rounded-md transition-colors"><ArrowLeft /> Back to Matrix</button>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{employeeDetail.employee.name}</h2>
            <div className="text-xs font-black text-indigo-600 uppercase tracking-widest">{employeeDetail.employee.role} Department</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-gray-500 uppercase">Total Earnings</div>
            <div className="text-2xl font-black text-green-700">Rs. {employeeDetail.totalPay.toFixed(2)}</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-gray-100 font-bold text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-4 text-left sticky left-0 bg-gray-100 border-r z-10 min-w-[120px]">Work Date</th>
                {employeeDetail.cols.map(c => (
                  <th key={c.key} className="px-4 py-4 text-center min-w-[180px] border-r">
                    <div className="text-indigo-900 font-black leading-tight text-[11px] mb-0.5">{c.opName}</div>
                    <div className="text-gray-900 font-black truncate max-w-[160px] block mx-auto text-[14px] uppercase tracking-tighter">{c.cutName}</div>
                    <div className="text-[10px] text-green-700 font-black mt-1.5 bg-green-50 px-2 py-0.5 rounded-full inline-block border border-green-100">Rs {c.rate.toFixed(2)} / pc</div>
                  </th>
                ))}
                <th className="px-4 py-4 text-right bg-indigo-50 sticky right-0 z-10">Daily Pieces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employeeDetail.dates.map(d => (
                <tr key={d.date} className="hover:bg-gray-50 transition-colors bg-white">
                  <td 
                    onClick={() => setViewingDate(d.date)} 
                    className="px-4 py-4 font-black text-indigo-700 underline decoration-indigo-300 decoration-2 underline-offset-4 cursor-pointer sticky left-0 bg-white border-r"
                  >
                    {d.date}
                  </td>
                  {employeeDetail.cols.map(c => (
                    <td key={c.key} className="px-4 py-4 text-center border-r align-middle">
                      {d.items[c.key] ? (
                        <div className="flex flex-col">
                           <span className="font-black text-gray-900 text-base">{d.items[c.key].pieces} <span className="text-[10px] font-normal text-gray-400">pcs</span></span>
                           <span className="text-[10px] text-gray-500 font-bold">Rs {(d.items[c.key].pieces * d.items[c.key].rate).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-200">-</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-right font-black text-gray-900 bg-indigo-50/50 sticky right-0">
                    {d.dailyTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Info size={14} /> Click on the Date to see bundle-wise range and breakdown.
        </div>
      </div>
    );
  }

  // 3. Render Main Matrix
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Filter by Department</label>
        <select 
          className="w-full md:w-80 p-3 border border-gray-300 rounded-md font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500" 
          value={selectedCategory} 
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Departments</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-indigo-700 text-white p-6 rounded-xl shadow-lg border-b-8 border-indigo-900">
            <div className="text-indigo-200 text-xs font-black uppercase mb-1 tracking-widest">Total Payable Amount</div>
            <div className="text-4xl font-black">Rs. {grandTotalPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-b-8 border-gray-300">
            <div className="text-gray-400 text-xs font-black uppercase mb-1 tracking-widest">Total Pieces Finished</div>
            <div className="text-4xl font-black text-gray-900">{grandTotalPieces.toLocaleString()}</div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
           <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest flex items-center gap-2">
             <LayoutGrid size={18} className="text-indigo-600" /> Production Matrix
           </h3>
           <span className="text-[10px] text-indigo-600 font-black uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Click name for detailed history</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 text-[10px] font-black uppercase text-gray-600 tracking-wider">
            <tr>
              <th className="px-5 py-5 text-left sticky left-0 bg-gray-100 border-r z-10 w-52 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Employee Name</th>
              {columns.map(c => (
                <th key={c.key} className="px-4 py-3 text-center min-w-[150px] border-r">
                   <div className="text-gray-900 font-black truncate max-w-[140px] block text-[13px] uppercase tracking-tighter" title={c.cutName}>{c.cutName}</div>
                   <div className="text-gray-400 text-[9px] font-bold mb-1 uppercase tracking-widest">{c.opName}</div>
                   <div className="text-[10px] bg-white text-green-700 rounded px-2 py-0.5 mt-1 inline-block border border-green-200 font-black shadow-sm">Rs {c.price.toFixed(2)}</div>
                </th>
              ))}
              <th className="px-5 py-5 text-right bg-green-50 border-l sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">Earnings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {rows.map(r => (
              <tr key={r.employee.id} className="hover:bg-indigo-50/30 transition-colors group">
                <td onClick={() => setViewingEmployeeId(r.employee.id)} className="px-5 py-5 sticky left-0 bg-white border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer group-hover:bg-indigo-50/50">
                  <div className="font-black text-indigo-700 underline decoration-indigo-200 decoration-2 underline-offset-4 text-base">{r.employee.name}</div>
                  <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1 bg-gray-100 px-2 py-0.5 rounded w-fit">{r.employee.role}</div>
                </td>
                {columns.map(c => (
                  <td key={c.key} className="px-4 py-4 text-center border-r font-black text-gray-900 text-lg">
                    {r.opCounts[c.key] || <span className="text-gray-200">-</span>}
                  </td>
                ))}
                <td className="px-5 py-5 text-right font-black text-green-800 bg-green-50 border-l sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-lg">
                  Rs {r.totalPay.toFixed(2)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-5 py-12 text-center text-gray-400 italic">
                  No records found for this department.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
