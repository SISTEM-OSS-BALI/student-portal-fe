import { MenuProps } from "antd";
// Font Awesome (React)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/menu-label";

export const SidebarMainDirector = (): MenuProps["items"] => {
  const sidebarMenu: MenuProps["items"] = [
    {
      key: "/director/dashboard/home",
      label: menuLabel("Dashboard"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
    {
      key: "/director/dashboard/students-management",
      label: menuLabel("Students Management"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
    {
      key: "/director/dashboard/information-country-management",
      label: menuLabel("Information Country Management"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
  ];

  return sidebarMenu;
};
