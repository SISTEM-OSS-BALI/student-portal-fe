import { MenuProps } from "antd";
// Font Awesome (React)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faIdCard, faFileAlt, faComments } from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/menu-label";

export const SidebarStudent = (): MenuProps["items"] => {
  const sidebarMenu: MenuProps["items"] = [
    {
      key: "/student/dashboard/home",
      label: menuLabel("Dashboard"),
      icon: <FontAwesomeIcon icon={faHome} style={{ fontSize: 16 }} />,
    },
    {
      key: "/student/dashboard/upload-personal-information",
      label: menuLabel("Personal Info"),
      icon: <FontAwesomeIcon icon={faIdCard} style={{ fontSize: 16 }} />,
    },
    {
      key: "/student/dashboard/upload-country-document",
      label: menuLabel("Documents"),
      icon: <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: 16 }} />,
    },
    {
      key: "/student/dashboard/chat",
      label: menuLabel("Chat"),
      icon: <FontAwesomeIcon icon={faComments} style={{ fontSize: 16 }} />,
    },
  ];

  return sidebarMenu;
};
