import React, { useState } from 'react';
import { Plus, Trash2, Edit2, UserCheck, LayoutGrid, X, Briefcase, Check } from 'lucide-react';
import { Employee } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import ConfirmDialog from './ui/ConfirmDialog';

interface EmployeesTabProps {
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  categories: string[];
  setCategories: (categories: string[]) => void;
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({ 
  employees, 
  setEmployees,
  categories,
  setCategories
}) => {
  const [newCat, setNewCat] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const addCategory = () => {
    if (!newCat.trim()) return;
    if (categories.includes(newCat.trim())) {
      alert("Category already exists!");
      return;
    }
    setCategories([...categories, newCat.trim()]);
    setNewCat('');
  };

  const startEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setNewName(emp.name);
    setNewRole(emp.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingEmployeeId(null);
    setNewName('');
    setNewRole('');
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const roleToUse = newRole || categories[0];
    if (!newName.trim() || !roleToUse) return;
    
    if (editingEmployeeId) {
      setEmployees(employees.map(emp => 
        emp.id === editingEmployeeId 
          ? { ...emp, name: newName.trim(), role: roleToUse } 
          : emp
      ));
      setEditingEmployeeId(null);
    } else {
      const newEmployee: Employee = {
        id: crypto.randomUUID(),
        name: newName.trim(),
        role: roleToUse
      };
      setEmployees([...employees, newEmployee]);
    }
    
    setNewName('');
    setNewRole('');
  };

  const inputBaseClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 font-medium";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Category Management */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
          <LayoutGrid className="text-indigo-600" /> Step 1: Create Departments
        </h2>
        <div className="flex gap-2 mb-6">
          <div className="flex-1">
            <input 
              placeholder="e.g. Safety, Pocket, Singer..." 
              value={newCat} 
              onChange={e => setNewCat(e.target.value)}
              className={inputBaseClass}
            />
          </div>
          <Button onClick={addCategory} className="whitespace-nowrap font-bold">Add Category</Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat} className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-3 font-bold text-sm">
              {cat}
              <button onClick={() => setCategoryToDelete(cat)} className="text-indigo-200 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-gray-400 italic">No categories created yet. Please add one first.</p>}
        </div>
      </div>

      {/* Employee Management */}
      <div id="employee-form" className={`bg-white p-6 rounded-lg shadow-sm border-2 transition-all ${editingEmployeeId ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-200'}`}>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
          <UserCheck className="text-indigo-600" /> {editingEmployeeId ? 'Edit Employee' : 'Step 2: Add Employees'}
        </h2>
        <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Worker Name</label>
            <input
              placeholder="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputBaseClass}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Assign to Dept</label>
            <select 
              className={inputBaseClass}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              disabled={categories.length === 0}
            >
              <option value="">-- Select Category --</option>
              {categories.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!newName.trim() || categories.length === 0} className="flex-1 h-[42px] font-bold">
              {editingEmployeeId ? <><Check size={18} className="inline mr-1" /> Update</> : <><Plus size={18} className="inline mr-1" /> Add</>}
            </Button>
            {editingEmployeeId && (
              <Button type="button" variant="secondary" onClick={cancelEdit} className="h-[42px]">
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => (
            <div key={employee.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all shadow-sm group ${editingEmployeeId === employee.id ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100' : 'bg-gray-50 border-gray-100 hover:border-indigo-300'}`}>
               <div className="flex flex-col">
                  <span className="font-black text-gray-900 text-lg leading-tight">{employee.name}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Briefcase size={10} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {employee.role}
                    </span>
                  </div>
               </div>
               <div className="flex items-center gap-1">
                 <button 
                  onClick={() => startEdit(employee)} 
                  className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                  title="Edit Employee"
                 >
                   <Edit2 size={16} />
                 </button>
                 <button 
                  onClick={() => setEmployeeToDelete(employee.id)} 
                  className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete Employee"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
            </div>
          ))}
          {employees.length === 0 && <p className="col-span-full text-center text-gray-400 py-8 italic border-2 border-dashed rounded-lg">No workers added yet.</p>}
        </div>
      </div>

      <ConfirmDialog isOpen={!!employeeToDelete} title="Delete Employee" message="Are you sure you want to remove this employee?" onConfirm={() => {setEmployees(employees.filter(e => e.id !== employeeToDelete)); setEmployeeToDelete(null);}} onCancel={() => setEmployeeToDelete(null)} />
      <ConfirmDialog isOpen={!!categoryToDelete} title="Delete Category" message="Are you sure you want to delete this category?" onConfirm={() => {setCategories(categories.filter(c => c !== categoryToDelete)); setCategoryToDelete(null);}} onCancel={() => setCategoryToDelete(null)} />
    </div>
  );
};

export default EmployeesTab;