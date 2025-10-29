import Link from "next/link";
import { Button } from "./ui/button";
import UserProfile from "./user-profile";
import { GraduationCap } from "lucide-react";

export default function DashboardNavbar() {
  return (
    <nav className="w-full border-b border-gray-200 bg-white py-3 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <GraduationCap className="h-6 w-6" />
          <span>Cramlyg</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
          <UserProfile />
        </div>
      </div>
    </nav>
  );
}