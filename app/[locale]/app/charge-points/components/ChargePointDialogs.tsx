import { Site } from "@watchborne/charge-points-types";

import { ChargePointWithConnectors } from "@/types/charge-point";

import { ChargePointConnectionUrlDialog } from "./ChargePointConnectionUrlDialog";
import { ChargePointDeletionDialog } from "./ChargePointDeletionDialog";
import { ChargePointFormDialog } from "./ChargePointFormDialog";
import { CommissioningDialog } from "./CommissioningDialog";
import type { ChargePointDialogsController } from "../hooks/useChargePointDialogs";
import type { useChargePointMutations } from "../hooks/useChargePointMutations";

interface ChargePointDialogsProps {
  dialogs: ChargePointDialogsController;
  mutations: ReturnType<typeof useChargePointMutations>;
  sites: Site[];
  /** Pre-selects the site in the create form. */
  defaultSiteId?: string | null;
  /** Called once a delete succeeded, so the page can drop a selection on it. */
  onDeleted: (chargePoint: ChargePointWithConnectors) => void;
}

/** The page's five dialogs (create, connection URL, edit, commission, delete). */
export const ChargePointDialogs = ({
  dialogs,
  mutations,
  sites,
  defaultSiteId,
  onDeleted,
}: ChargePointDialogsProps) => {
  const { editTarget, commissionTarget, deleteTarget } = dialogs;

  return (
    <>
      <CommissioningDialog
        open={!!commissionTarget}
        onOpenChange={(open) => !open && dialogs.closeCommission()}
        chargePoint={commissionTarget}
        sites={sites}
        onCommission={async (values) => {
          if (!commissionTarget) return;
          await mutations.commission(commissionTarget.id, values);
          dialogs.closeCommission();
        }}
      />

      <ChargePointFormDialog
        open={dialogs.createOpen}
        onOpenChange={(open) => (open ? dialogs.openCreate() : dialogs.closeCreate())}
        onSubmit={async (values) => dialogs.showCreated(await mutations.create(values))}
        mode="create"
        sites={sites}
        defaultSiteId={defaultSiteId}
      />
      <ChargePointConnectionUrlDialog
        open={!!dialogs.createdChargePoint}
        onOpenChange={(open) => !open && dialogs.closeCreated()}
        chargePoint={dialogs.createdChargePoint}
      />
      <ChargePointFormDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && dialogs.closeEdit()}
        initialValues={
          editTarget
            ? {
                name: editTarget.name,
                siteId: editTarget.siteId ?? "",
                meta: {
                  vendor: editTarget.meta?.vendor ?? "",
                  model: editTarget.meta?.model ?? "",
                  serialNumber: editTarget.meta?.serialNumber ?? "",
                  firmwareVersion: editTarget.meta?.firmwareVersion ?? "",
                },
              }
            : undefined
        }
        onSubmit={async (values) => {
          if (!editTarget) return;
          await mutations.edit(editTarget.id, values);
          dialogs.closeEdit();
        }}
        mode="edit"
        sites={sites}
      />
      <ChargePointDeletionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && dialogs.closeDelete()}
        deleteTarget={deleteTarget}
        onDeleteClicked={async () => {
          if (!deleteTarget) return;
          await mutations.remove(deleteTarget.id);
          onDeleted(deleteTarget);
          dialogs.closeDelete();
        }}
      />
    </>
  );
};
