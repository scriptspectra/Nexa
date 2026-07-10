"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { usePaginatedQuery, useAction, useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import type { PublicFile } from "@workspace/backend/private/files";
import { Button } from "@workspace/ui/components/button";
import {
  FileIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TrashIcon,
  SearchIcon,
  DatabaseIcon,
  FileTextIcon,
  SparklesIcon,
  RefreshCwIcon,
  NetworkIcon,
  GlobeIcon,
  MapIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { UploadDialog } from "../components/upload-dialog";
import { AddUrlDialog } from "../components/add-url-dialog";
import { CrawlDialog } from "../components/crawl-dialog";
import { useState } from "react";
import { DeleteFileDialog } from "../components/delete-file-dialog";
import { Doc } from "@workspace/backend/_generated/dataModel";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: number | undefined): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatNextCrawl(ts: number | undefined): string {
  if (!ts) return "—";
  const diff = ts - Date.now();
  if (diff <= 0) return "soon";
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.floor(hours / 24)}d`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: <ClockIcon className="size-3" />,
  },
  running: {
    label: "Running",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: <Loader2Icon className="size-3 animate-spin" />,
  },
  done: {
    label: "Done",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: <CheckCircleIcon className="size-3" />,
  },
  error: {
    label: "Error",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: <XCircleIcon className="size-3" />,
  },
};

const MODE_ICON: Record<string, React.ReactNode> = {
  single: <GlobeIcon className="size-3.5" />,
  sitemap: <MapIcon className="size-3.5" />,
  recursive: <NetworkIcon className="size-3.5" />,
};

// ─── CrawlJobRow ─────────────────────────────────────────────────────────────

function CrawlJobRow({
  job,
  onRecrawl,
  onDelete,
}: {
  job: Doc<"crawlJobs">;
  onRecrawl: (id: Doc<"crawlJobs">["_id"]) => void;
  onDelete: (id: Doc<"crawlJobs">["_id"]) => void;
}) {
  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;

  return (
    <TableRow className="hover:bg-white/[0.02] border-b border-white/5 transition-colors">
      {/* URL + mode */}
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-400 flex-shrink-0">
            {MODE_ICON[job.mode]}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-zinc-200 text-sm overflow-hidden text-ellipsis whitespace-nowrap block max-w-[280px]">
              {job.rootUrl}
            </span>
            <span className="text-[10px] text-zinc-500 capitalize font-medium">{job.mode} crawl</span>
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="px-6 py-4">
        <Badge
          className={`uppercase text-[10px] font-bold tracking-wider rounded-md border flex items-center gap-1 w-fit ${status?.badge ?? ""}`}
          variant="outline"
        >
          {status?.icon}
          {status?.label}
        </Badge>
        {job.status === "error" && job.errorMessage && (
          <p className="text-[10px] text-rose-400 mt-1 max-w-[180px] truncate" title={job.errorMessage}>
            {job.errorMessage}
          </p>
        )}
      </TableCell>

      {/* Pages */}
      <TableCell className="px-6 py-4 text-zinc-400 text-sm font-mono">
        {job.pagesCrawled ?? 0}
        {job.pagesFound ? <span className="text-zinc-600"> / {job.pagesFound}</span> : null}
      </TableCell>

      {/* Last crawled */}
      <TableCell className="px-6 py-4 text-zinc-500 text-xs">
        {formatRelativeTime(job.lastCrawledAt)}
      </TableCell>

      {/* Next crawl */}
      <TableCell className="px-6 py-4 text-zinc-500 text-xs">
        {job.recrawlIntervalHours
          ? <span className="text-emerald-400">{formatNextCrawl(job.nextCrawlAt)}</span>
          : <span className="text-zinc-600">Manual only</span>}
      </TableCell>

      {/* Actions */}
      <TableCell className="px-6 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="size-8 p-0 border border-white/5 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 transition-all rounded-lg"
              size="sm"
              variant="ghost"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-950 border border-white/10 text-white rounded-xl">
            <DropdownMenuItem
              className="text-zinc-200 focus:text-white focus:bg-white/5 cursor-pointer flex items-center"
              onClick={() => onRecrawl(job._id)}
              disabled={job.status === "running"}
            >
              <PlayIcon className="size-4 mr-2 text-violet-400" />
              Crawl Now
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer flex items-center"
              onClick={() => onDelete(job._id)}
            >
              <TrashIcon className="size-4 mr-2" />
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ─── FilesView ────────────────────────────────────────────────────────────────

export const FilesView = () => {
  const files = usePaginatedQuery(
    api.private.files.list,
    {},
    { initialNumItems: 10 },
  );

  const crawlJobs = usePaginatedQuery(
    api.private.crawl.listCrawlJobs,
    {},
    { initialNumItems: 20 },
  );

  const triggerRecrawl = useAction(api.private.crawl.triggerRecrawl);
  const deleteCrawlJob = useMutation(api.private.crawl.deleteCrawlJob);

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingFirstPage,
    isLoadingMore,
  } = useInfiniteScroll({
    status: files.status,
    loadMore: files.loadMore,
    loadSize: 10,
  });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addUrlDialogOpen, setAddUrlDialogOpen] = useState(false);
  const [crawlDialogOpen, setCrawlDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"documents" | "crawls">("documents");

  const [selectedFile, setSelectedFile] = useState<PublicFile | null>(null);

  const handleDeleteClick = (file: PublicFile) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const handleFileDeleted = () => {
    setSelectedFile(null);
  };

  const handleDeleteCrawlJob = async (jobId: Doc<"crawlJobs">["_id"]) => {
    try {
      await deleteCrawlJob({ jobId });
    } catch (err) {
      console.error("Failed to delete crawl job:", err);
    }
  };

  const handleRecrawl = async (jobId: Doc<"crawlJobs">["_id"]) => {
    try {
      await triggerRecrawl({ jobId });
    } catch (err) {
      console.error("Failed to trigger recrawl:", err);
    }
  };

  const filesResults = files.results || [];
  const crawlJobsResults = crawlJobs.results || [];

  // Client side filtering for responsive search UX
  const filteredResults = filesResults.filter((file: any) => {
    const query = searchQuery.toLowerCase();
    return (
      file.name.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
    );
  });

  // Helper to get styled badges and icons based on file extensions
  const getFileTypeStyle = (type: string) => {
    const t = type.toLowerCase();
    if (t === "pdf") {
      return {
        badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: "text-rose-400 bg-rose-500/5 border-rose-500/10"
      };
    }
    if (t === "csv" || t === "excel" || t === "xlsx") {
      return {
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: "text-amber-400 bg-amber-500/5 border-amber-500/10"
      };
    }
    if (t === "txt" || t === "text" || t === "plain") {
      return {
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
      };
    }
    return {
      badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      icon: "text-zinc-400 bg-zinc-500/5 border-zinc-500/10"
    };
  };

  const totalPagesCrawled = crawlJobsResults.reduce((s, j) => s + (j.pagesCrawled ?? 0), 0);

  return (
    <>
      <DeleteFileDialog
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        file={selectedFile}
        onDeleted={handleFileDeleted}
      />
      <UploadDialog
        onOpenChange={setUploadDialogOpen}
        open={uploadDialogOpen}
      />
      <AddUrlDialog
        onOpenChange={setAddUrlDialogOpen}
        open={addUrlDialogOpen}
      />
      <CrawlDialog
        onOpenChange={setCrawlDialogOpen}
        open={crawlDialogOpen}
        onJobCreated={() => setActiveTab("crawls")}
      />

      <div className="flex min-h-screen flex-col bg-black p-6 md:p-12 overflow-y-auto">
        <div className="w-full space-y-8">

          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              <SparklesIcon className="size-3 text-primary" />
              AI Context
            </div>

            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                Knowledge Base
              </h1>

              <p className="text-base text-zinc-400 max-w-3xl leading-relaxed">
                Upload documents, scrape URLs, or auto-crawl entire websites to train your AI assistant.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Documents</span>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-300">
                  <DatabaseIcon className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{isLoadingFirstPage ? "..." : filesResults.length}</span>
                <span className="text-xs text-zinc-500">files loaded</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Crawl Jobs</span>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-violet-400">
                  <NetworkIcon className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-violet-400 tracking-tight">{crawlJobsResults.length}</span>
                <span className="text-xs text-zinc-500">active</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pages Crawled</span>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-300">
                  <FileTextIcon className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{totalPagesCrawled}</span>
                <span className="text-xs text-zinc-500">indexed</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Index System</span>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse block" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-400 tracking-tight">RAG</span>
                <span className="text-xs text-zinc-500">Vector Indexed</span>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-zinc-950/60 border border-white/5 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "documents"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <DatabaseIcon className="size-3.5" />
                Documents
              </span>
            </button>
            <button
              onClick={() => setActiveTab("crawls")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 relative ${
                activeTab === "crawls"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <NetworkIcon className="size-3.5" />
                Web Crawls
                {crawlJobsResults.some((j) => j.status === "running") && (
                  <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </span>
            </button>
          </div>

          {/* ── Documents Tab ── */}
          {activeTab === "documents" && (
            <div className="rounded-2xl border border-white/5 bg-zinc-950/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Table Control Header */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-white/5 px-6 py-5 bg-zinc-950/20">
                <div className="relative w-full sm:max-w-xs">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/30 transition-all font-sans"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => setAddUrlDialogOpen(true)}
                    className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl h-10 px-4 transition-all duration-300 shadow-md shadow-white/5 active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
                  >
                    <PlusIcon className="size-4" />
                    Add URL
                  </Button>
                  <Button
                    onClick={() => setUploadDialogOpen(true)}
                    className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl h-10 px-4 transition-all duration-300 shadow-md shadow-white/5 active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
                  >
                    <PlusIcon className="size-4" />
                    Add Document
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-zinc-950/40 border-b border-white/5">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">Document Name</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">Extension</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">Storage Size</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (isLoadingFirstPage) {
                      return (
                        <TableRow className="hover:bg-transparent">
                          <TableCell className="h-48 text-center border-none" colSpan={4}>
                            <div className="flex flex-col items-center justify-center gap-3">
                              <RefreshCwIcon className="size-6 animate-spin text-zinc-600" />
                              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mt-1">Loading Document Vault...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    if (filteredResults.length === 0) {
                      return (
                        <TableRow className="hover:bg-transparent">
                          <TableCell className="h-64 text-center border-none" colSpan={4}>
                            <div className="flex flex-col items-center justify-center py-6 max-w-sm mx-auto">
                              <div className="relative mb-4">
                                <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl opacity-50 scale-150 animate-pulse" />
                                <div className="relative flex size-14 items-center justify-center rounded-2xl bg-zinc-950 border border-white/5 text-zinc-400">
                                  <DatabaseIcon className="size-7" />
                                </div>
                              </div>
                              <h3 className="text-base font-bold text-zinc-200">No documents found</h3>
                              <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-normal">
                                {searchQuery ? "No matches found for your search term. Try checking for spelling errors." : "Upload documents to train your AI assistant on custom company guides, products, and policies."}
                              </p>
                              {!searchQuery && (
                                <Button
                                  onClick={() => setUploadDialogOpen(true)}
                                  className="mt-5 bg-white/5 hover:bg-white/10 text-zinc-200 font-semibold rounded-xl h-9 px-4 border border-white/5 transition-all text-xs"
                                >
                                  Upload First File
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredResults.map((file: any) => {
                      const styles = getFileTypeStyle(file.type);
                      return (
                        <TableRow className="hover:bg-white/[0.02] border-b border-white/5 transition-colors" key={file.id}>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex size-8 items-center justify-center rounded-lg border ${styles.icon}`}>
                                <FileIcon className="size-4" />
                              </div>
                              <span className="font-semibold text-zinc-200 text-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px]">
                                {file.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className={`uppercase text-[10px] font-bold tracking-wider rounded-md border ${styles.badge}`} variant="outline">
                              {file.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-zinc-400 text-sm font-mono">
                            {file.size}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  className="size-8 p-0 border border-white/5 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 transition-all rounded-lg"
                                  size="sm"
                                  variant="ghost"
                                >
                                  <MoreHorizontalIcon className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-zinc-950 border border-white/10 text-white rounded-xl">
                                <DropdownMenuItem
                                  className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer flex items-center"
                                  onClick={() => handleDeleteClick(file)}
                                >
                                  <TrashIcon className="size-4 mr-2" />
                                  Delete Document
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
              {!isLoadingFirstPage && filteredResults.length > 0 && (
                <div className="border-t border-white/5">
                  <InfiniteScrollTrigger
                    canLoadMore={canLoadMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={handleLoadMore}
                    ref={topElementRef}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── Web Crawls Tab ── */}
          {activeTab === "crawls" && (
            <div className="rounded-2xl border border-white/5 bg-zinc-950/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-white/5 px-6 py-5 bg-zinc-950/20">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <NetworkIcon className="size-4 text-violet-400" />
                    Web Crawl Jobs
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Auto-crawl entire websites or sitemaps on a schedule
                  </p>
                </div>
                <Button
                  onClick={() => setCrawlDialogOpen(true)}
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl h-10 px-4 transition-all duration-300 shadow-lg shadow-violet-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <PlusIcon className="size-4" />
                  New Crawl Job
                </Button>
              </div>

              <Table>
                <TableHeader className="bg-zinc-950/40 border-b border-white/5">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">URL / Source</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">Pages</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">Last Crawled</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider">Next Crawl</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-zinc-400 text-xs uppercase tracking-wider w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crawlJobsResults.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="h-64 text-center border-none" colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-6 max-w-sm mx-auto">
                          <div className="relative mb-4">
                            <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl opacity-50 scale-150 animate-pulse" />
                            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-zinc-950 border border-white/5 text-violet-400">
                              <NetworkIcon className="size-7" />
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-zinc-200">No crawl jobs yet</h3>
                          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-normal text-center">
                            Create a crawl job to automatically index entire websites, sitemaps, or recursively follow links into your knowledge base.
                          </p>
                          <Button
                            onClick={() => setCrawlDialogOpen(true)}
                            className="mt-5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-semibold rounded-xl h-9 px-4 border border-violet-500/20 transition-all text-xs"
                          >
                            <PlusIcon className="size-3.5 mr-1.5" />
                            Create First Crawl Job
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    crawlJobsResults.map((job: any) => (
                      <CrawlJobRow
                        key={job._id}
                        job={job}
                        onRecrawl={handleRecrawl}
                        onDelete={handleDeleteCrawlJob}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
