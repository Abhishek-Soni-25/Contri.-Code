import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
} from "lucide-react";

import type { FileNode } from "../../types/file";
import { cn } from "../../utils/cn";

interface FileTreeProps {
  nodes: FileNode[];

  level?: number;

  activeFilePath: string | null;

  selectedDirectoryPath: string;

  onOpenFile: (node: FileNode) => void;

  onSelectDirectory: (
    path: string,
  ) => void;
}

export function FileTree({
  nodes,
  level = 0,
  activeFilePath,
  selectedDirectoryPath,
  onOpenFile,
  onSelectDirectory,
}: FileTreeProps) {
  return (
    <>
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          level={level}
          activeFilePath={activeFilePath}
          selectedDirectoryPath={
            selectedDirectoryPath
          }
          onOpenFile={onOpenFile}
          onSelectDirectory={
            onSelectDirectory
          }
        />
      ))}
    </>
  );
}

interface TreeNodeProps {
  node: FileNode;

  level: number;

  activeFilePath: string | null;

  selectedDirectoryPath: string;

  onOpenFile: (node: FileNode) => void;

  onSelectDirectory: (
    path: string,
  ) => void;
}

function TreeNode({
  node,
  level,
  activeFilePath,
  selectedDirectoryPath,
  onOpenFile,
  onSelectDirectory,
}: TreeNodeProps) {
  const [expanded, setExpanded] =
    useState(true);

  function handleClick() {
    if (node.isDir) {
      onSelectDirectory(node.path);
      setExpanded((current) => !current);
    } else {
      onOpenFile(node);
    }
  }

  const isActiveFile =
    activeFilePath === node.path;

  const isSelectedDirectory =
    node.isDir &&
    selectedDirectoryPath === node.path;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex h-6 w-full cursor-pointer items-center gap-1 border-0 bg-transparent pr-2 text-left text-[12px] transition",

          isActiveFile &&
            "bg-[#2a2a2a] text-white",

          isSelectedDirectory &&
            !isActiveFile &&
            "bg-[#202020]",

          !isActiveFile &&
            "text-[#c6c6c6] hover:bg-[#222]",
        )}
        style={{
          paddingLeft: `${8 + level * 14}px`,
        }}
      >
        {node.isDir ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}

            {expanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#d7b37c]" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-[#d7b37c]" />
            )}
          </>
        ) : (
          <>
            <span className="w-3 shrink-0" />

            <File className="h-3.5 w-3.5 shrink-0 text-[#bdbdbd]" />
          </>
        )}

        <span className="truncate">
          {node.name}
        </span>
      </button>

      {node.isDir &&
        expanded &&
        node.children.length > 0 && (
          <FileTree
            nodes={node.children}
            level={level + 1}
            activeFilePath={
              activeFilePath
            }
            selectedDirectoryPath={
              selectedDirectoryPath
            }
            onOpenFile={onOpenFile}
            onSelectDirectory={
              onSelectDirectory
            }
          />
        )}
    </>
  );
}