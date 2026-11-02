import { useMemo, useReducer } from "react";

import { ChargePointWithConnectors, CreatedChargePoint } from "@/types/charge-point";

type DialogsState = {
  createOpen: boolean;
  /** Set after a successful create: opens the connection URL dialog. */
  createdChargePoint: CreatedChargePoint | null;
  editTarget: ChargePointWithConnectors | null;
  commissionTarget: ChargePointWithConnectors | null;
  deleteTarget: ChargePointWithConnectors | null;
};

type DialogsAction =
  | { type: "openCreate" }
  | { type: "closeCreate" }
  | { type: "created"; chargePoint: CreatedChargePoint }
  | { type: "closeCreated" }
  | { type: "edit"; chargePoint: ChargePointWithConnectors | null }
  | { type: "commission"; chargePoint: ChargePointWithConnectors | null }
  | { type: "delete"; chargePoint: ChargePointWithConnectors | null };

const initialState: DialogsState = {
  createOpen: false,
  createdChargePoint: null,
  editTarget: null,
  commissionTarget: null,
  deleteTarget: null,
};

export const dialogsReducer = (state: DialogsState, action: DialogsAction): DialogsState => {
  switch (action.type) {
    case "openCreate":
      return { ...state, createOpen: true };
    case "closeCreate":
      return { ...state, createOpen: false };
    case "created":
      return { ...state, createdChargePoint: action.chargePoint };
    case "closeCreated":
      return { ...state, createdChargePoint: null };
    case "edit":
      return { ...state, editTarget: action.chargePoint };
    case "commission":
      return { ...state, commissionTarget: action.chargePoint };
    case "delete":
      return { ...state, deleteTarget: action.chargePoint };
  }
};

/** Which of the page's dialogs is open, and for which charge point. */
export const useChargePointDialogs = () => {
  const [state, dispatch] = useReducer(dialogsReducer, initialState);

  const actions = useMemo(
    () => ({
      openCreate: () => dispatch({ type: "openCreate" }),
      closeCreate: () => dispatch({ type: "closeCreate" }),
      showCreated: (chargePoint: CreatedChargePoint) => dispatch({ type: "created", chargePoint }),
      closeCreated: () => dispatch({ type: "closeCreated" }),
      openEdit: (chargePoint: ChargePointWithConnectors) => dispatch({ type: "edit", chargePoint }),
      closeEdit: () => dispatch({ type: "edit", chargePoint: null }),
      openCommission: (chargePoint: ChargePointWithConnectors) =>
        dispatch({ type: "commission", chargePoint }),
      closeCommission: () => dispatch({ type: "commission", chargePoint: null }),
      openDelete: (chargePoint: ChargePointWithConnectors) =>
        dispatch({ type: "delete", chargePoint }),
      closeDelete: () => dispatch({ type: "delete", chargePoint: null }),
    }),
    [],
  );

  return { ...state, ...actions };
};

export type ChargePointDialogsController = ReturnType<typeof useChargePointDialogs>;
