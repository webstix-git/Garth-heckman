import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetailCardProps {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function DetailCard({ title, action, className, children }: DetailCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}
