export function getEditorLanguage(fileName: string): string {
  const extension = fileName
    .split(".")
    .pop()
    ?.toLowerCase();

  switch (extension) {
    case "ts":
      return "typescript";

    case "tsx":
      return "typescript";

    case "js":
      return "javascript";

    case "jsx":
      return "javascript";

    case "py":
      return "python";

    case "rs":
      return "rust";

    case "go":
      return "go";

    case "java":
      return "java";

    case "c":
      return "c";

    case "cpp":
    case "cc":
    case "cxx":
    case "h":
    case "hpp":
      return "cpp";

    case "html":
      return "html";

    case "css":
      return "css";

    case "scss":
      return "scss";

    case "json":
      return "json";

    case "md":
      return "markdown";

    case "sql":
      return "sql";

    case "xml":
      return "xml";

    case "yaml":
    case "yml":
      return "yaml";

    case "sh":
      return "shell";

    default:
      return "plaintext";
  }
}