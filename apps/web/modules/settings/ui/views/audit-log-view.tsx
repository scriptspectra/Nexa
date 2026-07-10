"use client";

import { usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

export const AuditLogView = () => {
  const {
    results,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.private.audit.listLogs,
    {},
    { initialNumItems: 50 }
  );

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingMore,
    isLoadingFirstPage,
  } = useInfiniteScroll({
    status,
    loadMore,
    loadSize: 50,
  });

  return (
    <Card className="bg-surface-container border-outline-variant">
      <CardHeader>
        <CardTitle className="text-on-surface">Audit Log</CardTitle>
        <CardDescription className="text-on-surface-variant">
          A chronological history of administrative and operator actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingFirstPage ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="rounded-md border border-outline-variant">
            <Table>
              <TableHeader className="bg-surface-container-high">
                <TableRow className="hover:bg-transparent border-b-outline-variant">
                  <TableHead className="text-on-surface-variant font-label-md">Timestamp</TableHead>
                  <TableHead className="text-on-surface-variant font-label-md">Actor</TableHead>
                  <TableHead className="text-on-surface-variant font-label-md">Action</TableHead>
                  <TableHead className="text-on-surface-variant font-label-md">Resource</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-on-surface-variant">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map((log: any) => (
                    <TableRow key={log._id} className="border-b-outline-variant hover:bg-surface-container-high/50">
                      <TableCell className="text-on-surface text-body-sm">
                        {format(log._creationTime, "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-on-surface font-medium text-body-sm">
                        {log.actorName}
                      </TableCell>
                      <TableCell className="text-on-surface text-body-sm">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-on-surface-variant text-body-sm font-mono text-[11px]">
                        {log.resourceType}: {log.resourceId}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <InfiniteScrollTrigger
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              ref={topElementRef}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
