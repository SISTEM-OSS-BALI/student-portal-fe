import { MenuProps } from "antd";
// Font Awesome (React)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/menu-label";

export const SidebarStudent = (): MenuProps["items"] => {
  const sidebarMenu: MenuProps["items"] = [
    {
      key: "/student/dashboard/home",
      label: menuLabel("Dashboard"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
    {
      key: "/student/dashboard/upload-personal-information",
      label: menuLabel("Upload Personal Information"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
    {
      key: "/student/dashboard/upload-country-document",
      label: menuLabel("Upload Country Document"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
    {
      key: "/student/dashboard/chat",
      label: menuLabel("Chat"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
  ];

  return sidebarMenu;
};
