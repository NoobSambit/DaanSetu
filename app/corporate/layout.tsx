import CorporateNavigation from "@/components/workspaces/CorporateNavigation";

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CorporateNavigation />
      {children}
    </>
  );
}
