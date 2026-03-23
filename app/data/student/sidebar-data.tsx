import { MenuProps } from "antd";
import { useRouter } from "next/navigation";
// Font Awesome (React)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import menuLabel from "@/app/utils/menu-label";

export const SidebarStudent = (): MenuProps["items"] => {
  const router = useRouter();

  const sidebarMenu: MenuProps["items"] = [
    {
      key: "/student/dashboard/home",
      label: menuLabel("Dashboard"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
      onClick: () => router.push("/student/dashboard/home"),
    },
    {
      key: "/student/dashboard/upload-documents",
      label: menuLabel("Upload Dokumen"),
      icon: <FontAwesomeIcon icon={faBriefcase} style={{ fontSize: 16 }} />,
      onClick: () => router.push("/student/dashboard/upload-documents"),
    },
  ];

  return sidebarMenu;
};
