import {
  AlertTriangleIcon,
} from "lucide-react";

export function EmptyTable({ children }) {
  return (
    <div className="flex flex-col bg-background w-full p-3 items-center">
      <AlertTriangleIcon className="w-10 h-10" />
      <div className="text-lg">{children || 'No rows to Show'}</div>
    </div>
  );
}