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
import { usePaginatedQuery } from "convex/react";
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
  HardDriveIcon, 
  SparklesIcon, 
  RefreshCwIcon 
} from "lucide-react";
import { UploadDialog } from "../components/upload-dialog";
import { useState } from "react";
import { DeleteFileDialog } from "../components/delete-file-dialog";

export const FilesView = () => {
  const files = usePaginatedQuery(
    api.private.files.list,
    {},
    {
      initialNumItems: 10,
    },
  );

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedFile, setSelectedFile] = useState<PublicFile | null>(null);
  
  const handleDeleteClick = (file: PublicFile) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const handleFileDeleted = () => {
    setSelectedFile(null);
  };

  // Client side filtering for responsive search UX
  const filteredResults = files.results.filter((file) => {
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
            Upload documents, guides, FAQs, and policies that your AI can reference when answering customer questions.
          </p>
        </div>
      </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Documents</span>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-300">
                  <DatabaseIcon className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{isLoadingFirstPage ? "..." : files.results.length}</span>
                <span className="text-xs text-zinc-500">files loaded</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Index System</span>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-300">
                  <FileTextIcon className="size-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">RAG</span>
                <span className="text-xs text-zinc-500">Vector Indexed</span>
              </div>
            </div>

            <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sync Status</span>
                <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse block" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-400 tracking-tight">Active</span>
                <span className="text-xs text-zinc-500">100% Synced</span>
              </div>
            </div>
          </div>

          {/* Document Table Workspace */}
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
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl h-10 px-4 transition-all duration-300 shadow-md shadow-white/5 active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
              >
                <PlusIcon className="size-4" />
                Add Document
              </Button>
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

                  return filteredResults.map((file) => {
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
        </div>
      </div>
    </>
  );
};

