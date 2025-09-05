'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface ShareStat {
  id: string;
  title: string;
  total_views: number;
  unique_visitors: number;
  engagement_count: number;
  created_at: string;
}

interface ShareStatsCardProps {
  stats: ShareStat[];
}

export function ShareStatsCard({ stats }: ShareStatsCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleCopy = (id: string) => {
    const link = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(link);
    toast({ title: t('dashboard.shareStatsLinkCopiedTitle'), description: t('dashboard.shareStatsLinkCopiedDesc') });
  };

  if (!stats || stats.length === 0) {
    return null; // Don't render the card if there are no stats
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.shareStatsTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dashboard.tableTitle')}</TableHead>
              <TableHead>{t('dashboard.tableViews')}</TableHead>
              <TableHead>{t('dashboard.tableVisitors')}</TableHead>
              <TableHead>{t('dashboard.tableEngagements')}</TableHead>
              <TableHead>{t('dashboard.tableCreated')}</TableHead>
              <TableHead>{t('dashboard.tableLink')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat.id}>
                <TableCell>{stat.title}</TableCell>
                <TableCell>{stat.total_views}</TableCell>
                <TableCell>{stat.unique_visitors}</TableCell>
                <TableCell>{stat.engagement_count}</TableCell>
                <TableCell>{new Date(stat.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(stat.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
