
import { Employee, Cut, Assignment } from '../types';

const KEYS = {
  EMPLOYEES: 'cwt_employees',
  CUTS: 'cwt_cuts',
  ASSIGNMENTS: 'cwt_assignments',
  CATEGORIES: 'cwt_categories',
};

export const loadEmployees = (): Employee[] => {
  const data = localStorage.getItem(KEYS.EMPLOYEES);
  return data ? JSON.parse(data) : [];
};

export const saveEmployees = (employees: Employee[]): void => {
  localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
};

export const loadCuts = (): Cut[] => {
  const data = localStorage.getItem(KEYS.CUTS);
  return data ? JSON.parse(data) : [];
};

export const saveCuts = (cuts: Cut[]): void => {
  localStorage.setItem(KEYS.CUTS, JSON.stringify(cuts));
};

export const loadAssignments = (): Assignment[] => {
  const data = localStorage.getItem(KEYS.ASSIGNMENTS);
  return data ? JSON.parse(data) : [];
};

export const saveAssignments = (assignments: Assignment[]): void => {
  localStorage.setItem(KEYS.ASSIGNMENTS, JSON.stringify(assignments));
};

export const loadCategories = (): string[] => {
  const data = localStorage.getItem(KEYS.CATEGORIES);
  return data ? JSON.parse(data) : [];
};

export const saveCategories = (categories: string[]): void => {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};
