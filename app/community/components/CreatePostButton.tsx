import Link from "next/link";
import { Plus } from "lucide-react";

export default function CreatePostButton() {
  return (
    <Link href="/community/create" className="btn btn-primary">
      <Plus className="h-4 w-4" aria-hidden="true" />
      Create Post
    </Link>
  );
}
