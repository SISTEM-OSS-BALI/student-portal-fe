import { MenuProps } from "antd";
// Font Awesome (React)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faDiagramProject,
  faFolderTree,
} from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/menu-label";

export const SidebarSettingAdmission = (): MenuProps["items"] => {
  const sidebarMenu: MenuProps["items"] = [
    {
      key: "/admission/dashboard/master-data",
      label: menuLabel("Master Data"),
      icon: <FontAwesomeIcon icon={faFolderTree} style={{ fontSize: 10 }} />,
      children: [
        {
          key: "/admission/dashboard/master-data/questions-management",
          label: menuLabel("Manajemen Pertanyaan"),
          icon: <FontAwesomeIcon icon={faCircle} style={{ fontSize: 10 }} />,
        },
        {
          key: "/admission/dashboard/master-data/documents-management",
          label: menuLabel("Manajemen Dokumen"),
          icon: <FontAwesomeIcon icon={faCircle} style={{ fontSize: 10 }} />,
        },
        {
          key: "/admission/dashboard/master-data/child-steps-management",
          label: menuLabel("Kategori Step"),
          icon: <FontAwesomeIcon icon={faCircle} style={{ fontSize: 10 }} />,
        },
        {
          key: "/admission/dashboard/master-data/steps-management",
          label: menuLabel("Manajemen Step"),
          icon: <FontAwesomeIcon icon={faCircle} style={{ fontSize: 10 }} />,
        },
      ],
    },
    {
      key: "/admission/dashboard/stages-management",
      label: menuLabel("Stage"),
      icon: <FontAwesomeIcon icon={faDiagramProject} style={{ fontSize: 16 }} />,
    },
  ];

  return sidebarMenu;
};
