
import React, { useState, useEffect } from 'react';
import { Users, Scissors, ClipboardList, Database, BarChart3 } from 'lucide-react';
import { Employee, Cut, Assignment } from './types';
import * as storage from './services/storage';
import EmployeesTab from './components/EmployeesTab';
import CutCreatorTab from './components/CutCreatorTab';
import AssignmentTab from './components/AssignmentTab';
import ReportsTab from './components/ReportsTab';

enum Mode {
  DATA_ENTRY = 'data_entry',
  REPORTS = 'reports'
}

enum EntryTab {
  EMPLOYEES = 'employees',
  CUTS = 'cuts',
  ASSIGNMENTS = 'assignments',
}

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>(Mode.DATA_ENTRY);
  const [entryTab, setEntryTab] = useState<EntryTab>(EntryTab.ASSIGNMENTS);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing data from storage
    setEmployees(storage.loadEmployees());
    setCuts(storage.loadCuts());
    setAssignments(storage.loadAssignments());
    setCategories(storage.loadCategories());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      storage.saveEmployees(employees);
      storage.saveCuts(cuts);
      storage.saveAssignments(assignments);
      storage.saveCategories(categories);
    }
  }, [employees, cuts, assignments, categories, loading]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 font-bold">Loading Factory Data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-gray-900 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight">Contract Work Tool</h1>
            </div>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button onClick={() => setMode(Mode.DATA_ENTRY)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === Mode.DATA_ENTRY ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                <Database size={16} /> Data Entry
              </button>
              <button onClick={() => setMode(Mode.REPORTS)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === Mode.REPORTS ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}>
                <BarChart3 size={16} /> Reports
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === Mode.DATA_ENTRY && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6 inline-flex">
                <button onClick={() => setEntryTab(EntryTab.ASSIGNMENTS)} className={`px-5 py-3 rounded-md text-sm font-medium flex items-center gap-2 ${entryTab === EntryTab.ASSIGNMENTS ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <ClipboardList size={18} /> Assign Work
                </button>
                <button onClick={() => setEntryTab(EntryTab.CUTS)} className={`px-5 py-3 rounded-md text-sm font-medium flex items-center gap-2 ${entryTab === EntryTab.CUTS ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Scissors size={18} /> Manage Cuts
                </button>
                <button onClick={() => setEntryTab(EntryTab.EMPLOYEES)} className={`px-5 py-3 rounded-md text-sm font-medium flex items-center gap-2 ${entryTab === EntryTab.EMPLOYEES ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Users size={18} /> Manage Employees
                </button>
            </div>

            <div className="space-y-6">
                {entryTab === EntryTab.EMPLOYEES && (
                  <EmployeesTab 
                    employees={employees} 
                    setEmployees={setEmployees}
                    categories={categories}
                    setCategories={setCategories}
                  />
                )}
                {entryTab === EntryTab.CUTS && (
                  <CutCreatorTab cuts={cuts} setCuts={setCuts} categories={categories} />
                )}
                {entryTab === EntryTab.ASSIGNMENTS && (
                  <AssignmentTab 
                    employees={employees} 
                    cuts={cuts} 
                    assignments={assignments} 
                    setAssignments={setAssignments} 
                  />
                )}
            </div>
          </div>
        )}

        {mode === Mode.REPORTS && (
          <ReportsTab employees={employees} assignments={assignments} cuts={cuts} categories={categories} />
        )}
      </main>
    </div>
  );
};

export default App;
