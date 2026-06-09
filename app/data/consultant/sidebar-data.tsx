import { MenuProps } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/menu-label";

export const SidebarMainConsultant = (): MenuProps["items"] => {
  return [
    {
      key: "/consultant/dashboard/students-management",
      label: menuLabel("Student Pipeline"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
    },
  ];
};
