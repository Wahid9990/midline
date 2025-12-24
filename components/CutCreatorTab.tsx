import React, { useState, useEffect } from 'react';
import { Scissors, ListChecks, Trash2, Package, Target, Edit2, Check } from 'lucide-react';
import { Cut, Bundle, Operation } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import ConfirmDialog from './ui/ConfirmDialog';

interface CutCreatorTabProps {
  cuts: Cut[];
  setCuts: (cuts: Cut[]) => void;
  categories: string[];
}

const CutCreatorTab: React.FC<CutCreatorTabProps> = ({ cuts, setCuts, categories }) => {
  const [cutNumber, setCutNumber] = useState('');
  const [cutName, setCutName] = useState('');
  const [totalPieces, setTotalPieces] = useState<string>('');
  const [bundleSize, setBundleSize] = useState<string>('50');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [editingCutId, setEditingCutId] = useState<string | null>(null);
  const [cutToDelete, setCutToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!editingCutId) {
      const newRates: Record<string, number> = {};
      categories.forEach(cat => {
        newRates[cat] = rates[cat] || 0;
      });
      setRates(newRates);
    }
  }, [categories, editingCutId]);

  const updateRate = (cat: string, val: string) => {
    setRates({ ...rates, [cat]: parseFloat(val) || 0 });
  };

  const startEdit = (cut: Cut) => {
    setEditingCutId(cut.id);
    setCutNumber(cut.cutNumber);
    setCutName(cut.cutName || '');
    setTotalPieces(cut.totalPieces.toString());
    
    const newRates: Record<string, number> = {};
    cut.operations.forEach(op => {
      newRates[op.name] = op.price;
    });
    setRates(newRates);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingCutId(null);
    setCutNumber('');
    setCutName('');
    setTotalPieces('');
    setRates({});
  };

  const handleSave = () => {
    const total = parseInt(totalPieces, 10);
    const bSize = parseInt(bundleSize, 10);
    
    const opEntries: Operation[] = (Object.entries(rates) as [string, number][])
      .filter(([_, price]) => price > 0)
      .map(([name, price]) => ({ id: crypto.randomUUID(), name, price }));

    if (!cutNumber || isNaN(total) || total <= 0 || opEntries.length === 0) {
      alert("Please fill Cut Number, Total Pieces and at least one Rate.");
      return;
    }

    if (editingCutId) {
      setCuts(cuts.map(cut => {
        if (cut.id === editingCutId) {
          // If total pieces changed, regenerate bundles
          const updatedBundles = total !== cut.totalPieces ? generateBundles(total, bSize) : cut.bundles;
          return {
            ...cut,
            cutNumber: cutNumber.trim(),
            cutName: cutName.trim(),
            operations: opEntries,
            totalPieces: total,
            bundles: updatedBundles
          };
        }
        return cut;
      }));
      setEditingCutId(null);
    } else {
      const newCut: Cut = {
        id: crypto.randomUUID(),
        cutNumber: cutNumber.trim(),
        cutName: cutName.trim(),
        operations: opEntries,
        totalPieces: total,
        bundles: generateBundles(total, bSize),
        createdAt: Date.now()
      };
      setCuts([newCut, ...cuts]);
    }

    setCutNumber(''); setCutName(''); setTotalPieces(''); setRates({});
  };

  const generateBundles = (total: number, bSize: number): Bundle[] => {
    const bundles: Bundle[] = [];
    const count = Math.ceil(total / bSize);
    for (let i = 0; i < count; i++) {
      bundles.push({ id: crypto.randomUUID(), bundleNumber: i + 1, start: i * bSize + 1, end: Math.min((i + 1) * bSize, total) });
    }
    return bundles;
  };

  const inputBaseClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 font-bold";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-all ${editingCutId ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-200'}`}>
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
          <Scissors className="text-indigo-600" /> {editingCutId ? 'Edit Cut Details' : 'Step 1: Create New Cut'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Cut Number</label>
            <input placeholder="e.g. A-101" value={cutNumber} onChange={e => setCutNumber(e.target.value)} className={inputBaseClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Product Name</label>
            <input placeholder="e.g. T-Shirt" value={cutName} onChange={e => setCutName(e.target.value)} className={inputBaseClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Total Pieces</label>
            <input type="number" placeholder="500" value={totalPieces} onChange={e => setTotalPieces(e.target.value)} className={inputBaseClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Bundle Size</label>
            <input type="number" value={bundleSize} onChange={e => setBundleSize(e.target.value)} className={inputBaseClass} />
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-black text-gray-600 uppercase mb-4 flex items-center gap-2">
            <ListChecks size={16} /> Step 2: Set Rates for Depts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                <span className="flex-1 font-black text-gray-800 text-base">{cat}</span>
                <div className="w-28 relative">
                  <span className="absolute left-2 top-2 text-xs font-bold text-gray-400">Rs</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={rates[cat] || ''} 
                    onChange={e => updateRate(cat, e.target.value)}
                    className={`${inputBaseClass} pl-8`}
                  />
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="col-span-full text-red-500 bg-red-50 p-4 rounded-lg border border-red-100 font-bold italic text-center">
                Please add categories first in the "Manage Employees" tab!
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t gap-3">
          {editingCutId && (
            <Button variant="secondary" onClick={cancelEdit} className="px-10 py-3 text-lg font-black">
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} disabled={categories.length === 0} className="px-10 py-3 text-lg font-black">
            {editingCutId ? <><Check size={20} className="inline mr-1" /> Update Cut</> : 'Save Full Cut'}
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Current Active Cuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cuts.map(cut => (
            <div key={cut.id} className={`border rounded-2xl p-5 bg-white relative hover:shadow-xl transition-shadow border-b-4 ${editingCutId === cut.id ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-indigo-500 border-gray-200'}`}>
               <div className="absolute top-4 right-4 flex gap-1">
                 <button 
                  onClick={() => startEdit(cut)} 
                  className="text-gray-300 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-50"
                  title="Edit Cut"
                 >
                  <Edit2 size={18} />
                 </button>
                 <button 
                  onClick={() => setCutToDelete(cut.id)} 
                  className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                  title="Delete Cut"
                 >
                  <Trash2 size={18} />
                 </button>
               </div>
               
               <div className="flex items-center gap-2 mb-1">
                  <Target size={14} className="text-indigo-400" />
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Cut #{cut.cutNumber}</span>
               </div>
               
               <h3 className="text-xl font-black text-gray-900 mb-1">{cut.cutName || 'Product'}</h3>
               
               <div className="flex items-center gap-2 text-sm text-gray-500 mb-5 bg-gray-50 px-3 py-1 rounded-full w-fit font-bold">
                 <Package size={14} /> Total Pieces: <span className="text-gray-900">{cut.totalPieces}</span>
               </div>

               <div className="space-y-2 border-t pt-4">
                 <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rates per Dept</div>
                 {cut.operations.map(op => (
                   <div key={op.id} className="flex justify-between items-center text-sm bg-indigo-50/50 px-3 py-2 rounded-lg">
                     <span className="text-gray-700 font-bold">{op.name}</span>
                     <span className="font-black text-indigo-700">Rs. {op.price.toFixed(2)}</span>
                   </div>
                 ))}
               </div>
            </div>
          ))}
          {cuts.length === 0 && <p className="col-span-full text-center py-12 text-gray-400 italic">No cuts created yet.</p>}
        </div>
      </div>

      <ConfirmDialog isOpen={!!cutToDelete} title="Delete Cut" message="Warning: This will remove all associated assignment records. Continue?" onConfirm={() => {setCuts(cuts.filter(c => c.id !== cutToDelete)); setCutToDelete(null);}} onCancel={() => setCutToDelete(null)} />
    </div>
  );
};

export default CutCreatorTab;