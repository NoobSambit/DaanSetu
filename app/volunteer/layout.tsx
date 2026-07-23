import VolunteerNavigation from "@/components/workspaces/VolunteerNavigation";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <VolunteerNavigation />
      {children}
    </>
  );
}
