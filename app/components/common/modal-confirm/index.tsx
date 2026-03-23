import { Modal } from "antd";

export default function ModalConfirm({
  title,
  description,
  actions,
  onOk,
  onCancel,
}: {
  title: string;
  description: string;
  actions: string;
  onOk?: () => void;
  onCancel?: () => void;
}) {
  const modalConfig = Modal.confirm({
    title: "Are you sure?",
    content: (
      <p>
        Are you sure you want to proceed with <b>{actions.toUpperCase()}</b> for{" "}
        <b>{title.toUpperCase()}</b> : <b>{description}</b>? This action cannot
        be undone. Do you want to continue?
      </p>
    ),
    onOk: onOk,
    onCancel: onCancel,
  });

  return modalConfig;
}
