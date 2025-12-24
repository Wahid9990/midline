
import React, { useState, useMemo } from 'react';
import { Zap, AlertTriangle, Calendar, User, Package, Hash, Edit2, Check, X } from 'lucide-react';
import { Employee, Cut, Assignment } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import ConfirmDialog from './ui/ConfirmDialog';

interface AssignmentTabProps {
  employees: Employee[];
  cuts: Cut[];
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
}

const AssignmentTab: React.FC<AssignmentTabProps> = ({ employees, cuts, assignments, setAssignments }) => {
  const [selectedCutId, setSelectedCutId] = useState('');
  const [selectedOperationId, setSelectedOperationId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rangeStart, setRangeStart] = useState<number>(0);
  const [rangeEnd, setRangeEnd] = useState<number>(0);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

  const selectedCut = useMemo(() => cuts.find(c => c.id === selectedCutId), [cuts, selectedCutId]);
  const selectedOp = useMemo(() => selectedCut?.operations.find(o => o.id === selectedOperationId), [selectedCut, selectedOperationId]);

  // Filter employees who belong to the selected operation's department (case-insensitive)
  const filteredEmployees = useMemo(() => {
    if (!selectedOp) return [];
    return employees.filter(e => e.role.trim().toLowerCase() === selectedOp.name.trim().toLowerCase());
  }, [employees, selectedOp]);

  const availableBundles = useMemo(() => {
    if (!selectedCut || !selectedOperationId) return [];
    
    // For editing, we need to include the CURRENTLY assigned bundle even if it's "full"
    const opAssignments = assignments.filter(a => 
      a.cutId === selectedCut.id && 
      a.operationId === selectedOperationId &&
      a.id !== editingAssignmentId
    );
    
    const assignedPieces = new Set<number>();
    opAssignments.forEach(a => { for (let i = a.startPiece; i <= a.endPiece; i++) assignedPieces.add(i); });
    
    return selectedCut.bundles.filter(b => {
      let covered = 0;
      for (let i = b.start; i <= b.end; i++) { if (assignedPieces.has(i)) covered++; }
      return covered < (b.end - b.start + 1);
    });
  }, [selectedCut, selectedOperationId, assignments, editingAssignmentId]);

  const handleAssign = () => {
    if (!selectedCutId || !selectedOperationId || !selectedEmployeeId || !selectedBundleId) return;
    
    if (editingAssignmentId) {
      setAssignments(assignments.map(a => 
        a.id === editingAssignmentId 
          ? { 
              ...a, 
              cutId: selectedCutId, 
              operationId: selectedOperationId, 
              employeeId: selectedEmployeeId, 
              bundleId: selectedBundleId,
              startPiece: rangeStart,
              endPiece: rangeEnd,
              assignedAt: new Date(selectedDate).getTime()
            }
          : a
      ));
      setEditingAssignmentId(null);
    } else {
      const newAssignment: Assignment = {
        id: crypto.randomUUID(),
        cutId: selectedCutId,
        operationId: selectedOperationId,
        employeeId: selectedEmployeeId,
        bundleId: selectedBundleId,
        startPiece: rangeStart,
        endPiece: rangeEnd,
        assignedAt: new Date(selectedDate).getTime()
      };
      setAssignments([newAssignment, ...assignments]);
    }
    
    // Reset only the bundle and piece range. 
    // KEEP Employee, Cut, and Dept selected as requested for faster entry.
    setSelectedBundleId('');
    setRangeStart(0);
    setRangeEnd(0);
  };

  const startEdit = (a: Assignment) => {
    setEditingAssignmentId(a.id);
    setSelectedCutId(a.cutId);
    setSelectedOperationId(a.operationId);
    setSelectedEmployeeId(a.employeeId);
    setSelectedBundleId(a.bundleId);
    setRangeStart(a.startPiece);
    setRangeEnd(a.endPiece);
    setSelectedDate(new Date(a.assignedAt).toISOString().split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingAssignmentId(null);
    setSelectedCutId('');
    setSelectedOperationId('');
    setSelectedEmployeeId('');
    setSelectedBundleId('');
    setRangeStart(0);
    setRangeEnd(0);
  };

  // Improved visibility classes for inputs
  const inputBaseClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 font-medium";

  return (
    <div className="space-y-6">
      <div className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-all ${editingAssignmentId ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-200'}`}>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
          <Zap className="text-indigo-600" /> {editingAssignmentId ? 'Edit Assignment' : 'Assign Work'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Calendar size={12} /> 1. Date
            </label>
            <input 
              type="date" 
              className={inputBaseClass} 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">2. Cut</label>
            <select 
              className={inputBaseClass} 
              value={selectedCutId} 
              onChange={e => { setSelectedCutId(e.target.value); setSelectedOperationId(''); setSelectedEmployeeId(''); setSelectedBundleId(''); }}
            >
              <option value="">-- Select Cut --</option>
              {cuts.map(c => <option key={c.id} value={c.id}>{c.cutNumber} {c.cutName ? `(${c.cutName})` : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">3. Department</label>
            <select 
              className={inputBaseClass} 
              value={selectedOperationId} 
              onChange={e => { setSelectedOperationId(e.target.value); setSelectedEmployeeId(''); setSelectedBundleId(''); }} 
              disabled={!selectedCutId}
            >
              <option value="">-- Select Dept --</option>
              {selectedCut?.operations.map(op => <option key={op.id} value={op.id}>{op.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <User size={12} /> 4. Worker
            </label>
            <select 
              className={inputBaseClass} 
              value={selectedEmployeeId} 
              onChange={e => setSelectedEmployeeId(e.target.value)} 
              disabled={!selectedOperationId}
            >
              <option value="">-- Select Worker --</option>
              {filteredEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            {selectedOperationId && filteredEmployees.length === 0 && (
              <p className="text-[10px] text-red-500 mt-1 font-bold">No employees in {selectedOp?.name}!</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
              <Package size={12} /> 5. Bundle
            </label>
            <select 
              className={inputBaseClass} 
              value={selectedBundleId} 
              onChange={e => { 
                setSelectedBundleId(e.target.value); 
                const b = selectedCut?.bundles.find(xb => xb.id === e.target.value);
                if(b) { setRangeStart(b.start); setRangeEnd(b.end); }
              }} 
              disabled={!selectedEmployeeId}
            >
              <option value="">-- Select Bundle --</option>
              {availableBundles.map(b => <option key={b.id} value={b.id}>B#{b.bundleNumber} ({b.start}-{b.end})</option>)}
            </select>
          </div>
        </div>

        {selectedBundleId && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-top-2">
             <div className="flex gap-4">
               <div className="flex-1">
                  <label className="block text-xs font-bold text-indigo-700 mb-1">Start Piece</label>
                  <input type="number" value={rangeStart} onChange={e => setRangeStart(parseInt(e.target.value) || 0)} className={inputBaseClass} />
               </div>
               <div className="flex-1">
                  <label className="block text-xs font-bold text-indigo-700 mb-1">End Piece</label>
                  <input type="number" value={rangeEnd} onChange={e => setRangeEnd(parseInt(e.target.value) || 0)} className={inputBaseClass} />
               </div>
             </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {editingAssignmentId && (
            <Button variant="secondary" onClick={cancelEdit} className="px-8 py-3 text-lg">
              Cancel
            </Button>
          )}
          <Button onClick={handleAssign} disabled={!selectedBundleId} className="px-8 py-3 text-lg">
            {editingAssignmentId ? <><Check size={20} className="inline mr-1" /> Update Record</> : 'Confirm Assignment'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Daily Records</h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold uppercase">{assignments.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 font-bold text-gray-600 uppercase tracking-tighter">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Employee Name</th>
                <th className="px-4 py-3 text-left">Cut & Operation</th>
                <th className="px-4 py-3 text-center">Bundle #</th>
                <th className="px-4 py-3 text-center">Pieces</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {assignments.map(a => {
                const emp = employees.find(e => e.id === a.employeeId);
                const cut = cuts.find(c => c.id === a.cutId);
                const op = cut?.operations.find(o => o.id === a.operationId);
                const b = cut?.bundles.find(xb => xb.id === a.bundleId);
                
                const dateStr = a.assignedAt ? new Date(a.assignedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'Invalid Date';

                const isEditing = editingAssignmentId === a.id;

                return (
                  <tr key={a.id} className={`transition-colors ${isEditing ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">{dateStr}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-900 text-base">{emp?.name || 'Unknown Employee'}</div>
                      <div className="text-[10px] text-indigo-500 font-black uppercase">{emp?.role || 'Deleted Role'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-gray-800">Cut: {cut?.cutNumber || 'Deleted'}</div>
                      <div className="text-xs text-indigo-600 font-bold uppercase">{op?.name || 'Deleted Op'}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                       <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono font-bold border">
                         #{b?.bundleNumber || '??'}
                       </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                       <div className="font-black text-gray-900 text-lg">{a.endPiece - a.startPiece + 1}</div>
                       <div className="text-[10px] text-gray-400 font-bold">({a.startPiece}-{a.endPiece})</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => startEdit(a)} 
                          className="text-indigo-500 hover:text-indigo-700 font-bold flex items-center gap-1"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => setAssignmentToDelete(a.id)} 
                          className="text-red-500 hover:text-red-700 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 italic">
                    No assignments found for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ConfirmDialog 
        isOpen={!!assignmentToDelete} 
        title="Delete Record" 
        message="Are you sure you want to remove this assignment record? This action cannot be undone." 
        onConfirm={() => {setAssignments(assignments.filter(x => x.id !== assignmentToDelete)); setAssignmentToDelete(null);}} 
        onCancel={() => setAssignmentToDelete(null)} 
      />
    </div>
  );
};

export default AssignmentTab;
