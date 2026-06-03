export interface DrawingAction {
  type: "DRAW" | "CLEAR";
  data?: any;
  timestamp: number;
}
