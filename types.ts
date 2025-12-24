
export interface Employee {
  id: string;
  name: string;
  role: string; // New field for employee specialty/department
}

export interface Bundle {
  id: string;
  bundleNumber: number;
  start: number;
  end: number;
}

export interface Operation {
  id: string;
  name: string;
  price: number;
}

export interface Cut {
  id: string;
  cutNumber: string;
  cutName?: string;
  operations: Operation[]; 
  totalPieces: number;
  bundles: Bundle[];
  createdAt: number;
}

export interface Assignment {
  id: string;
  employeeId: string;
  cutId: string;
  operationId: string; 
  bundleId: string;
  startPiece: number;
  endPiece: number;
  assignedAt: number;
}
